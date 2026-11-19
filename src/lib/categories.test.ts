import { describe, expect, it } from "vitest";
import { categoryStatus, remainingLabel, validateUntil } from "./categories";

const today = "2026-11-19";

describe("categorias", () => {
  it("vigente com folga", () => {
    expect(categoryStatus("2027-03-31", today)).toMatchObject({ ended: false, soon: false, label: "Vigente", daysLeft: 132 });
  });
  it("vence em até 45 dias", () => {
    expect(categoryStatus("2027-01-03", today)).toMatchObject({ soon: true, label: "Vence em 45 dias" });
    expect(categoryStatus("2027-01-04", today).soon).toBe(false);
    expect(categoryStatus("2026-11-20", today).label).toBe("Vence em 1 dia");
  });
  it("vigente até o dia da validade, inclusive; encerrada no dia seguinte", () => {
    expect(categoryStatus(today, today)).toMatchObject({ ended: false, label: "Vence hoje" });
    expect(categoryStatus("2026-11-18", today)).toMatchObject({ ended: true, label: "Encerrada" });
  });
  it("dias restantes no detalhe do programa", () => {
    expect(remainingLabel("2027-03-31", today)).toBe("Faltam 132 dias");
    expect(remainingLabel("2026-11-20", today)).toBe("Falta 1 dia");
  });
  it("validade obrigatória e futura", () => {
    expect(validateUntil("", today)).toBe("Informe a data de validade.");
    expect(validateUntil(today, today)).toBe("A validade precisa ser uma data futura.");
    expect(validateUntil("2026-01-01", today)).toBe("A validade precisa ser uma data futura.");
    expect(validateUntil("2026-11-20", today)).toBeNull();
  });
});
