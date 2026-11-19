// Sincronização HubSpot → Supabase (idempotente). Roda com a chave service_role, só no servidor.
// Para cada comissário: saldo e CPF do contato + todos os registros de Créditos associados.
// O HubSpot é a fonte da verdade: lançamento apagado lá some do extrato aqui.
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  contactCreditIds,
  findContactByEmail,
  hubspotConfig,
  readContacts,
  readCredits,
  type HubspotConfig,
} from "./hubspot";
import { plural } from "./format";

export type SyncResult =
  | { ok: true; commissioners: number; entries: number; linked: number; unlinked: string[]; message: string }
  | { ok: false; error: string };

type Row = { id: string; name: string; email: string; hubspot_contact_id: string | null };

export async function syncHubspot(db: SupabaseClient, only?: string, cfg: HubspotConfig | null = hubspotConfig()): Promise<SyncResult> {
  if (!cfg) return { ok: false, error: "HUBSPOT_TOKEN não configurado." };
  try {
    let q = db.from("commissioners").select("id, name, email, hubspot_contact_id");
    if (only) q = q.eq("id", only);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Row[];

    // Comissário ainda sem contato: tenta achar pelo e-mail
    let linked = 0;
    const unlinked: string[] = [];
    for (const r of rows.filter((x) => !x.hubspot_contact_id)) {
      const c = await findContactByEmail(cfg, r.email);
      if (!c) {
        unlinked.push(r.name);
        continue;
      }
      const { error: e } = await db.from("commissioners").update({ hubspot_contact_id: c.id }).eq("id", r.id);
      if (e) throw new Error(e.message);
      r.hubspot_contact_id = c.id;
      linked++;
    }

    const withContact = rows.filter((r) => r.hubspot_contact_id) as (Row & { hubspot_contact_id: string })[];
    const contactIds = withContact.map((r) => r.hubspot_contact_id);
    const [contacts, assoc] = await Promise.all([readContacts(cfg, contactIds), contactCreditIds(cfg, contactIds)]);
    const credits = await readCredits(cfg, [...assoc.values()].flat());
    const now = new Date().toISOString();

    let entries = 0;
    for (const r of withContact) {
      const contact = contacts.get(r.hubspot_contact_id);
      const ids = assoc.get(r.hubspot_contact_id) ?? [];
      const list = ids.map((id) => credits.get(id)).filter((x) => !!x);
      if (contact) {
        const { error: e } = await db
          .from("commissioners")
          .update({ balance: contact.balance, cpf: contact.cpf, balance_synced_at: now })
          .eq("id", r.id);
        if (e) throw new Error(e.message);
      }
      if (list.length) {
        const { error: e } = await db
          .from("credit_entries")
          .upsert(list.map((c) => ({ ...c, commissioner_id: r.id, synced_at: now })), { onConflict: "hubspot_id" });
        if (e) throw new Error(e.message);
      }
      // Remove o que não está mais associado no HubSpot
      let del = db.from("credit_entries").delete().eq("commissioner_id", r.id);
      if (list.length) del = del.not("hubspot_id", "in", `(${list.map((c) => `"${c.hubspot_id}"`).join(",")})`);
      const { error: de } = await del;
      if (de) throw new Error(de.message);
      entries += list.length;
    }

    const message =
      `${plural(withContact.length, "comissário atualizado", "comissários atualizados")} · ${plural(entries, "lançamento", "lançamentos")}` +
      (linked ? ` · ${plural(linked, "contato vinculado", "contatos vinculados")} pelo e-mail` : "") +
      (unlinked.length ? ` · sem contato no HubSpot: ${unlinked.slice(0, 5).join(", ")}${unlinked.length > 5 ? "…" : ""}` : "");
    await db.from("sync_runs").insert({ ok: true, message });
    return { ok: true, commissioners: withContact.length, entries, linked, unlinked, message };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await db.from("sync_runs").insert({ ok: false, message: error.slice(0, 500) });
    return { ok: false, error };
  }
}
