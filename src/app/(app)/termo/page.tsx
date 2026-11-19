import { TERM_GROUPS, TermIcon } from "@/components/TermGroups";
import { Unlinked } from "@/components/Unlinked";
import { requireCommissioner } from "@/lib/data";
import { fmtDate } from "@/lib/format";

export const metadata = { title: "Meu termo de parceria" };

export default async function TermoPage() {
  const { data } = await requireCommissioner();
  if (!data) return <Unlinked />;
  const c = data.commissioner;
  return (
    <div className="container">
      <header className="page-head">
        <h1 className="page-title">Meu termo de parceria</h1>
      </header>
      <section className="dates" aria-label="Vigência">
        <div className="card date-card">
          <span className="muted">Início</span>
          <strong>{fmtDate(c.term_start)}</strong>
        </div>
        <div className="card date-card">
          <span className="muted">Vigente até</span>
          <strong>{fmtDate(c.term_end)}</strong>
        </div>
      </section>
      <section className="grid-terms">
        {TERM_GROUPS.map((g) => (
          <div key={g.key} className={`card term ${g.cls}`}>
            <div className="h">
              <TermIcon name={g.icon} />
              <h2>{g.title}</h2>
            </div>
            {c[g.key].length ? (
              <ul>
                {c[g.key].map((item, i) => (
                  <li key={i}>
                    <span className="dot" aria-hidden="true" />
                    <span className="txt">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted small">Nada definido ainda.</p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
