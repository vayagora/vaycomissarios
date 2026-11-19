"use server";

// Todas as gravações do sistema. Créditos NUNCA são lançados aqui: só o HubSpot cria e corrige
// lançamentos; o sistema apenas lê (sincronização).
import { revalidatePath } from "next/cache";
import { categoryStatus, validateUntil } from "@/lib/categories";
import { encryptSecret, tempPassword } from "@/lib/crypto";
import { requireSession, requireVay } from "@/lib/data";
import { fmtDate, lower, todayIso } from "@/lib/format";
import { COMPANIES, isValidTier } from "@/lib/programs";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { syncHubspot } from "@/lib/sync";

export type Result = { ok?: string; error?: string } | undefined;

const isEmail = (s: string) => /^\S+@\S+\.\S+$/.test(s);
const isIso = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const firstName = (s: string) => s.trim().split(/\s+/)[0] ?? s;

// ---------------------------------------------------------------- HubSpot

export async function syncNow(commissionerId?: string): Promise<Result> {
  await requireVay();
  const r = await syncHubspot(createAdminClient(), commissionerId);
  revalidatePath("/", "layout");
  if (!r.ok) return { error: `Falha na sincronização: ${r.error}` };
  return { ok: `Tudo atualizado. ${r.message}.` };
}

// ---------------------------------------------------------------- Comissários

// Comissários vêm do HubSpot (sincronização); aqui só se dá acesso ao portal.
// Sem e-mail: o login é o e-mail do contato no HubSpot e a senha provisória é mostrada uma única vez
// para a Vay mandar pelo WhatsApp. No primeiro acesso, o comissário é obrigado a trocá-la.
// Chamar de novo gera outra senha provisória (o comissário que esqueceu a senha).
export async function createPortalAccess(commissionerId: string): Promise<Result & { email?: string; password?: string }> {
  await requireVay();
  const supabase = await createClient();
  const { data: c } = await supabase.from("commissioners").select("id, name, email, in_program").eq("id", commissionerId).single();
  if (!c) return { error: "Comissário não encontrado." };
  if (!c.in_program) return { error: "Sem a marcação “Comissário” no HubSpot: não pode ter acesso." };
  const email = lower(c.email);
  if (!isEmail(email)) return { error: "O contato não tem e-mail válido no HubSpot. Corrija lá e sincronize." };

  const admin = createAdminClient();
  const password = tempPassword();
  const { data: existing } = await admin.from("profiles").select("id, role").eq("email", email).maybeSingle();
  if (existing?.role === "vay") return { error: "Esse e-mail é de um usuário da equipe Vay." };

  let userId = existing?.id as string | undefined;
  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) return { error: `Não foi possível gerar a nova senha: ${error.message}` };
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: c.name } });
    if (error || !data.user) return { error: `Não foi possível criar o acesso: ${error?.message ?? "usuário não criado"}` };
    userId = data.user.id;
  }
  // O papel é gravado pelo servidor, nunca a partir de metadados do usuário.
  const { error: pErr } = await admin
    .from("profiles")
    .update({ role: "comissario", commissioner_id: c.id, full_name: c.name, must_change_password: true })
    .eq("id", userId);
  if (pErr) return { error: `Acesso criado, mas não foi possível ligá-lo ao comissário: ${pErr.message}` };
  revalidatePath("/", "layout");
  return { ok: existing ? "Nova senha provisória gerada." : "Acesso criado.", email, password };
}

// ---------------------------------------------------------------- Categorias de milha

export async function assignCategory(commissionerId: string, company: string, tier: string, validUntil: string): Promise<Result> {
  const s = await requireVay();
  if (!COMPANIES.includes(company)) return { error: "Escolha a empresa." };
  if (!isValidTier(company, tier)) return { error: "Escolha a categoria." };
  const today = todayIso();
  const err = validateUntil(validUntil, today);
  if (err) return { error: err };

  const supabase = await createClient();
  const { data: who } = await supabase.from("commissioners").select("name").eq("id", commissionerId).single();
  if (!who) return { error: "Comissário não encontrado." };
  // Uma categoria por empresa: atribuir de novo substitui a anterior
  const { error } = await supabase
    .from("mile_categories")
    .upsert(
      { commissioner_id: commissionerId, company, tier, valid_until: validUntil, updated_by: s.profile.id, updated_at: new Date().toISOString() },
      { onConflict: "commissioner_id,company" },
    );
  if (error) return { error: "Não foi possível atribuir a categoria." };
  revalidatePath("/", "layout");
  return { ok: `${company} ${tier} atribuída até ${fmtDate(validUntil)}. ${firstName(who.name)} já vê no portal.` };
}

export async function deleteCategory(categoryId: string): Promise<Result> {
  await requireVay();
  const supabase = await createClient();
  const { data, error } = await supabase.from("mile_categories").delete().eq("id", categoryId).select("company, tier, valid_until").maybeSingle();
  if (error) return { error: "Não foi possível excluir a categoria." };
  if (!data) return { error: "Categoria não encontrada." };
  revalidatePath("/", "layout");
  const ended = categoryStatus(data.valid_until, todayIso()).ended;
  return { ok: `Categoria ${data.company} · ${data.tier}${ended ? " (encerrada)" : ""} excluída.` };
}

// ---------------------------------------------------------------- Termo de parceria

export type TermInput = { start: string; end: string; receives: string[]; can: string[]; cannot: string[] };

const cleanList = (l: unknown): string[] =>
  Array.isArray(l) ? l.map((x) => String(x ?? "").trim()).filter(Boolean).slice(0, 50).map((x) => x.slice(0, 500)) : [];

export async function saveTerm(commissionerId: string, t: TermInput): Promise<Result> {
  await requireVay();
  const start = t.start || null;
  const end = t.end || null;
  if ((start && !isIso(start)) || (end && !isIso(end))) return { error: "Data inválida." };
  if (start && end && end < start) return { error: "Confira as datas: o fim está antes do início." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commissioners")
    .update({
      term_start: start,
      term_end: end,
      term_receives: cleanList(t.receives),
      term_can: cleanList(t.can),
      term_cannot: cleanList(t.cannot),
    })
    .eq("id", commissionerId)
    .select("name")
    .single();
  if (error || !data) return { error: "Não foi possível salvar o termo." };
  revalidatePath("/", "layout");
  return { ok: `Termo salvo. ${firstName(data.name)} já vê as novas condições no portal.` };
}

// ---------------------------------------------------------------- Dados de acesso (comissário)

// A senha é cifrada aqui, no servidor, antes de ir para o banco. Só o próprio comissário
// lê a linha (RLS); a equipe Vay não tem acesso a este campo.
export async function saveCredentials(company: string, login: string, password: string): Promise<Result> {
  const s = await requireSession();
  const id = s.profile.commissioner_id;
  if (s.isVay || !id) return { error: "Só o comissário pode guardar os próprios dados de acesso." };
  if (!COMPANIES.includes(company)) return { error: "Programa inválido." };
  let enc: string;
  try {
    enc = encryptSecret(String(password ?? "").slice(0, 500));
  } catch {
    return { error: "Não foi possível guardar a senha agora. Fale com a gente pelo WhatsApp." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("program_credentials").upsert(
    { commissioner_id: id, company, login: String(login ?? "").trim().slice(0, 200), password_enc: enc, updated_at: new Date().toISOString() },
    { onConflict: "commissioner_id,company" },
  );
  if (error) return { error: "Não foi possível salvar os dados de acesso." };
  return { ok: "Dados de acesso salvos." };
}
