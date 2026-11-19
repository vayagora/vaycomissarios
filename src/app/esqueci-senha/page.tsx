import Link from "next/link";
import { AuthFrame } from "@/components/AuthFrame";
import { WHATSAPP_URL } from "@/lib/contact";

export const metadata = { title: "Esqueci minha senha" };

// Sem envio de e-mail: a Vay volta a senha para a inicial e avisa pelo WhatsApp.
export default function ForgotPage() {
  return (
    <AuthFrame>
      <div className="stack" style={{ gap: 8 }}>
        <h2 style={{ fontSize: 30 }}>Esqueci minha senha</h2>
        <p className="muted">Fale com a gente pelo WhatsApp. Voltamos sua senha para a inicial e, ao entrar, você cria uma nova.</p>
      </div>
      <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="btn primary lg block">
        Falar no WhatsApp
      </a>
      <Link href="/login" className="small">
        Voltar para o login
      </Link>
    </AuthFrame>
  );
}
