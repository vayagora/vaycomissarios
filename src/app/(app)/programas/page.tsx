import Link from "next/link";
import { Unlinked } from "@/components/Unlinked";
import { categoryStatus } from "@/lib/categories";
import { requireCommissioner } from "@/lib/data";
import { fmtDate, todayIso } from "@/lib/format";
import { byCompany, programOf } from "@/lib/programs";

export const metadata = { title: "Meus programas" };

export default async function ProgramasPage() {
  const { data } = await requireCommissioner();
  if (!data) return <Unlinked />;
  const today = todayIso();
  const cats = byCompany(data.categories.filter((x) => !categoryStatus(x.valid_until, today).ended));
  return (
    <div className="container">
      <header className="page-head">
        <h1 className="page-title">Meus programas</h1>
      </header>
      {cats.length ? (
        <div className="grid-progs">
          {cats.map((x) => {
            const st = categoryStatus(x.valid_until, today);
            const p = programOf(x.company);
            return (
              <article key={x.id} className={`card prog${st.soon ? " soon" : ""}`}>
                <div className="top">
                  <h2 className="name">{x.company}</h2>
                  <span className="mono-tile">{p?.initials}</span>
                </div>
                <div className="stack" style={{ gap: 2 }}>
                  <span className="tier-l">Categoria</span>
                  <span className="tier">{x.tier}</span>
                </div>
                <span className={`valid${st.soon ? " soon" : ""}`}>
                  {st.soon ? `${st.label} · ${fmtDate(x.valid_until)}` : `Válida até ${fmtDate(x.valid_until)}`}
                </span>
                <Link href={`/programas/${p?.slug}`} className="btn outline" style={{ alignSelf: "flex-start" }}>
                  Ver detalhes
                </Link>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="card empty">Você ainda não tem categorias vigentes.</div>
      )}
    </div>
  );
}
