"use client";

// Acesso ao portal sem e-mail: a Vay cria o login e manda a senha provisória pelo WhatsApp.
import { useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { useToastResult } from "@/components/Toast";
import { Badge, Tip } from "@/components/ui";
import type { PortalAccess } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { createPortalAccess } from "../../actions";

export function AccessButton({ commissionerId, name, email, access }: { commissionerId: string; name: string; email: string; access: PortalAccess }) {
  const [pending, start] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [shown, setShown] = useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const toast = useToastResult();
  const first = name.split(" ")[0];

  const run = () =>
    start(async () => {
      const r = await createPortalAccess(commissionerId);
      setConfirm(false);
      if (r?.password && r.email) {
        setCopied(false);
        setShown({ email: r.email, password: r.password });
      } else toast(r);
    });

  const message = shown
    ? `Olá, ${first}! Seu acesso ao Portal do Comissário da Vay Agora:\n${typeof window !== "undefined" ? window.location.origin : ""}\nLogin: ${shown.email}\nSenha provisória: ${shown.password}\nNo primeiro acesso, você cria a sua própria senha.`
    : "";

  return (
    <>
      {access ? (
        <span className="row" style={{ gap: 6 }}>
          <Badge tone="success" dot>
            Com acesso ao portal
          </Badge>
          <Tip>{`Login ${access.email}, criado em ${fmtDate(access.since)}.`}</Tip>
          <button type="button" className="linkbtn" disabled={pending} onClick={() => setConfirm(true)}>
            Gerar nova senha
          </button>
        </span>
      ) : (
        <button type="button" className="btn secondary" disabled={pending || !email} onClick={run} title={email ? undefined : "Contato sem e-mail no HubSpot"}>
          {pending ? "Criando…" : "Criar acesso ao portal"}
        </button>
      )}

      {confirm ? (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && setConfirm(false)} onKeyDown={(e) => e.key === "Escape" && setConfirm(false)}>
          <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="pw-title">
            <div className="head">
              <h2 id="pw-title">Gerar nova senha?</h2>
            </div>
            <p>A senha atual de {name} deixa de funcionar. Mande a nova pelo WhatsApp; no próximo acesso, {first} cria a própria senha.</p>
            <div className="foot">
              <button type="button" className="btn ghost" onClick={() => setConfirm(false)} autoFocus>
                Cancelar
              </button>
              <button type="button" className="btn primary" disabled={pending} onClick={run}>
                {pending ? "Gerando…" : "Gerar nova senha"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {shown ? (
        <div className="overlay">
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="sent-title">
            <div className="head">
              <div className="stack" style={{ gap: 4 }}>
                <h2 id="sent-title">Acesso de {first}</h2>
                <p className="muted small">A senha provisória aparece só agora. Copie e mande pelo WhatsApp.</p>
              </div>
              <button type="button" className="x" aria-label="Fechar" onClick={() => setShown(null)}>
                <Icon name="x" />
              </button>
            </div>
            <dl className="facts-list" style={{ margin: 0 }}>
              <div>
                <dt>Login</dt>
                <dd style={{ margin: 0 }}>
                  <strong>{shown.email}</strong>
                </dd>
              </div>
              <div>
                <dt>Senha provisória</dt>
                <dd style={{ margin: 0 }}>
                  <strong style={{ fontFamily: "var(--font-mono)", fontSize: 18, letterSpacing: ".04em" }}>{shown.password}</strong>
                </dd>
              </div>
            </dl>
            <div className="foot">
              <button
                type="button"
                className="btn primary"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(message);
                    setCopied(true);
                  } catch {
                    setCopied(false);
                  }
                }}
              >
                {copied ? "Mensagem copiada" : "Copiar mensagem para o WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
