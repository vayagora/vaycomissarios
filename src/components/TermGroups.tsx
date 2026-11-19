import { Icon } from "./Icon";

export const TERM_GROUPS = [
  { key: "term_receives", cls: "recebe", icon: "gift", title: "O que você recebe", adminTitle: "O que recebe", placeholder: "Ex.: R$ 50 em créditos por mês" },
  { key: "term_can", cls: "pode", icon: "check", title: "O que você pode fazer", adminTitle: "O que pode fazer", placeholder: "Ex.: emitir passagens para a família" },
  { key: "term_cannot", cls: "naoPode", icon: "x", title: "O que você não pode fazer", adminTitle: "O que não pode fazer", placeholder: "Ex.: alterar senhas sem avisar" },
] as const;

export function TermIcon({ name }: { name: string }) {
  return (
    <span className="ico">
      <Icon name={name} size={18} />
    </span>
  );
}
