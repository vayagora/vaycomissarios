"use client";

// Categorias de milha do comissário (painel Vay): atribuir, alterar, excluir e recadastrar.
import { createContext, useContext, useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { useToastResult } from "@/components/Toast";
import { Badge, Tip } from "@/components/ui";
import { validateUntil } from "@/lib/categories";
import { fmtDate, todayIso } from "@/lib/format";
import { COMPANIES, programOf } from "@/lib/programs";
import { assignCategory, deleteCategory } from "../../actions";

export type CatView = { id: string; company: string; tier: string; validUntil: string; ended: boolean; soon: boolean; label: string };
type Props = { commissionerId: string; name: string; cats: CatView[] };

type Ctx = Props & { open: (preset?: { company: string; tier: string }) => void; askDelete: (c: CatView) => void };
const CatCtx = createContext<Ctx | null>(null);
const useCat = () => {
  const c = useContext(CatCtx);
  if (!c) throw new Error("CategoriesProvider ausente");
  return c;
};

// Guarda o estado do modal e da confirmação; envolve a página para o botão do cabeçalho e a seção
export function CategoriesProvider({ commissionerId, name, cats, children }: Props & { children: React.ReactNode }) {
  const [modal, setModal] = useState<{ company: string; tier: string } | null>(null);
  const [del, setDel] = useState<CatView | null>(null);
  const ctx: Ctx = { commissionerId, name, cats, open: (p) => setModal(p ?? { company: "", tier: "" }), askDelete: setDel };
  return (
    <CatCtx.Provider value={ctx}>
      {children}
      {modal ? <AssignModal commissionerId={commissionerId} name={name} cats={cats} preset={modal} onClose={() => setModal(null)} /> : null}
      {del ? <DeleteDialog cat={del} name={name} onClose={() => setDel(null)} /> : null}
    </CatCtx.Provider>
  );
}

export function AssignButton() {
  const { open } = useCat();
  return (
    <button type="button" className="btn primary" onClick={() => open()}>
      Atribuir categoria de milha
    </button>
  );
}

export function CategoriesSection() {
  const { name, cats, open, askDelete: setDel } = useCat();
  const active = cats.filter((c) => !c.ended);
  const ended = cats.filter((c) => c.ended);
  const first = name.split(" ")[0];

  return (
    <>
      <section className="section" aria-labelledby="cat-title">
        <div className="ttl">
          <h2 id="cat-title" className="section-title">Categorias de milha</h2>
          <Tip>Só as categorias vigentes aparecem para o comissário. Depois da data de validade, a categoria é encerrada automaticamente e precisa ser recadastrada.</Tip>
        </div>
        {!active.length ? <p className="muted">Nenhuma categoria vigente. {first} não vê categorias no portal.</p> : null}
        {active.length ? (
          <div className="grid-cats">
            {active.map((c) => (
              <div key={c.id} className={`card cat${c.soon ? " soon" : ""}`}>
                <div className="top">
                  <span className="co">{c.company}</span>
                  <Badge tone={c.soon ? "yellow" : "success"} dot>
                    {c.label}
                  </Badge>
                </div>
                <strong className="tier">{c.tier}</strong>
                <span className={`valid${c.soon ? " soon" : ""}`}>Válida até {fmtDate(c.validUntil)}</span>
                <div className="acts">
                  <button type="button" className="linkbtn" onClick={() => open({ company: c.company, tier: c.tier })}>
                    Alterar
                  </button>
                  <button type="button" className="linkbtn danger" onClick={() => setDel(c)}>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        {ended.length ? (
          <div className="ended">
            <span className="eyebrow">Encerradas</span>
            {ended.map((c) => (
              <div key={c.id} className="ended-row">
                <span>
                  <strong className="strong">
                    {c.company} · {c.tier}
                  </strong>{" "}
                  <span className="muted">· encerrada em {fmtDate(c.validUntil)}</span>
                </span>
                <div className="row" style={{ gap: 8 }}>
                  <button type="button" className="btn ghost sm" onClick={() => setDel(c)}>
                    Excluir
                  </button>
                  <button type="button" className="btn secondary sm" onClick={() => open({ company: c.company, tier: c.tier })}>
                    Recadastrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}

function AssignModal({ commissionerId, name, cats, preset, onClose }: Props & { preset: { company: string; tier: string }; onClose: () => void }) {
  const [company, setCompany] = useState(preset.company);
  const [tier, setTier] = useState(preset.tier);
  const [until, setUntil] = useState("");
  const [touched, setTouched] = useState(false);
  const [pending, start] = useTransition();
  const toast = useToastResult();
  const today = todayIso();
  const tiers = company ? programOf(company)?.tiers ?? [] : [];
  const untilError = validateUntil(until, today);
  const showUntilError = (touched || !!until) && untilError;
  const existing = cats.find((c) => c.company === company);
  const canConfirm = !!company && !!tier && !untilError && !pending;

  const confirm = () => {
    setTouched(true);
    if (!canConfirm) return;
    start(async () => {
      const r = await assignCategory(commissionerId, company, tier, until);
      toast(r);
      if (r?.ok) onClose();
    });
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="cat-modal-title">
        <div className="head">
          <div className="stack" style={{ gap: 4 }}>
            <h2 id="cat-modal-title">Atribuir categoria de milha</h2>
            <p className="muted small">Para {name}</p>
          </div>
          <button type="button" className="x" aria-label="Fechar" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="field">
          <label htmlFor="f-company">Empresa</label>
          <select id="f-company" className="select" value={company} autoFocus onChange={(e) => { setCompany(e.target.value); setTier(""); }}>
            <option value="">Selecione a empresa</option>
            {COMPANIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-tier">Categoria</label>
          <select id="f-tier" className="select" value={tier} disabled={!company} onChange={(e) => setTier(e.target.value)}>
            <option value="">{company ? "Selecione a categoria" : "Escolha a empresa primeiro"}</option>
            {tiers.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-until">Validade da categoria</label>
          <input
            id="f-until"
            type="date"
            className="input"
            required
            min={today}
            value={until}
            aria-invalid={showUntilError ? true : undefined}
            aria-describedby="f-until-help"
            onChange={(e) => setUntil(e.target.value)}
            onBlur={() => setTouched(true)}
          />
          {showUntilError ? (
            <span id="f-until-help" className="err">{untilError}</span>
          ) : (
            <span id="f-until-help" className="hint">Depois da data de validade, a categoria some do portal do comissário.</span>
          )}
        </div>
        {existing ? (
          <p className="warn">
            Substitui a categoria atual nesta empresa: {existing.tier}, {existing.ended ? "encerrada em" : "válida até"} {fmtDate(existing.validUntil)}.
          </p>
        ) : null}
        <div className="foot">
          <button type="button" className="btn ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn primary" disabled={!canConfirm} onClick={confirm}>
            {pending ? "Atribuindo…" : "Atribuir categoria"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteDialog({ cat, name, onClose }: { cat: CatView; name: string; onClose: () => void }) {
  const [pending, start] = useTransition();
  const toast = useToastResult();
  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()} onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <div className="dialog alert" role="alertdialog" aria-modal="true" aria-labelledby="del-title" aria-describedby="del-desc">
        <span className="bin" aria-hidden="true">
          <Icon name="trash" />
        </span>
        <div className="body">
          <h2 id="del-title" style={{ fontSize: 20 }}>Excluir categoria?</h2>
          <p id="del-desc">
            Você vai excluir{" "}
            <strong>
              {cat.company} · {cat.tier}
            </strong>{" "}
            de {name}.{cat.ended ? "" : " Ela deixa de aparecer no portal do comissário."}
          </p>
          <p className="danger-txt">Esta ação não pode ser desfeita.</p>
        </div>
        <div className="foot">
          <button type="button" className="btn ghost" onClick={onClose} autoFocus>
            Cancelar
          </button>
          <button
            type="button"
            className="btn danger"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await deleteCategory(cat.id);
                toast(r);
                onClose();
              })
            }
          >
            {pending ? "Excluindo…" : "Excluir categoria"}
          </button>
        </div>
      </div>
    </div>
  );
}
