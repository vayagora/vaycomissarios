import { describe, expect, it } from "vitest";
import { buildStatement, totals } from "./statement";
import type { CreditEntry } from "./types";

const e = (id: string, created_on: string, kind: "acumulo" | "uso", amount: number): CreditEntry => ({
  id,
  commissioner_id: "c",
  hubspot_id: id,
  created_on,
  title: "",
  kind,
  reason: "",
  amount,
});

describe("extrato", () => {
  // Mesmo exemplo do protótipo: saldo atual R$ 4.850
  const entries = [
    e("1", "2026-07-02T12:00:00Z", "uso", 2300),
    e("2", "2026-09-04T12:00:00Z", "acumulo", 50),
    e("3", "2026-09-29T12:00:00Z", "uso", 1180),
    e("4", "2026-10-04T12:00:00Z", "acumulo", 50),
    e("5", "2026-10-28T12:00:00Z", "acumulo", 40),
    e("6", "2026-11-02T12:00:00Z", "acumulo", 40),
    e("7", "2026-11-04T12:00:00Z", "acumulo", 50),
  ];

  it("ordena do mais recente ao mais antigo e calcula o saldo de trás para frente", () => {
    const rows = buildStatement(4850, entries);
    expect(rows.map((r) => r.id)).toEqual(["7", "6", "5", "4", "3", "2", "1"]);
    expect(rows.map((r) => r.balanceAfter)).toEqual([4850, 4800, 4760, 4720, 4670, 5850, 5800]);
    expect(rows.map((r) => r.signed)).toEqual([50, 40, 40, 50, -1180, 50, -2300]);
  });

  it("soma acumulado e usado", () => {
    expect(totals(entries)).toEqual({ accumulated: 230, used: 3480 });
  });

  it("extrato vazio", () => {
    expect(buildStatement(100, [])).toEqual([]);
    expect(totals([])).toEqual({ accumulated: 0, used: 0 });
  });

  it("centavos sem erro de arredondamento", () => {
    const rows = buildStatement(10.3, [e("a", "2026-01-02T00:00:00Z", "acumulo", 0.1), e("b", "2026-01-01T00:00:00Z", "acumulo", 0.2)]);
    expect(rows.map((r) => r.balanceAfter)).toEqual([10.3, 10.2]);
  });
});
