"use client";

// Feedback de ações: toast escuro no canto superior direito que some sozinho (~3,5 s).
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Toast = { text: string; error?: boolean } | null;
const Ctx = createContext<(text: string, error?: boolean) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text: string, error?: boolean) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ text, error });
    timer.current = setTimeout(() => setToast(null), error ? 6000 : 3500);
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div aria-live="polite">
        {toast ? (
          <div className={`toast${toast.error ? " error" : ""}`} role="status">
            {toast.text}
          </div>
        ) : null}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}

export type ActionResult = { ok?: string; error?: string } | undefined;

// Mostra o resultado de uma server action no toast
export function useToastResult() {
  const show = useToast();
  return (r: ActionResult) => {
    if (r?.error) show(r.error, true);
    else if (r?.ok) show(r.ok);
  };
}
