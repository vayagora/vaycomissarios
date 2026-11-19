import { Sidebar } from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession();
  // Senha provisória criada pela Vay: troca obrigatória antes de usar o portal
  if (s.profile.must_change_password) redirect("/definir-senha");
  const name = s.profile.full_name || (s.isVay ? "Equipe Vay Agora" : s.profile.email);
  return (
    <ToastProvider>
      <div className="shell">
        <Sidebar isVay={s.isVay} name={name} subtitle={s.isVay ? "Equipe Vay Agora" : s.profile.email} />
        <main className="main">{children}</main>
      </div>
    </ToastProvider>
  );
}
