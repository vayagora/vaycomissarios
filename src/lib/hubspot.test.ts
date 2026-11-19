import { describe, expect, it } from "vitest";
import { readContact, readCredit, sinceFromCredits } from "./hubspot";

describe("HubSpot → extrato", () => {
  it("acúmulo usa [ACÚMULO] Valor creditado", () => {
    expect(
      readCredit("11", {
        hs_course_name: "Crédito Mensal - Programa Comissário",
        tipo_de_movimentacao: "Acúmulo",
        motivo_do_credito: "Programa Comissário",
        valor_total_do_credito: "50",
        valor_utilizado: "0",
        hs_createdate: "2026-11-04T13:00:00.000Z",
      }),
    ).toEqual({
      hubspot_id: "11",
      created_on: "2026-11-04T13:00:00.000Z",
      title: "Crédito Mensal - Programa Comissário",
      kind: "acumulo",
      reason: "Programa Comissário",
      amount: 50,
    });
  });
  it("uso usa [USO] Valor debitado", () => {
    const r = readCredit("12", { tipo_de_movimentacao: "Uso", valor_total_do_credito: "1180", valor_utilizado: "1180.5", motivo_do_credito: "Nova compra" });
    expect(r).toMatchObject({ kind: "uso", amount: 1180.5, reason: "Nova compra" });
  });
  it("sem tipo: decide pelo valor preenchido", () => {
    expect(readCredit("13", { valor_utilizado: "200" }).kind).toBe("uso");
    expect(readCredit("14", { valor_total_do_credito: "40" }).kind).toBe("acumulo");
  });
  it("data de criação cai para createdAt", () => {
    expect(readCredit("15", {}, "2026-01-01T00:00:00Z").created_on).toBe("2026-01-01T00:00:00Z");
  });
  it("contato: saldo e CPF", () => {
    expect(readContact("9", { firstname: "Mariana", lastname: "Costa", email: "M@X.COM ", cpf: "123.482.789-21", creditos_abertos: "4850" })).toEqual({
      id: "9",
      name: "Mariana Costa",
      email: "m@x.com",
      cpf: "123.482.789-21",
      balance: 4850,
    });
    expect(readContact("9", {}).balance).toBe(0);
  });
});

describe("comissário desde", () => {
  it("primeiro crédito do Programa Comissário, no fuso de Brasília", () => {
    expect(
      sinceFromCredits([
        { created_on: "2026-10-04T12:00:00Z", reason: "Programa Comissário" },
        { created_on: "2026-09-10T02:00:00Z", reason: "Programa Comissário" }, // 09/09 às 23h em Brasília
        { created_on: "2025-01-01T12:00:00Z", reason: "Nova compra" },
      ]),
    ).toBe("2026-09-09");
  });
  it("sem crédito do programa: o primeiro crédito do contato; sem créditos: nada", () => {
    expect(sinceFromCredits([{ created_on: "2026-05-02T12:00:00Z", reason: "Nova compra" }])).toBe("2026-05-02");
    expect(sinceFromCredits([])).toBeNull();
  });
});
