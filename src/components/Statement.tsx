"use client";

// Extrato de créditos. Uma linha por registro do objeto "Créditos" do HubSpot.
// Comissário: tipos "Entrada" / "Gasto". Painel Vay: "Acúmulo" / "Uso", como no HubSpot.
import { useState } from "react";
import { brl, fmtDate, isoInSp } from "@/lib/format";
import type { StatementRow } from "@/lib/statement";
import { Badge } from "./ui";

type Filter = "all" | "acumulo" | "uso";

export function Statement({ rows, mode }: { rows: StatementRow[]; mode: "comissario" | "vay" }) {
  const [filter, setFilter] = useState<Filter>("all");
  const vay = mode === "vay";
  const labels: Record<Filter, string> = vay
    ? { all: "Tudo", acumulo: "Acúmulos", uso: "Usos" }
    : { all: "Tudo", acumulo: "Entradas", uso: "Gastos" };
  const typeLabel = (k: "acumulo" | "uso") => (vay ? (k === "uso" ? "Uso" : "Acúmulo") : k === "uso" ? "Gasto" : "Entrada");
  const shown = rows.filter((r) => filter === "all" || r.kind === filter);

  const tags = (
    <div className="tags" role="group" aria-label="Filtrar extrato">
      {(Object.keys(labels) as Filter[]).map((f) => (
        <button key={f} type="button" className="tag" aria-pressed={filter === f} onClick={() => setFilter(f)}>
          {labels[f]}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {tags}
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Data</th>
                {vay ? (
                  <>
                    <th>Lançamento</th>
                    <th>Motivo</th>
                    <th>Tipo</th>
                  </>
                ) : (
                  <>
                    <th>Tipo</th>
                    <th>Descrição</th>
                  </>
                )}
                <th className="num">Valor</th>
                <th className="num">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => {
                const badge = (
                  <Badge tone={r.kind === "uso" ? "purple" : "success"}>{typeLabel(r.kind)}</Badge>
                );
                return (
                  <tr key={r.id} className={r.kind === "uso" ? "out-row" : undefined}>
                    <td className="nowrap">{fmtDate(isoInSp(r.created_on))}</td>
                    {vay ? (
                      <>
                        <td className="t">{r.title || "—"}</td>
                        <td>{r.reason || "—"}</td>
                        <td>{badge}</td>
                      </>
                    ) : (
                      <>
                        <td>{badge}</td>
                        <td>
                          <span className="t" style={{ display: "block" }}>{r.title || "—"}</span>
                          {r.reason ? <span className="sub">{r.reason}</span> : null}
                        </td>
                      </>
                    )}
                    <td className={`num ${r.kind === "uso" ? "out" : "in"}`}>
                      {r.kind === "uso" ? "−" : "+"} {brl(r.amount)}
                    </td>
                    <td className="num">{brl(r.balanceAfter)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!shown.length ? <p className="empty">{rows.length ? "Nenhum lançamento com esse filtro." : "Nenhum lançamento ainda."}</p> : null}
        </div>
      </div>
    </>
  );
}
