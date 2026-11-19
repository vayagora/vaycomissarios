import { SyncButton } from "@/components/SyncButton";
import { Tip } from "@/components/ui";
import { categoryStatus } from "@/lib/categories";
import { loadAll, requireVay } from "@/lib/data";
import { brl, dm, isoInSp, maskCpf, monthName, monthYear, plural, todayIso, whenLabel } from "@/lib/format";
import { byCompany } from "@/lib/programs";
import { signedAmount } from "@/lib/statement";
import { CommissionersTable, type Row } from "./CommissionersTable";

export const metadata = { title: "Comissários" };

const shortCompany = (c: string) => c.replace(" Pass", "").replace(" Fidelidade", "");

export default async function ComissariosPage() {
  await requireVay();
  const { commissioners, categories, entries, lastSync } = await loadAll();
  const today = todayIso();
  const month = today.slice(0, 7);

  const monthEntries = entries.filter((e) => isoInSp(e.created_on).startsWith(month));
  const accIn = monthEntries.filter((e) => e.kind === "acumulo");
  const usedIn = monthEntries.filter((e) => e.kind === "uso");
  const sum = (l: typeof entries) => l.reduce((s, e) => s + e.amount, 0);
  const newThisMonth = commissioners.filter((c) => c.since.startsWith(month)).length;

  const rows: Row[] = commissioners.map((c) => {
    const cats = byCompany(categories.filter((x) => x.commissioner_id === c.id))
      .map((x) => ({ x, st: categoryStatus(x.valid_until, today) }))
      .filter(({ st }) => !st.ended)
      .map(({ x, st }) => ({
        label: `${shortCompany(x.company)} ${x.tier}${st.soon ? ` · vence ${dm(x.valid_until)}` : ""}`,
        warn: st.soon,
      }));
    const last = entries.find((e) => e.commissioner_id === c.id); // já vem do mais recente ao mais antigo
    return {
      id: c.id,
      name: c.name,
      cpf: maskCpf(c.cpf),
      cpfDigits: c.cpf.replace(/\D/g, ""),
      since: monthYear(c.since),
      programs: cats,
      balance: c.balance,
      last: last
        ? {
            amount: signedAmount(last),
            sub: `${dm(isoInSp(last.created_on))} · ${last.kind === "uso" ? `Uso${last.reason ? ` · ${last.reason}` : ""}` : last.title || last.reason || "Acúmulo"}`,
          }
        : null,
    };
  });

  const mName = monthName(today);
  return (
    <div className="container wide">
      <header className="page-head">
        <div>
          <span className="eyebrow">Gestão de comissários</span>
          <h1 className="page-title">Comissários</h1>
        </div>
        <div className="row">
          <SyncButton last={whenLabel(lastSync)} />
          <Tip>Comissários vêm do HubSpot: contatos com “Comissário” marcado em “Condições Especiais”. Quem for marcado aparece na próxima sincronização; quem for desmarcado sai da lista e perde o acesso ao portal.</Tip>
        </div>
      </header>

      <section className="stats">
        <div className="card stat-card">
          <span className="l">Comissários</span>
          <strong className="v">{commissioners.length}</strong>
          <span className="s">{newThisMonth ? `${plural(newThisMonth, "novo", "novos")} em ${mName}` : `Nenhum novo em ${mName}`}</span>
        </div>
        <div className="card stat-card brand">
          <span className="l">Saldo total em créditos</span>
          <strong className="v">{brl(commissioners.reduce((s, c) => s + c.balance, 0))}</strong>
          <span className="s">Obrigação em aberto da Vay Agora</span>
        </div>
        <div className="card stat-card">
          <span className="l">Créditos acumulados em {mName}</span>
          <strong className="v in">+ {brl(sum(accIn))}</strong>
          <span className="s">{plural(accIn.length, "lançamento", "lançamentos")} no HubSpot</span>
        </div>
        <div className="card stat-card">
          <span className="l">Créditos usados em {mName}</span>
          <strong className="v">− {brl(sum(usedIn))}</strong>
          <span className="s">{plural(usedIn.length, "lançamento de uso", "lançamentos de uso")} no HubSpot</span>
        </div>
      </section>

      <CommissionersTable rows={rows} />
    </div>
  );
}
