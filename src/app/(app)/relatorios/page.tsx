import { requireVay } from "@/lib/data";

export const metadata = { title: "Relatórios de créditos" };

// Tela ainda não desenhada (pendência do handoff).
export default async function RelatoriosPage() {
  await requireVay();
  return (
    <div className="container wide">
      <header className="page-head">
        <h1 className="page-title">Relatórios de créditos</h1>
      </header>
      <div className="card empty">Esta tela ainda está sendo desenhada.</div>
    </div>
  );
}
