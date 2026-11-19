import { describe, expect, it } from "vitest";
import { planCommissioners, readContact, readCredit } from "./hubspot";

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

describe("quem é comissário", () => {
  it("contatos associados a créditos do Programa Comissário, desde o primeiro crédito (fuso de Brasília)", () => {
    const credits = [
      { id: "c1", created_on: "2026-10-04T12:00:00Z" },
      { id: "c2", created_on: "2026-09-10T02:00:00Z" }, // 09/09 às 23h em Brasília
      { id: "c3", created_on: "2026-11-04T12:00:00Z" },
      { id: "c4", created_on: "2026-11-04T12:00:00Z" }, // sem contato associado
    ];
    const links = new Map([
      ["c1", ["111"]],
      ["c2", ["111"]],
      ["c3", ["222", "333"]],
    ]);
    const since = planCommissioners(credits, links);
    expect([...since.entries()].sort()).toEqual([
      ["111", "2026-09-09"],
      ["222", "2026-11-04"],
      ["333", "2026-11-04"],
    ]);
  });
});
