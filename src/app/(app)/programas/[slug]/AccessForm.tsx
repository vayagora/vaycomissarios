"use client";

import { useState, useTransition } from "react";
import { useToastResult } from "@/components/Toast";
import { Badge } from "@/components/ui";
import { saveCredentials } from "../../actions";

export function AccessForm(props: { company: string; initialLogin: string; initialPassword: string; saved: boolean; unreadable: boolean }) {
  const [login, setLogin] = useState(props.initialLogin);
  const [pass, setPass] = useState(props.initialPassword);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(props.saved && !props.unreadable);
  const [pending, start] = useTransition();
  const toast = useToastResult();

  const save = () =>
    start(async () => {
      const r = await saveCredentials(props.company, login, pass);
      toast(r);
      if (r?.ok) {
        setSaved(true);
        setShow(false);
      }
    });

  return (
    <section className="card pad stack" aria-labelledby="acesso-title">
      <div className="sec-head">
        <div className="stack" style={{ gap: 4 }}>
          <h2 id="acesso-title" className="section-title">Seus dados de acesso</h2>
          <p className="muted">Guarde aqui o login e a senha do {props.company} para consultar quando precisar.</p>
        </div>
        {saved ? (
          <Badge tone="success" dot>
            Salvo
          </Badge>
        ) : null}
      </div>
      {props.unreadable ? (
        <div className="error" role="alert">Não foi possível ler a senha guardada. Digite e salve de novo.</div>
      ) : null}
      <form
        className="form-grid"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="field">
          <label htmlFor="acc-login">Login (CPF, e-mail ou nº da conta)</label>
          <input id="acc-login" className="input" value={login} autoComplete="off" onChange={(e) => { setLogin(e.target.value); setSaved(false); }} />
        </div>
        <div className="field">
          <label htmlFor="acc-pass">Senha</label>
          <input id="acc-pass" className="input" type={show ? "text" : "password"} value={pass} autoComplete="new-password" onChange={(e) => { setPass(e.target.value); setSaved(false); }} />
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button type="button" className="btn ghost" onClick={() => setShow(!show)} aria-pressed={show}>
            {show ? "Ocultar senha" : "Mostrar senha"}
          </button>
          <button type="submit" className="btn primary" disabled={pending}>
            {pending ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </section>
  );
}
