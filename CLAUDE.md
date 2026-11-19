# CLAUDE.md — Portal do Comissário (Vay Agora)

Leia `docs/SPEC.md` antes de qualquer tarefa. É o handoff do protótipo validado e a fonte da verdade das regras de negócio. As telas de referência estão em `docs/prototipo/telas/`.

Este sistema segue a stack e os padrões do sistema de agências parceiras (`vayagora/vayagenciasparceiras`).

## Stack
- Next.js (App Router, TypeScript, Server Components/Actions)
- Supabase: Postgres, Auth, RLS. Migrações em `supabase/migrations/` (nunca editar uma migração já aplicada; crie outra)
- HubSpot via API REST (app privado, só leitura). Cliente em `src/lib/hubspot.ts`, sincronização em `src/lib/sync.ts`, mapeamento em `docs/HUBSPOT.md`
- Testes: Vitest (`npm test`)
- Visual: design system Vay Agora em `src/app/tokens.css` + `src/app/globals.css`; fontes em `public/fonts/`. Use as variáveis semânticas, nunca hex soltos. Ícones Lucide em `src/components/Icon.tsx`

## Regras que não podem ser quebradas
1. **Créditos nunca são lançados pelo sistema.** Saldo = `creditos_abertos` do contato; extrato = registros do objeto Créditos (0-410). Só a sincronização grava `credit_entries` (service_role). Não existe política RLS de escrita nessa tabela.
2. **Créditos nunca expiram.** Não exibir validade, vencimento ou "vence em breve" para créditos.
3. **Comissários vêm do HubSpot, nunca de cadastro manual**: contato associado a algum registro de Créditos com motivo "Programa Comissário" (`searchProgramCredits`/`planCommissioners` em `src/lib/hubspot.ts`). A Vay só envia o convite de acesso. **Não existe status de comissário**: todo comissário é ativo.
4. O comissário **não compra nem usa créditos pelo sistema** (pedidos só pelo WhatsApp do menu) e **não vê movimentações das contas de milhas**.
5. O comissário só acessa os próprios dados (RLS). Toda tabela nova com dado de comissário precisa de política RLS + teste em `test/rls.test.ts`.
6. Categorias de milha: uma por empresa por comissário (`unique`), validade obrigatória e futura (RLS), vigente até a data de validade inclusive (`src/lib/categories.ts`). O comissário só vê as vigentes (RLS em `mile_categories`). Empresas/categorias em `src/lib/programs.ts` e na restrição `company_tier` (mudou uma, mude a outra numa nova migração).
7. **Senhas dos programas**: cifradas no servidor (`src/lib/crypto.ts`, AES-256-GCM, `CREDENTIALS_KEY`) e legíveis só pelo próprio comissário. A equipe Vay não tem política RLS em `program_credentials`, de propósito. Nunca exibir nem registrar em log.
8. Tipos no extrato: painel Vay "Acúmulo"/"Uso"; portal "Entrada"/"Gasto". Saldo de cada linha calculado de trás para frente a partir do saldo atual (`src/lib/statement.ts`).
9. Fuso de referência America/Sao_Paulo (`todayIso` em `src/lib/format.ts`; `sp_today()` no banco).
10. Segredos só em variáveis de ambiente; nunca no código nem em logs.

## Convenções (iguais ao sistema de agências parceiras)
- Interface em pt-BR; marca escrita sempre "Vay Agora".
- Título da página = nome da aba, sem subtítulo. Explicações em tooltip (`Tip` em `src/components/ui.tsx`).
- Feedback de ações em toast (`useToastResult` em `src/components/Toast.tsx`).
- Datas no banco em `date`/`timestamptz`; exibição dd/mm/aaaa. Valores em `numeric(12,2)`; exibir em BRL pt-BR.
- Todas as gravações ficam em `src/app/(app)/actions.ts`.

## Antes de entregar
`npm run lint && npm test && npm run build` sem erros.
