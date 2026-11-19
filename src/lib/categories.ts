// Situação de uma categoria de milha pela data de validade (vigente até o dia, inclusive).
import { daysBetween, plural } from "./format";

export const SOON_DAYS = 45;

export type CategoryStatus = {
  ended: boolean;
  soon: boolean;
  daysLeft: number; // dias até a validade (0 = vence hoje)
  label: string; // "Vigente" | "Vence em 12 dias" | "Vence hoje" | "Encerrada"
};

export function categoryStatus(validUntil: string, today: string): CategoryStatus {
  const daysLeft = daysBetween(today, validUntil);
  const ended = daysLeft < 0;
  const soon = !ended && daysLeft <= SOON_DAYS;
  const label = ended ? "Encerrada" : !soon ? "Vigente" : daysLeft === 0 ? "Vence hoje" : `Vence em ${plural(daysLeft, "dia", "dias")}`;
  return { ended, soon, daysLeft, label };
}

// "Faltam 132 dias" / "Vence hoje"
export function remainingLabel(validUntil: string, today: string): string {
  const d = daysBetween(today, validUntil);
  if (d < 0) return "Encerrada";
  if (d === 0) return "Vence hoje";
  return `Falta${d === 1 ? "" : "m"} ${plural(d, "dia", "dias")}`;
}

// Validação do modal "Atribuir categoria de milha"
export function validateUntil(validUntil: string, today: string): string | null {
  if (!validUntil) return "Informe a data de validade.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(validUntil)) return "Data inválida.";
  if (validUntil <= today) return "A validade precisa ser uma data futura.";
  return null;
}
