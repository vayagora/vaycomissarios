"use client";

import { useTransition } from "react";
import { useToastResult } from "@/components/Toast";
import { Badge, Tip } from "@/components/ui";
import type { PortalAccess } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { inviteCommissioner } from "../../actions";

// Acesso ao portal. O comissário vem do HubSpot; aqui a Vay só envia o convite de acesso.
export function InviteButton({ commissionerId, email, access }: { commissionerId: string; email: string; access: PortalAccess }) {
  const [pending, start] = useTransition();
  const toast = useToastResult();
  const send = () => start(async () => toast(await inviteCommissioner(commissionerId)));
  if (access)
    return (
      <span className="row" style={{ gap: 6 }}>
        <Badge tone="success" dot>
          Com acesso ao portal
        </Badge>
        <Tip>{`Convidado em ${fmtDate(access.since)} (${access.email}).`}</Tip>
        <button type="button" className="linkbtn" disabled={pending} onClick={send}>
          {pending ? "Enviando…" : "Reenviar acesso"}
        </button>
      </span>
    );
  return (
    <button type="button" className="btn secondary" disabled={pending || !email} onClick={send} title={email ? undefined : "Contato sem e-mail no HubSpot"}>
      {pending ? "Enviando…" : "Convidar para o portal"}
    </button>
  );
}
