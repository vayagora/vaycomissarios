// Datas são ISO "AAAA-MM-DD" (colunas date do Postgres). "Hoje" segue o horário de Brasília.

const TZ = "America/Sao_Paulo";

export function todayIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

// Data (AAAA-MM-DD) de um timestamp, no fuso de São Paulo
export function isoInSp(ts: string): string {
  return todayIso(new Date(ts));
}

export function dayNum(iso: string): number {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return dayNum(toIso) - dayNum(fromIso);
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const p = iso.slice(0, 10).split("-");
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
}

export function dm(iso: string): string {
  const p = iso.slice(0, 10).split("-");
  return `${p[2]}/${p[1]}`;
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTHS_LONG = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

// "2024-03-12" → "mar/2024"
export function monthYear(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]}/${y}`;
}

export function monthName(iso: string): string {
  return MONTHS_LONG[Number(iso.slice(5, 7)) - 1];
}

// "Quinta, 19 de novembro"
export function longToday(now: Date = new Date()): string {
  const s = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(now);
  const [wd, rest] = s.split(", ");
  const w = wd.replace("-feira", "");
  return `${w.charAt(0).toUpperCase()}${w.slice(1)}, ${rest}`;
}

export function fmtDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
}

// "hoje às 15:00", "ontem às 09:12" ou "17/11/2026 às 10:00"
export function whenLabel(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return "nunca";
  const d = new Date(iso);
  const time = new Intl.DateTimeFormat("pt-BR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(d);
  const diff = daysBetween(todayIso(d), todayIso(now));
  if (diff === 0) return `hoje às ${time}`;
  if (diff === 1) return `ontem às ${time}`;
  return `${fmtDate(todayIso(d))} às ${time}`;
}

// Valores em créditos (R$). Sem centavos quando o valor é inteiro, como no protótipo.
export function brl(v: number): string {
  const n = Math.abs(Number(v) || 0);
  const cents = Math.round(n * 100) % 100 !== 0;
  return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 });
}

export function signedBrl(v: number): string {
  return `${v < 0 ? "−" : "+"} ${brl(v)}`;
}

export function lower(s: string | null | undefined): string {
  return String(s ?? "").trim().toLowerCase();
}

export function digits(s: string | null | undefined): string {
  return String(s ?? "").replace(/\D/g, "");
}

// CPF mascarado: "123.482.789-21" → "•••.482.•••-21"
export function maskCpf(cpf: string | null | undefined): string {
  const d = digits(cpf);
  if (d.length !== 11) return "—";
  return `•••.${d.slice(3, 6)}.•••-${d.slice(9)}`;
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return ((parts[0][0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
}
