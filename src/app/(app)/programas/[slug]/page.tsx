import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Unlinked } from "@/components/Unlinked";
import { categoryStatus, remainingLabel } from "@/lib/categories";
import { decryptSecret } from "@/lib/crypto";
import { requireCommissioner } from "@/lib/data";
import { fmtDate, todayIso } from "@/lib/format";
import { ladder, programBySlug } from "@/lib/programs";
import { createClient } from "@/lib/supabase/server";
import { AccessForm } from "./AccessForm";

export default async function ProgramaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = programBySlug(slug);
  if (!program) notFound();
  const { data } = await requireCommissioner();
  if (!data) return <Unlinked />;
  const today = todayIso();
  // O RLS já esconde as encerradas; o filtro aqui cobre a virada do dia no fuso
  const cat = data.categories.find((x) => x.company === program.company && !categoryStatus(x.valid_until, today).ended);
  if (!cat) notFound();

  // Dados de acesso: só o próprio comissário lê a linha (RLS); a senha é decifrada no servidor
  const supabase = await createClient();
  const { data: cred } = await supabase
    .from("program_credentials")
    .select("login, password_enc")
    .eq("commissioner_id", data.commissioner.id)
    .eq("company", program.company)
    .maybeSingle();
  let password = "";
  let unreadable = false;
  try {
    password = decryptSecret(cred?.password_enc ?? "");
  } catch {
    unreadable = true;
  }

  const steps = ladder(program.company, cat.tier);
  const benefits = program.benefits[cat.tier] ?? [];
  return (
    <div className="container">
      <Link href="/programas" className="back">
        <Icon name="back" size={18} />
        Meus programas
      </Link>

      <section className="hero">
        <div className="deco1" aria-hidden="true" />
        <div className="stack" style={{ gap: 20, position: "relative" }}>
          <div className="co">
            <span className="mono-tile">{program.initials}</span>
            <div className="stack" style={{ gap: 0 }}>
              <span className="n">{program.company}</span>
              <span className="s">Titular {data.commissioner.name}</span>
            </div>
          </div>
          <div className="stack" style={{ gap: 4 }}>
            <span className="eyebrow">Sua categoria</span>
            <h1 className="tier">{cat.tier}</h1>
          </div>
        </div>
        <div className="until">
          <span className="small" style={{ color: "var(--neutral-300)" }}>Válida até</span>
          <strong>{fmtDate(cat.valid_until)}</strong>
          <span className="s">{remainingLabel(cat.valid_until, today)}</span>
        </div>
      </section>

      <section className="section" aria-labelledby="escada">
        <h2 id="escada" className="section-title">Onde você está no programa</h2>
        <ol className="ladder">
          {steps.map((t) => (
            <li key={t.name} className={t.state} aria-current={t.state === "current" ? "step" : undefined}>
              <span className="n">{t.name}</span>
              <span className="s">{t.state === "done" ? "Conquistada" : t.state === "current" ? "Sua categoria atual" : "Próxima categoria"}</span>
            </li>
          ))}
        </ol>
      </section>

      {benefits.length ? (
        <section className="section">
          <div className="stack" style={{ gap: 4 }}>
            <h2 className="section-title">Seus benefícios na categoria {cat.tier}</h2>
            <p className="muted">Valem para você e para viagens emitidas na sua conta pessoal.</p>
          </div>
          <div className="grid-benefits">
            {benefits.map((b) => (
              <div key={b.title} className="card benefit">
                <span className="ico">
                  <Icon name={b.icon} />
                </span>
                <strong>{b.title}</strong>
                <p>{b.desc}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <AccessForm company={program.company} initialLogin={cred?.login ?? ""} initialPassword={password} saved={!!cred} unreadable={unreadable} />

      <p className="disclaimer">Benefícios conforme o regulamento {program.company} vigente e sujeitos a alteração pela companhia.</p>
    </div>
  );
}
