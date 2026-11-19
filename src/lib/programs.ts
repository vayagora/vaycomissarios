// Empresas e categorias de milha (listas suspensas do modal e escada no detalhe do programa).
// As categorias NÃO vêm das companhias: a Vay atribui manualmente. Revise estas listas e os
// benefícios periodicamente com os regulamentos dos programas.
// ATENÇÃO: só os benefícios de LATAM Pass · Black vieram do protótipo validado. Os demais são um
// rascunho genérico e precisam ser conferidos com o regulamento vigente antes de publicar.
// Se mudar empresas ou categorias, crie também uma migração para a restrição company_tier.

export type Benefit = { title: string; desc: string; icon: IconName };
export type IconName = "lounge" | "bag" | "priority" | "upgrade" | "seat" | "support" | "points" | "star";

export type Program = {
  company: string;
  slug: string;
  initials: string;
  tiers: string[]; // em ordem, da primeira à mais alta
  benefits: Record<string, Benefit[]>;
};

const B = (title: string, desc: string, icon: IconName): Benefit => ({ title, desc, icon });

export const PROGRAMS: Program[] = [
  {
    company: "LATAM Pass",
    slug: "latam-pass",
    initials: "LA",
    tiers: ["Gold", "Platinum", "Black", "Black Signature"],
    benefits: {
      Gold: [
        B("Prioridade", "Check-in e embarque prioritários, conforme disponibilidade no aeroporto.", "priority"),
        B("Bagagem extra", "Franquia de bagagem adicional, conforme a regra da tarifa.", "bag"),
        B("Pontos bônus", "Bônus sobre os pontos acumulados em voos.", "points"),
      ],
      Platinum: [
        B("Prioridade", "Check-in, embarque e desembarque de bagagem prioritários.", "priority"),
        B("Bagagem extra", "Franquia de bagagem adicional, conforme a regra da tarifa.", "bag"),
        B("Assentos preferenciais", "Marcação antecipada de assentos com mais espaço.", "seat"),
        B("Pontos bônus", "Bônus maior sobre os pontos acumulados em voos.", "points"),
      ],
      Black: [
        B("Salas VIP", "Acesso às salas VIP em voos internacionais, com acompanhante.", "lounge"),
        B("Bagagem extra", "Duas bagagens despachadas de até 32 kg sem custo.", "bag"),
        B("Prioridade", "Check-in, embarque e desembarque de bagagem prioritários.", "priority"),
        B("Upgrades de cabine", "Cupons de upgrade para viajar em cabine superior, conforme disponibilidade.", "upgrade"),
        B("Assentos preferenciais", "Marcação antecipada de assentos com mais espaço.", "seat"),
        B("Atendimento exclusivo", "Central dedicada da companhia, além do seu consultor Vay Agora.", "support"),
      ],
      "Black Signature": [
        B("Salas VIP", "Acesso às salas VIP, com acompanhante.", "lounge"),
        B("Bagagem extra", "Bagagens despachadas adicionais sem custo.", "bag"),
        B("Prioridade máxima", "Check-in, embarque e bagagem com a maior prioridade do programa.", "priority"),
        B("Upgrades de cabine", "Mais cupons de upgrade para cabine superior, conforme disponibilidade.", "upgrade"),
        B("Assentos preferenciais", "Marcação antecipada de assentos com mais espaço.", "seat"),
        B("Atendimento exclusivo", "Central dedicada da companhia, além do seu consultor Vay Agora.", "support"),
      ],
    },
  },
  {
    company: "Smiles",
    slug: "smiles",
    initials: "SM",
    tiers: ["Prata", "Ouro", "Diamante"],
    benefits: {
      Prata: [
        B("Prioridade", "Check-in e embarque prioritários, conforme disponibilidade.", "priority"),
        B("Milhas bônus", "Bônus sobre as milhas acumuladas em voos.", "points"),
      ],
      Ouro: [
        B("Prioridade", "Check-in, embarque e bagagem prioritários.", "priority"),
        B("Bagagem extra", "Franquia de bagagem adicional, conforme a regra da tarifa.", "bag"),
        B("Assentos preferenciais", "Marcação de assentos com mais espaço, conforme disponibilidade.", "seat"),
        B("Milhas bônus", "Bônus maior sobre as milhas acumuladas em voos.", "points"),
      ],
      Diamante: [
        B("Salas VIP", "Acesso às salas VIP, conforme o regulamento.", "lounge"),
        B("Prioridade", "Check-in, embarque e bagagem prioritários.", "priority"),
        B("Bagagem extra", "Franquia de bagagem adicional, conforme a regra da tarifa.", "bag"),
        B("Assentos preferenciais", "Marcação de assentos com mais espaço sem custo.", "seat"),
        B("Atendimento exclusivo", "Central dedicada do programa, além do seu consultor Vay Agora.", "support"),
      ],
    },
  },
  {
    company: "Azul Fidelidade",
    slug: "azul-fidelidade",
    initials: "AZ",
    tiers: ["Topázio", "Safira", "Diamante", "Diamante Unique"],
    benefits: {
      "Topázio": [
        B("Prioridade", "Check-in e embarque prioritários, conforme disponibilidade.", "priority"),
        B("Pontos bônus", "Bônus sobre os pontos acumulados em voos.", "points"),
      ],
      Safira: [
        B("Prioridade", "Check-in, embarque e bagagem prioritários.", "priority"),
        B("Bagagem extra", "Franquia de bagagem adicional, conforme a regra da tarifa.", "bag"),
        B("Assentos preferenciais", "Marcação de assentos com mais espaço, conforme disponibilidade.", "seat"),
        B("Pontos bônus", "Bônus maior sobre os pontos acumulados em voos.", "points"),
      ],
      Diamante: [
        B("Salas VIP", "Acesso às salas VIP, conforme o regulamento.", "lounge"),
        B("Prioridade", "Check-in, embarque e bagagem prioritários.", "priority"),
        B("Bagagem extra", "Franquia de bagagem adicional, conforme a regra da tarifa.", "bag"),
        B("Assentos preferenciais", "Marcação de assentos com mais espaço sem custo.", "seat"),
        B("Upgrades de cabine", "Upgrades para cabine superior, conforme disponibilidade.", "upgrade"),
      ],
      "Diamante Unique": [
        B("Salas VIP", "Acesso às salas VIP, com acompanhante, conforme o regulamento.", "lounge"),
        B("Prioridade máxima", "Check-in, embarque e bagagem com a maior prioridade do programa.", "priority"),
        B("Bagagem extra", "Bagagens despachadas adicionais sem custo.", "bag"),
        B("Upgrades de cabine", "Upgrades para cabine superior, conforme disponibilidade.", "upgrade"),
        B("Atendimento exclusivo", "Central dedicada do programa, além do seu consultor Vay Agora.", "support"),
      ],
    },
  },
];

export const COMPANIES = PROGRAMS.map((p) => p.company);

export function programOf(company: string): Program | undefined {
  return PROGRAMS.find((p) => p.company === company);
}

export function programBySlug(slug: string): Program | undefined {
  return PROGRAMS.find((p) => p.slug === slug);
}

export function isValidTier(company: string, tier: string): boolean {
  return !!programOf(company)?.tiers.includes(tier);
}

// Escada de categorias da empresa, marcando a atual
export function ladder(company: string, tier: string): { name: string; state: "done" | "current" | "next" }[] {
  const p = programOf(company);
  if (!p) return [];
  const cur = p.tiers.indexOf(tier);
  return p.tiers.map((name, i) => ({ name, state: i < cur ? "done" : i === cur ? "current" : "next" }));
}

// Ordem de exibição das categorias (pela ordem das empresas)
export function byCompany<T extends { company: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => COMPANIES.indexOf(a.company) - COMPANIES.indexOf(b.company));
}
