"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { useToastResult } from "@/components/Toast";
import { createCommissioner } from "../actions";

export function NewCommissioner() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();
  const toast = useToastResult();
  const router = useRouter();

  return (
    <>
      <button type="button" className="btn primary" onClick={() => { setError(""); setOpen(true); }}>
        Cadastrar comissário
      </button>
      {open ? (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setOpen(false)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
          <form
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-title"
            action={(f) =>
              start(async () => {
                const r = await createCommissioner(undefined, f);
                if (r?.error) return setError(r.error);
                setOpen(false);
                toast(r);
                if (r?.id) router.push(`/comissarios/${r.id}`);
              })
            }
          >
            <div className="head">
              <div className="stack" style={{ gap: 4 }}>
                <h2 id="new-title">Cadastrar comissário</h2>
                <p className="muted small">Enviamos um convite de acesso para o e-mail. Saldo, CPF e extrato vêm do contato com o mesmo e-mail no HubSpot.</p>
              </div>
              <button type="button" className="x" aria-label="Fechar" onClick={() => setOpen(false)}>
                <Icon name="x" />
              </button>
            </div>
            <div className="field">
              <label htmlFor="nc-name">Nome completo</label>
              <input id="nc-name" name="name" className="input" required autoFocus />
            </div>
            <div className="field">
              <label htmlFor="nc-email">E-mail</label>
              <input id="nc-email" name="email" type="email" className="input" required />
            </div>
            <div className="field">
              <label htmlFor="nc-since">Comissário desde</label>
              <input id="nc-since" name="since" type="date" className="input" />
              <span className="hint">Em branco: hoje.</span>
            </div>
            {error ? <div className="error" role="alert">{error}</div> : null}
            <div className="foot">
              <button type="button" className="btn ghost" onClick={() => setOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn primary" disabled={pending}>
                {pending ? "Cadastrando…" : "Cadastrar e convidar"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
