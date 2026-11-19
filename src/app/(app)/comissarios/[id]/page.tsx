import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Statement } from "@/components/Statement";
import { SyncButton } from "@/components/SyncButton";
import { Avatar, Tip } from "@/components/ui";
import { categoryStatus } from "@/lib/categories";
import { lastSyncAt, loadCommissioner, portalAccess, requireVay } from "@/lib/data";
import { brl, fmtDate, maskCpf, monthYear, todayIso, whenLabel } from "@/lib/format";
import { contactUrl } from "@/lib/hubspot";
import { byCompany } from "@/lib/programs";
import { buildStatement, totals } from "@/lib/statement";
import { AccessButton } from "./AccessButton";
import { AssignButton, CategoriesProvider, CategoriesSection, type CatView } from "./Categories";
import { TermEditor } from "./TermEditor";

export default async function ComissarioPage({ params }: { params: Promise<{ id: string }> }) {
  await requireVay();
  const { id } = await params;
  const data = await loadCommissioner(id);
  if (!data) notFound();
  const { commissioner: c, categories, entries } = data;
  const today = todayIso();
  const t = totals(entries);
  const [last, access] = await Promise.all([lastSyncAt(), portalAccess(c.id)]);
  const syncedLabel = whenLabel(c.balance_synced_at ?? last);

  const cats: CatView[] = byCompany(categories).map((x) => {
    const st = categoryStatus(x.valid_until, today);
    return { id: x.id, company: x.company, tier: x.tier, validUntil: x.valid_until, ended: st.ended, soon: st.soon, label: st.label };
  });

  return (
    <CategoriesProvider commissionerId={c.id} name={c.name} cats={cats}>
    <div className="container wide">
      <Link href="/comissarios" className="back">
        <Icon name="back" size={18} />
        Comissários
      </Link>

      <header className="page-head">
        <div className="row" style={{ gap: 16, flexWrap: "nowrap" }}>
          <Avatar name={c.name} size="lg" />
          <div className="stack" style={{ gap: 4 }}>
            <h1 className="page-title">{c.name}</h1>
            <span className="muted small">
              CPF {maskCpf(c.cpf)} · comissário desde {monthYear(c.since)} · termo de {fmtDate(c.term_start)} até {fmtDate(c.term_end)}
            </span>
          </div>
        </div>
        <div className="row">
          {c.in_program ? (
            <AccessButton commissionerId={c.id} name={c.name} email={c.email} access={access} />
          ) : (
            <span className="row" style={{ gap: 6 }}>
              <span className="badge yellow">Sem a marcação “Comissário” no HubSpot</span>
              <Tip>Este contato não está mais marcado como comissário em “Condições Especiais”. Ele não aparece na lista e não acessa o portal. Categorias e termo continuam guardados.</Tip>
            </span>
          )}
          <a href={contactUrl(c.hubspot_contact_id)} target="_blank" rel="noreferrer" className="btn outline">
            <Icon name="external" size={18} />
            Abrir no HubSpot
          </a>
          <AssignButton />
        </div>
      </header>

      <section className="stats">
        <div className="card stat-card brand">
          <span className="ttl l">
            Saldo em créditos <Tip>Campo “Saldo atual em créditos” do contato no HubSpot.</Tip>
          </span>
          <strong className="v">{brl(c.balance)}</strong>
          <span className="s">Igual ao que o comissário vê no portal</span>
        </div>
        <div className="card stat-card">
          <span className="l">Total acumulado</span>
          <strong className="v in">+ {brl(t.accumulated)}</strong>
          <span className="s">Lançamentos de acúmulo</span>
        </div>
        <div className="card stat-card">
          <span className="l">Total usado</span>
          <strong className="v">− {brl(t.used)}</strong>
          <span className="s">Lançamentos de uso</span>
        </div>
        <div className="card stat-card">
          <span className="l">HubSpot</span>
          <SyncButton last={syncedLabel} commissionerId={c.id} size="sm" />
        </div>
      </section>

      <CategoriesSection />

      <TermEditor
        commissionerId={c.id}
        initial={{ start: c.term_start ?? "", end: c.term_end ?? "", receives: c.term_receives, can: c.term_can, cannot: c.term_cannot }}
      />

      <section className="section">
        <div className="sec-head">
          <div className="ttl">
            <h2 className="section-title">Extrato de créditos</h2>
            <Tip>Cada registro da seção “Créditos” do contato no HubSpot vira um lançamento aqui. Lançamentos são criados e corrigidos só no HubSpot.</Tip>
          </div>
        </div>
        <Statement rows={buildStatement(c.balance, entries)} mode="vay" />
      </section>
    </div>
    </CategoriesProvider>
  );
}
