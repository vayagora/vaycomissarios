import { Sidebar } from "@/components/Sidebar";
import { ToastProvider } from "@/components/Toast";
import { requireSession } from "@/lib/data";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession();
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
