import { describe, expect, it } from "vitest";
import { brl, maskCpf, monthYear, whenLabel } from "./format";

describe("formatação", () => {
  it("CPF mascarado", () => {
    expect(maskCpf("123.482.789-21")).toBe("•••.482.•••-21");
    expect(maskCpf("12348278921")).toBe("•••.482.•••-21");
    expect(maskCpf("")).toBe("—");
  });
  it("valores", () => {
    expect(brl(4850)).toBe("R$ 4.850");
    expect(brl(-1180)).toBe("R$ 1.180");
    expect(brl(10.5)).toBe("R$ 10,50");
  });
  it("mês/ano", () => {
    expect(monthYear("2024-03-12")).toBe("mar/2024");
  });
  it("última sincronização", () => {
    const now = new Date("2026-11-19T18:00:00Z"); // 15:00 em Brasília
    expect(whenLabel("2026-11-19T18:00:00Z", now)).toBe("hoje às 15:00");
    expect(whenLabel("2026-11-18T12:05:00Z", now)).toBe("ontem às 09:05");
    expect(whenLabel(null, now)).toBe("nunca");
  });
});
