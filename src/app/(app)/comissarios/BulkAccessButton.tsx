"use client";

import { useState, useTransition } from "react";
import { useToastResult } from "@/components/Toast";
import { createPendingAccesses } from "../actions";

// Cria de uma vez o acesso de quem ainda não tem (login = e-mail do HubSpot; senha = primeiro nome + 123).
export function BulkAccessButton({ pending }: { pending: number }) {
  const [confirm, setConfirm] = useState(false);
  const [busy, start] = useTransition();
  const toast = useToastResult();
  const label = `${pending} ${pending === 1 ? "comissário" : "comissários"} sem acesso`;
  return (
    <>
      <button type="button" className="btn primary" onClick={() => setConfirm(true)}>
        Criar acessos ({pending})
      </button>
      {confirm ? (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setConfirm(false)} onKeyDown={(e) => e.key === "Escape" && setConfirm(false)}>
          <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="bulk-title">
            <div className="head">
              <h2 id="bulk-title">Criar acessos ao portal?</h2>
            </div>
            <p>
              {label}. Login: o e-mail do contato no HubSpot. Senha inicial: primeiro nome + 123 (ex.: <strong>gabriel123</strong>). No primeiro acesso, cada um cria a própria senha.
            </p>
            <p className="small muted">Ninguém recebe e-mail. Avise os comissários pelo WhatsApp.</p>
            <div className="foot">
              <button type="button" className="btn ghost" onClick={() => setConfirm(false)} autoFocus>
                Cancelar
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={busy}
                onClick={() =>
                  start(async () => {
                    toast(await createPendingAccesses());
                    setConfirm(false);
                  })
                }
              >
                {busy ? "Criando…" : "Criar acessos"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
