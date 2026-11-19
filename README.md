# Vay Agora · Portal do Comissário

Os comissários acompanham os créditos de passagem, as categorias de milha vigentes e o termo de parceria. A equipe Vay atribui categorias, define o termo de cada um e acompanha os saldos. Os créditos são lançados **só no HubSpot**: o sistema lê de lá.

Especificação: `docs/SPEC.md` (handoff do protótipo validado em 19/11/2026). Telas de referência: `docs/prototipo/telas/`.

## Como funciona

| Quem | O que vê e faz |
|---|---|
| **Comissário** | Início (saldo, parceria, categorias), Meus programas (categorias vigentes, benefícios, login e senha do programa guardados para consulta própria), Extrato e Meu termo de parceria. Só leitura, exceto os próprios dados de acesso. Pedidos de passagem pelo WhatsApp do menu. |
| **Equipe Vay Agora** | Lista de comissários (importados do HubSpot) com KPIs, busca e filtros; no detalhe: convidar para o portal, atribuir, alterar, excluir e recadastrar categorias de milha; editar o termo; ver o extrato. Sincronizar com o HubSpot. |

- **Comissários vêm do HubSpot**: todo contato com "Comissário" marcado em "Condições Especiais" é importado na sincronização, com saldo e extrato. A Vay não cadastra comissários; só envia o convite de acesso ao portal.
- **Categorias de milha**: atribuídas à mão pela Vay, uma por empresa, com validade futura obrigatória. Vigentes até a data de validade (inclusive); no dia seguinte, encerram sozinhas: somem do portal e vão para "Encerradas" no painel.
- **Senhas dos programas**: cifradas (AES-256-GCM) e legíveis só pelo próprio comissário. A equipe Vay não tem acesso a esse campo, nem pelo banco com o usuário dela.

## Tecnologia

Igual ao sistema de agências parceiras: **Next.js 15** (App Router, Server Actions), **Supabase** (login, Postgres e regras de acesso RLS), **Vercel** (hospedagem e sincronização diária).

## Colocando no ar (uma vez só)

### 1. Supabase (banco e login)

1. Crie um projeto novo em <https://supabase.com> (região *South America (São Paulo)*).
2. Em **SQL Editor › New query**, cole `supabase/migrations/0001_init.sql` e clique em **Run**.
3. Em **Authentication › Sign In / Providers**, desligue **Allow new users to sign up**. O acesso é só por convite.
4. Em **Authentication › Emails**, troque o link dos modelos:
   - **Invite user**: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite&next=/definir-senha`
   - **Reset password**: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/definir-senha`
5. Em **Project Settings › API**, copie a *Project URL*, a chave *anon public* e a chave *service_role*.

### 2. HubSpot

1. Crie um app privado com escopos de leitura de contatos e do objeto Courses (Créditos). Detalhes em `docs/HUBSPOT.md`.
2. Copie o token.

### 3. Vercel (hospedagem)

1. Importe o repositório na Vercel.
2. Em **Environment Variables**, preencha as variáveis de `.env.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`: o endereço final
   - `CREDENTIALS_KEY`: gere uma vez com o comando abaixo e **guarde num cofre de senhas**. Se ela mudar ou se perder, as senhas já guardadas pelos comissários ficam ilegíveis.
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     ```
   - `HUBSPOT_TOKEN`, `HUBSPOT_PORTAL_ID` (44656712) e `CRON_SECRET` (qualquer texto longo e aleatório)
3. Clique em **Deploy**. A sincronização diária (06:00 de Brasília) já vem configurada em `vercel.json`.
4. No Supabase, em **Authentication › URL Configuration**, coloque o mesmo endereço em **Site URL**.

### 4. Primeiro acesso da equipe Vay

1. No Supabase, em **Authentication › Users › Add user › Create new user**, crie o seu usuário.
2. No **SQL Editor**:
   ```sql
   update profiles set role = 'vay', full_name = 'Seu Nome' where email = 'seu-email@vayagora.com.br';
   ```
3. Entre no sistema, abra **Comissários** e clique em **Sincronizar com HubSpot**: os comissários são importados. Em cada um, **Convidar para o portal** envia o acesso para o e-mail do contato.

Para dar acesso a outro colega da Vay, repita os passos 1 e 2 para ele.

## Rodando no computador

```bash
npm install
cp .env.example .env.local   # preencha as chaves
npm run dev                  # http://localhost:3000
npm test                     # testes (os de acesso ao banco sobem um Postgres local, se houver)
```

## Estrutura

```
supabase/migrations/            esquema do banco + regras de acesso (RLS)
docs/SPEC.md                    especificação (handoff do protótipo)
docs/HUBSPOT.md                 campos do HubSpot usados
src/lib/programs.ts             empresas, categorias e benefícios
src/lib/categories.ts           vigência das categorias
src/lib/statement.ts            extrato (saldo de cada linha, totais)
src/lib/crypto.ts               cifra das senhas dos programas
src/lib/hubspot.ts, sync.ts     leitura do HubSpot e sincronização
src/app/(app)/                  telas após o login (portal e painel)
src/app/(app)/actions.ts        todas as gravações
test/rls.test.ts                testes das regras de acesso
```

## Pendências

- Tela "Relatórios de créditos" (painel interno) ainda não desenhada; o menu mostra uma página provisória.
- Benefícios por categoria (`src/lib/programs.ts`): só os de LATAM Pass · Black vieram do protótipo. Os demais são um rascunho genérico e **precisam ser conferidos com os regulamentos** antes de abrir o portal aos comissários.
- Validar com o jurídico o uso de contas de terceiros e o armazenamento de senhas.
