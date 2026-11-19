// Extrato: cada registro do objeto "Créditos" do HubSpot vira uma linha.
// O saldo após cada lançamento é calculado de trás para frente a partir do saldo atual
// (campo "Saldo atual em créditos" do contato), com os lançamentos do mais recente ao mais antigo.
import type { CreditEntry } from "./types";

export type StatementRow = CreditEntry & { signed: number; balanceAfter: number };

export function newestFirst<T extends Pick<CreditEntry, "created_on" | "hubspot_id">>(entries: T[]): T[] {
  return [...entries].sort((a, b) =>
    a.created_on === b.created_on ? b.hubspot_id.localeCompare(a.hubspot_id, "en", { numeric: true }) : a.created_on < b.created_on ? 1 : -1,
  );
}

export function signedAmount(e: Pick<CreditEntry, "kind" | "amount">): number {
  return e.kind === "uso" ? -Math.abs(e.amount) : Math.abs(e.amount);
}

export function buildStatement(balance: number, entries: CreditEntry[]): StatementRow[] {
  let running = Number(balance) || 0;
  return newestFirst(entries).map((e) => {
    const signed = signedAmount(e);
    const row = { ...e, signed, balanceAfter: round2(running) };
    running -= signed;
    return row;
  });
}

export function totals(entries: Pick<CreditEntry, "kind" | "amount">[]): { accumulated: number; used: number } {
  let accumulated = 0;
  let used = 0;
  for (const e of entries) {
    if (e.kind === "uso") used += Math.abs(e.amount);
    else accumulated += Math.abs(e.amount);
  }
  return { accumulated: round2(accumulated), used: round2(used) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
