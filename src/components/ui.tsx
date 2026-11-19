import { initials } from "@/lib/format";

export type Tone = "neutral" | "purple" | "success" | "yellow" | "red" | "blue";

export function Tip({ children, label }: { children: string; label?: string }) {
  return (
    <button type="button" className="tip" aria-label={label ?? children}>
      i<span className="tipbox" role="tooltip">{children}</span>
    </button>
  );
}

export function Badge({ tone = "neutral", dot, children }: { tone?: Tone; dot?: boolean; children: React.ReactNode }) {
  return <span className={`badge ${tone}${dot ? " dot" : ""}`}>{children}</span>;
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  return (
    <span className={`avatar ${size}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
