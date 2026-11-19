"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { Icon } from "./Icon";
import { Avatar } from "./ui";

import { WHATSAPP_URL } from "@/lib/contact";

const COMISSARIO = [
  { href: "/inicio", label: "Início", icon: "home" },
  { href: "/programas", label: "Meus programas", icon: "award" },
  { href: "/extrato", label: "Extrato", icon: "ticket" },
  { href: "/termo", label: "Meu termo de parceria", icon: "file" },
];
const VAY = [
  { href: "/comissarios", label: "Comissários", icon: "users" },
  { href: "/relatorios", label: "Relatórios de créditos", icon: "chart" },
];

export function Sidebar({ isVay, name, subtitle }: { isVay: boolean; name: string; subtitle: string }) {
  const path = usePathname();
  const items = isVay ? VAY : COMISSARIO;
  return (
    <aside className={`sidebar ${isVay ? "vay" : "comissario"}`}>
      <div className="brand">
        <Image
          src={isVay ? "/brand/logo-tipografico-porcelana.png" : "/brand/logo-tipografico-roxo.png"}
          alt="Vay Agora"
          width={148}
          height={22}
          style={{ width: 148, height: "auto" }}
          priority
        />
        <span>{isVay ? "Painel interno" : "Portal do comissário"}</span>
      </div>
      <nav aria-label={isVay ? "Menu do painel" : "Menu principal"}>
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="navlink"
            aria-current={path === it.href || path.startsWith(`${it.href}/`) ? "page" : undefined}
          >
            <Icon name={it.icon} />
            {it.label}
          </Link>
        ))}
      </nav>
      <div className="bottom">
        {!isVay ? (
          <div className="talk">
            <strong>Fale com a gente</strong>
            <p>Pedidos de passagem e dúvidas são atendidos pelo seu consultor no WhatsApp.</p>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer">
              Abrir WhatsApp →
            </a>
          </div>
        ) : null}
        <div className="me">
          <Avatar name={name} size="sm" />
          <div className="who">
            <span className="n">{name}</span>
            <span className="t">{subtitle}</span>
          </div>
          <form action={logout}>
            <button type="submit" className="logout">
              Sair
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
