"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/ui";
import { brl, fold } from "@/lib/format";

export type Row = {
  id: string;
  name: string;
  cpf: string;
  cpfDigits: string;
  since: string;
  programs: { label: string; warn: boolean }[];
  balance: number;
  last: { amount: number; sub: string } | null;
};

const FILTERS = [
  ["all", "Todos"],
  ["warn", "Categoria vencendo"],
  ["high", "Saldo acima de R$ 3.000"],
] as const;
type Filter = (typeof FILTERS)[number][0];

export function CommissionersTable({ rows }: { rows: Row[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const q = fold(query);
  const qDigits = query.replace(/\D/g, "");
  const shown = rows
    .filter((c) => filter === "all" || (filter === "warn" && c.programs.some((p) => p.warn)) || (filter === "high" && c.balance > 3000))
    .filter((c) => !q || fold(c.name).includes(q) || (qDigits.length >= 3 && c.cpfDigits.includes(qDigits)));

  return (
    <section className="card">
      <div className="toolbar">
        <div className="field">
          <label htmlFor="busca">Buscar comissário</label>
          <input id="busca" className="input" type="search" placeholder="Nome ou CPF" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="tags" role="group" aria-label="Filtrar comissários">
          {FILTERS.map(([id, label]) => (
            <button key={id} type="button" className="tag" aria-pressed={filter === id} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>Comissário</th>
              <th>Categorias vigentes</th>
              <th>Última movimentação</th>
              <th className="num">Saldo em créditos</th>
              <th>
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/comissarios/${c.id}`} className="who-cell">
                    <Avatar name={c.name} size="sm" />
                    <span>
                      <span className="n">{c.name}</span>
                      <span className="s">CPF {c.cpf} · desde {c.since}</span>
                    </span>
                  </Link>
                </td>
                <td>
                  {c.programs.length ? (
                    <div className="chips">
                      {c.programs.map((p) => (
                        <span key={p.label} className={`chip${p.warn ? " warn" : ""}`}>
                          {p.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="muted small">Nenhuma</span>
                  )}
                </td>
                <td>
                  {c.last ? (
                    <>
                      <span className={c.last.amount < 0 ? "strong" : "amount-in"} style={{ display: "block", fontWeight: 700 }}>
                        {c.last.amount < 0 ? "−" : "+"} {brl(c.last.amount)}
                      </span>
                      <span className="sub">{c.last.sub}</span>
                    </>
                  ) : (
                    <span className="muted small">Sem lançamentos</span>
                  )}
                </td>
                <td className="num">
                  <strong className="strong">{brl(c.balance)}</strong>
                </td>
                <td>
                  <Link href={`/comissarios/${c.id}`} className="btn outline sm">
                    Ver comissário
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length ? (
          <p className="empty">{rows.length ? "Nenhum comissário encontrado com esse filtro." : "Nenhum comissário ainda. Sincronize com o HubSpot para importar."}</p>
        ) : null}
      </div>
      <p className="small muted" style={{ padding: "14px 24px" }}>
        Mostrando {shown.length} de {rows.length} comissários · saldos conforme a última sincronização com o HubSpot
      </p>
    </section>
  );
}
