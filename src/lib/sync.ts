// Sincronização HubSpot → Supabase (idempotente). Roda com a chave service_role, só no servidor.
// 1. Quem é comissário: contatos com "Comissário" marcado em "Condições Especiais". Os novos são
//    criados; quem perdeu a marcação fica com in_program = false (sai da lista e do portal, mas
//    categorias e termo ficam guardados).
// 2. Para cada comissário: nome, e-mail, CPF, saldo e todos os registros de Créditos associados
//    (o extrato). Lançamento apagado no HubSpot some do extrato aqui.
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  contactCreditIds,
  hubspotConfig,
  readContacts,
  readCredits,
  searchCommissionerContacts,
  sinceFromCredits,
  type HsCredit,
  type HubspotConfig,
} from "./hubspot";
import { plural } from "./format";

export type SyncResult =
  | { ok: true; commissioners: number; created: number; removed: number; entries: number; message: string }
  | { ok: false; error: string };

type Row = { id: string; hubspot_contact_id: string };

export async function syncHubspot(db: SupabaseClient, only?: string, cfg: HubspotConfig | null = hubspotConfig()): Promise<SyncResult> {
  if (!cfg) return { ok: false, error: "HUBSPOT_TOKEN não configurado." };
  try {
    const now = new Date().toISOString();
    let created = 0;
    let removed = 0;

    // 1. Quem é comissário (só na sincronização completa)
    if (!only) {
      const flagged = await searchCommissionerContacts(cfg);
      const ids = new Set(flagged.map((c) => c.id));
      const { data: existing, error } = await db.from("commissioners").select("id, hubspot_contact_id, in_program");
      if (error) throw new Error(error.message);
      const known = new Map((existing ?? []).map((r) => [r.hubspot_contact_id as string, r as { id: string; in_program: boolean }]));
      created = flagged.filter((c) => !known.has(c.id)).length;
      if (flagged.length) {
        const { error: e } = await db.from("commissioners").upsert(
          flagged.map((c) => ({ hubspot_contact_id: c.id, name: c.name || c.email, email: c.email, in_program: true })),
          { onConflict: "hubspot_contact_id" },
        );
        if (e) throw new Error(e.message);
      }
      const gone = [...known.entries()].filter(([hs, r]) => r.in_program && !ids.has(hs)).map(([, r]) => r.id);
      if (gone.length) {
        const { error: e } = await db.from("commissioners").update({ in_program: false }).in("id", gone);
        if (e) throw new Error(e.message);
      }
      removed = gone.length;
    }

    let q = db.from("commissioners").select("id, hubspot_contact_id").eq("in_program", true);
    if (only) q = q.eq("id", only);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as Row[];

    // 2. Dados do contato e extrato
    const contactIds = rows.map((r) => r.hubspot_contact_id);
    const [contacts, assoc] = await Promise.all([readContacts(cfg, contactIds), contactCreditIds(cfg, contactIds)]);
    const credits = await readCredits(cfg, [...assoc.values()].flat());

    let entries = 0;
    for (const r of rows) {
      const contact = contacts.get(r.hubspot_contact_id);
      const list = (assoc.get(r.hubspot_contact_id) ?? []).map((id) => credits.get(id)).filter((x): x is HsCredit => !!x);
      if (contact) {
        const patch: Record<string, unknown> = {
          name: contact.name || contact.email,
          email: contact.email,
          cpf: contact.cpf,
          balance: contact.balance,
          balance_synced_at: now,
        };
        const since = sinceFromCredits(list);
        if (since) patch.since = since;
        const { error: e } = await db.from("commissioners").update(patch).eq("id", r.id);
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
      `${plural(rows.length, "comissário atualizado", "comissários atualizados")} · ${plural(entries, "lançamento", "lançamentos")}` +
      (created ? ` · ${plural(created, "novo comissário", "novos comissários")}` : "") +
      (removed ? ` · ${plural(removed, "saiu", "saíram")} do programa (sem a marcação no HubSpot)` : "");
    await db.from("sync_runs").insert({ ok: true, message });
    return { ok: true, commissioners: rows.length, created, removed, entries, message };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await db.from("sync_runs").insert({ ok: false, message: error.slice(0, 500) });
    return { ok: false, error };
  }
}
