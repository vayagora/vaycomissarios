import { Statement } from "@/components/Statement";
import { Unlinked } from "@/components/Unlinked";
import { requireCommissioner } from "@/lib/data";
import { brl, monthYear } from "@/lib/format";
import { buildStatement, totals } from "@/lib/statement";

export const metadata = { title: "Extrato" };

export default async function ExtratoPage() {
  const { data } = await requireCommissioner();
  if (!data) return <Unlinked />;
  const { commissioner: c, entries } = data;
  const t = totals(entries);
  const since = `Desde ${monthYear(c.since)}`;
  return (
    <div className="container">
      <header className="page-head">
        <h1 className="page-title">Extrato</h1>
      </header>
      <section className="stats">
        <div className="card stat-card brand">
          <span className="l">Saldo disponível</span>
          <strong className="v">{brl(c.balance)}</strong>
          <span className="s">Sem data de expiração</span>
        </div>
        <div className="card stat-card">
          <span className="l">Total acumulado</span>
          <strong className="v in">{brl(t.accumulated)}</strong>
          <span className="s">{since}</span>
        </div>
        <div className="card stat-card">
          <span className="l">Total usado</span>
          <strong className="v">{brl(t.used)}</strong>
          <span className="s">{since}</span>
        </div>
      </section>
      <section className="section" aria-label="Movimentações">
        <Statement rows={buildStatement(c.balance, entries)} mode="comissario" />
      </section>
    </div>
  );
}
