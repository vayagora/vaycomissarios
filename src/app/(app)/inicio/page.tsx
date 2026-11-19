import Link from "next/link";
import { Unlinked } from "@/components/Unlinked";
import { Avatar } from "@/components/ui";
import { categoryStatus } from "@/lib/categories";
import { requireCommissioner } from "@/lib/data";
import { brl, fmtDate, isoInSp, longToday, monthName, monthYear, todayIso } from "@/lib/format";
import { byCompany, programOf } from "@/lib/programs";

export const metadata = { title: "Início" };

export default async function InicioPage() {
  const { data } = await requireCommissioner();
  if (!data) return <Unlinked />;
  const { commissioner: c, categories, entries } = data;
  const today = todayIso();
  const month = today.slice(0, 7);
  const creditedThisMonth = entries
    .filter((e) => e.kind === "acumulo" && isoInSp(e.created_on).startsWith(month))
    .reduce((s, e) => s + e.amount, 0);
  const cats = byCompany(categories.filter((x) => !categoryStatus(x.valid_until, today).ended));
  const [cur, cents] = brl(c.balance).replace("R$ ", "").split(",");

  return (
    <div className="container">
      <header className="page-head">
        <div>
          <span className="eyebrow">{longToday()}</span>
          <h1 className="page-title">Olá, {c.name.split(" ")[0]}</h1>
        </div>
        <Avatar name={c.name} size="md" />
      </header>

      <section className="split">
        <div className="balance grow2">
          <div className="deco1" aria-hidden="true" />
          <div className="deco2" aria-hidden="true" />
          <span className="eyebrow">Créditos de passagem disponíveis</span>
          <div className="amount">
            <span className="cur">R$</span>
            <span className="v">
              {cur}
              {cents ? `,${cents}` : ""}
            </span>
          </div>
          <div className="meta">
            {creditedThisMonth > 0 ? (
              <span>
                <strong>+ {brl(creditedThisMonth)}</strong> creditados em {monthName(today)}
              </span>
            ) : null}
            <span>Seus créditos não expiram</span>
          </div>
          <Link href="/extrato" className="btn-light">
            Ver extrato
          </Link>
        </div>
        <div className="card side-card grow1">
          <span className="eyebrow">Sua parceria</span>
          <div className="facts-list">
            <div>
              <span>Comissário desde</span>
              <strong>{monthYear(c.since)}</strong>
            </div>
            <div>
              <span>Categorias vigentes</span>
              <strong>{cats.length}</strong>
            </div>
            <div>
              <span>Termo vigente até</span>
              <strong>{fmtDate(c.term_end)}</strong>
            </div>
          </div>
          <Link href="/termo">Ver meu termo de parceria →</Link>
        </div>
      </section>

      <section className="section">
        <div className="sec-head">
          <h2 className="section-title">Suas categorias</h2>
          {cats.length ? (
            <Link href="/programas" className="small" style={{ fontWeight: 600 }}>
              Ver todos os benefícios →
            </Link>
          ) : null}
        </div>
        {cats.length ? (
          <div className="grid-progs">
            {cats.map((x) => {
              const st = categoryStatus(x.valid_until, today);
              const p = programOf(x.company);
              return (
                <Link key={x.id} href={`/programas/${p?.slug}`} className={`card prog${st.soon ? " soon" : ""}`}>
                  <div className="top">
                    <span className="name">{x.company}</span>
                    <span className="mono-tile">{p?.initials}</span>
                  </div>
                  <div className="stack" style={{ gap: 2 }}>
                    <span className="tier-l">Categoria</span>
                    <span className="tier">{x.tier}</span>
                  </div>
                  <span className={`valid${st.soon ? " soon" : ""}`}>
                    {st.soon ? `${st.label} · ${fmtDate(x.valid_until)}` : `Válida até ${fmtDate(x.valid_until)}`}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="card empty">Você ainda não tem categorias vigentes.</div>
        )}
      </section>
    </div>
  );
}
