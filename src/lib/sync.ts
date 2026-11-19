// Sincronização HubSpot → Supabase (idempotente). Roda com a chave service_role, só no servidor.
// 1. Descobre quem é comissário: contatos associados a algum registro de Créditos com motivo
//    "Programa Comissário". Cria os novos e atualiza nome, e-mail, CPF, saldo e "desde".
// 2. Para cada comissário, espelha todos os registros de Créditos associados (o extrato).
// O HubSpot é a fonte da verdade: lançamento apagado lá some do extrato aqui.
// Comissário que deixa de ter créditos do programa não é apagado (o histórico fica).
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  contactCreditIds,
  creditContacts,
  hubspotConfig,
  planCommissioners,
  readContacts,
  readCredits,
  searchProgramCredits,
  type HsCredit,
  type HubspotConfig,
} from "./hubspot";
import { plural } from "./format";

export type SyncResult =
  | { ok: true; commissioners: number; created: number; entries: number; message: string }
  | { ok: false; error: string };

type Row = { id: string; hubspot_contact_id: string };

export async function syncHubspot(db: SupabaseClient, only?: string, cfg: HubspotConfig | null = hubspotConfig()): Promise<SyncResult> {
  if (!cfg) return { ok: false, error: "HUBSPOT_TOKEN não configurado." };
  try {
    const now = new Date().toISOString();

    // 1. Quem é comissário (só na sincronização completa)
    let created = 0;
    let since = new Map<string, string>();
    if (!only) {
      const program = await searchProgramCredits(cfg);
      since = planCommissioners(program, await creditContacts(cfg, program.map((c) => c.id)));
      const { data: existing, error } = await db.from("commissioners").select("hubspot_contact_id");
      if (error) throw new Error(error.message);
      const known = new Set((existing ?? []).map((r) => r.hubspot_contact_id as string));
      created = [...since.keys()].filter((id) => !known.has(id)).length;
      if (since.size) {
        const { error: e } = await db.from("commissioners").upsert(
          [...since.keys()].map((hubspot_contact_id) => ({ hubspot_contact_id })),
          { onConflict: "hubspot_contact_id", ignoreDuplicates: true },
        );
        if (e) throw new Error(e.message);
      }
    }

    let q = db.from("commissioners").select("id, hubspot_contact_id");
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
        const s = since.get(r.hubspot_contact_id);
        if (s) patch.since = s;
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
      (created ? ` · ${plural(created, "novo comissário importado", "novos comissários importados")}` : "");
    await db.from("sync_runs").insert({ ok: true, message });
    return { ok: true, commissioners: rows.length, created, entries, message };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await db.from("sync_runs").insert({ ok: false, message: error.slice(0, 500) });
    return { ok: false, error };
  }
}
