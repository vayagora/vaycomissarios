import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import type { Commissioner, CreditEntry, MileCategory, Profile } from "./types";

export type Session = { profile: Profile; isVay: boolean };

export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, commissioner_id, must_change_password")
    .eq("id", user.id)
    .single<Profile>();
  if (!profile) return null;
  return { profile, isVay: profile.role === "vay" };
});

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  return s;
}

export async function requireVay(): Promise<Session> {
  const s = await requireSession();
  if (!s.isVay) redirect("/inicio");
  return s;
}

const normCommissioner = (c: Commissioner): Commissioner => ({
  ...c,
  balance: Number(c.balance),
  term_receives: c.term_receives ?? [],
  term_can: c.term_can ?? [],
  term_cannot: c.term_cannot ?? [],
});
const normEntry = (e: CreditEntry): CreditEntry => ({ ...e, amount: Number(e.amount) });

// Tudo do comissário logado (ou de um comissário, para a Vay). O RLS já filtra o que cada um vê:
// para o comissário, só as categorias vigentes.
export const loadCommissioner = cache(async (id: string) => {
  const supabase = await createClient();
  const [c, cats, entries] = await Promise.all([
    supabase.from("commissioners").select("*").eq("id", id).maybeSingle<Commissioner>(),
    supabase.from("mile_categories").select("*").eq("commissioner_id", id).order("company"),
    supabase.from("credit_entries").select("*").eq("commissioner_id", id).order("created_on", { ascending: false }),
  ]);
  for (const r of [c, cats, entries]) if (r.error) throw new Error(r.error.message);
  if (!c.data) return null;
  return {
    commissioner: normCommissioner(c.data),
    categories: (cats.data ?? []) as MileCategory[],
    entries: ((entries.data ?? []) as CreditEntry[]).map(normEntry),
  };
});

// Portal do comissário: o cadastro ligado ao usuário logado
export async function requireCommissioner() {
  const s = await requireSession();
  if (s.isVay) redirect("/comissarios");
  const id = s.profile.commissioner_id;
  const data = id ? await loadCommissioner(id) : null;
  return { session: s, data };
}

export async function loadAll() {
  const supabase = await createClient();
  const [cs, cats, entries, sync] = await Promise.all([
    supabase.from("commissioners").select("*").eq("in_program", true).order("name"),
    supabase.from("mile_categories").select("*"),
    supabase.from("credit_entries").select("*").order("created_on", { ascending: false }),
    supabase.from("sync_runs").select("ran_at, ok, message").eq("ok", true).order("ran_at", { ascending: false }).limit(1),
  ]);
  for (const r of [cs, cats, entries, sync]) if (r.error) throw new Error(r.error.message);
  return {
    commissioners: ((cs.data ?? []) as Commissioner[]).map(normCommissioner),
    categories: (cats.data ?? []) as MileCategory[],
    entries: ((entries.data ?? []) as CreditEntry[]).map(normEntry),
    lastSync: (sync.data?.[0]?.ran_at as string | undefined) ?? null,
  };
}

export async function lastSyncAt(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("sync_runs").select("ran_at").eq("ok", true).order("ran_at", { ascending: false }).limit(1);
  return (data?.[0]?.ran_at as string | undefined) ?? null;
}

// Acesso ao portal: existe usuário ligado ao comissário? (só a Vay lê os perfis de outros)
export type PortalAccess = { email: string; since: string } | null;
export async function portalAccess(commissionerId: string): Promise<PortalAccess> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("email, created_at")
    .eq("commissioner_id", commissionerId)
    .order("created_at", { ascending: false })
    .limit(1);
  const p = data?.[0];
  return p ? { email: p.email as string, since: p.created_at as string } : null;
}
