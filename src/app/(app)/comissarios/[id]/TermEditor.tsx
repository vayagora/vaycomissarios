"use client";

// Termo de parceria definido caso a caso: datas + três listas editáveis.
import { useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { TERM_GROUPS, TermIcon } from "@/components/TermGroups";
import { useToastResult } from "@/components/Toast";
import { Tip } from "@/components/ui";
import { saveTerm, type TermInput } from "../../actions";

type ListKey = "receives" | "can" | "cannot";
const KEY_OF: Record<(typeof TERM_GROUPS)[number]["key"], ListKey> = { term_receives: "receives", term_can: "can", term_cannot: "cannot" };

export function TermEditor({ commissionerId, initial }: { commissionerId: string; initial: TermInput }) {
  const [term, setTerm] = useState<TermInput>(initial);
  const [drafts, setDrafts] = useState<Record<ListKey, string>>({ receives: "", can: "", cannot: "" });
  const [pending, start] = useTransition();
  const toast = useToastResult();
  const dateError = term.start && term.end && term.end < term.start ? "A data final precisa ser depois do início." : "";

  const add = (k: ListKey) => {
    const text = drafts[k].trim();
    if (!text) return;
    setTerm({ ...term, [k]: [...term[k], text] });
    setDrafts({ ...drafts, [k]: "" });
  };
  const remove = (k: ListKey, i: number) => setTerm({ ...term, [k]: term[k].filter((_, j) => j !== i) });

  const save = () =>
    start(async () => {
      // Item digitado e não adicionado também entra
      const withDrafts = { ...term };
      for (const k of ["receives", "can", "cannot"] as ListKey[]) if (drafts[k].trim()) withDrafts[k] = [...term[k], drafts[k].trim()];
      const r = await saveTerm(commissionerId, withDrafts);
      toast(r);
      if (r?.ok) {
        setTerm(withDrafts);
        setDrafts({ receives: "", can: "", cannot: "" });
      }
    });

  return (
    <section className="section" aria-labelledby="termo-title">
      <div className="sec-head">
        <div className="ttl">
          <h2 id="termo-title" className="section-title">Termo de parceria</h2>
          <Tip>O que for definido aqui aparece para o comissário em “Meu termo de parceria”.</Tip>
        </div>
        <button type="button" className="btn primary" disabled={pending || !!dateError} onClick={save}>
          {pending ? "Salvando…" : "Salvar termo"}
        </button>
      </div>
      <div className="form-grid" style={{ maxWidth: 520 }}>
        <div className="field">
          <label htmlFor="t-start">Início</label>
          <input id="t-start" type="date" className="input" value={term.start} onChange={(e) => setTerm({ ...term, start: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="t-end">Vigente até</label>
          <input
            id="t-end"
            type="date"
            className="input"
            min={term.start || undefined}
            value={term.end}
            aria-invalid={dateError ? true : undefined}
            aria-describedby={dateError ? "t-end-err" : undefined}
            onChange={(e) => setTerm({ ...term, end: e.target.value })}
          />
          {dateError ? <span id="t-end-err" className="err">{dateError}</span> : null}
        </div>
      </div>
      <div className="grid-terms">
        {TERM_GROUPS.map((g) => {
          const k = KEY_OF[g.key];
          return (
            <div key={g.key} className={`card term ${g.cls}`}>
              <div className="h">
                <TermIcon name={g.icon} />
                <h3>{g.adminTitle}</h3>
              </div>
              {term[k].length ? (
                <ul>
                  {term[k].map((text, i) => (
                    <li key={`${i}-${text}`}>
                      <span className="dot" aria-hidden="true" />
                      <span className="txt">{text}</span>
                      <button type="button" className="rm" aria-label={`Remover item: ${text}`} onClick={() => remove(k, i)}>
                        <Icon name="x" size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted small">Nenhum item.</p>
              )}
              <form
                className="add"
                onSubmit={(e) => {
                  e.preventDefault();
                  add(k);
                }}
              >
                <div className="field">
                  <label htmlFor={`new-${k}`}>Novo item</label>
                  <input id={`new-${k}`} className="input" placeholder={g.placeholder} value={drafts[k]} onChange={(e) => setDrafts({ ...drafts, [k]: e.target.value })} />
                </div>
                <button type="submit" className="btn outline">
                  Adicionar
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </section>
  );
}
