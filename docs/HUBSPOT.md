# Integração com o HubSpot da Vay Agora

A sincronização (`src/lib/sync.ts`, cliente em `src/lib/hubspot.ts`) só **lê** do HubSpot (portal 44656712). Nada é gravado lá. Os nomes abaixo foram conferidos na conta em 19/11/2026.

## Quem é comissário

A lista de comissários é a tabela `commissioners` do sistema (botão "Cadastrar comissário"). Cada comissário é ligado ao **contato** do HubSpot com o mesmo e-mail:
- no cadastro, o sistema procura o contato pelo e-mail;
- se não achar, a cada sincronização tenta de novo pelo e-mail (e avisa na mensagem de resultado).

Assim, a propriedade "É comissário" no HubSpot (pendência do handoff) **não é necessária** para o sistema funcionar. Ela continua útil para listas e relatórios dentro do próprio HubSpot.

## Contato (`contacts`)

| Uso | Propriedade | Tipo |
|---|---|---|
| Saldo no portal e no painel | `creditos_abertos` ("Saldo atual em créditos") | number |
| CPF (exibido mascarado: •••.482.•••-21) | `cpf` | string |

## Objeto Créditos (`0-410`, objeto padrão Course renomeado) → linhas do extrato

Registros associados ao contato (`/crm/v4/associations/contacts/0-410/batch/read`). Cada registro vira uma linha.

| Coluna | Propriedade | Observação |
|---|---|---|
| Data | `hs_createdate` | data de criação (não há campo de data próprio) |
| Lançamento | `hs_course_name` ("Lançamento") | |
| Tipo | `tipo_de_movimentacao` | `Acúmulo` / `Uso`. Vazio: decide pelo campo de valor preenchido |
| Motivo | `motivo_do_credito` ("Motivo de movimentação") | enum |
| Valor (Acúmulo) | `valor_total_do_credito` ("[ACÚMULO] Valor creditado") | |
| Valor (Uso) | `valor_utilizado` ("[USO] Valor debitado") | |

Saldo de cada linha: calculado de trás para frente a partir de `creditos_abertos`, do lançamento mais recente para o mais antigo. Se o saldo do contato não bater com a soma dos lançamentos, a primeira linha (mais antiga) mostra a diferença; corrija no HubSpot.

Registro apagado ou desassociado no HubSpot some do extrato na próxima sincronização.

## Quando sincroniza

- Todo dia às 06:00 (Brasília), pelo Vercel Cron (`vercel.json` → `/api/cron/sync`, protegido por `CRON_SECRET`).
- Botão "Sincronizar com HubSpot" na lista (todos) e no detalhe do comissário (só ele).
- Ao cadastrar um comissário com contato encontrado.

## App privado

Escopos (só leitura): `crm.objects.contacts.read` e o escopo de leitura do objeto Courses (na tela de escopos do app privado, procure por "courses"). O token vai em `HUBSPOT_TOKEN`.
