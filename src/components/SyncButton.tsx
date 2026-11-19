"use client";

import { useTransition } from "react";
import { syncNow } from "@/app/(app)/actions";
import { useToastResult } from "./Toast";
import { Tip } from "./ui";

// Padrão do sistema de agências parceiras: botão outline + "i" com a última sincronização.
export function SyncButton({ last, commissionerId, size }: { last: string; commissionerId?: string; size?: "sm" }) {
  const [pending, start] = useTransition();
  const toast = useToastResult();
  return (
    <div className="sync">
      <button
        type="button"
        className={`btn outline${size ? ` ${size}` : ""}`}
        disabled={pending}
        onClick={() => start(async () => toast(await syncNow(commissionerId)))}
      >
        {pending ? "Sincronizando…" : "Sincronizar com HubSpot"}
      </button>
      <Tip>{`Última sincronização: ${last}`}</Tip>
    </div>
  );
}
