# Integração com o HubSpot da Vay Agora

A sincronização (`src/lib/sync.ts`, cliente em `src/lib/hubspot.ts`) só **lê** do HubSpot (portal 44656712). Nada é gravado lá. Os nomes abaixo foram conferidos na conta em 19/11/2026.

## Quem é comissário

O sistema **importa** os comissários do HubSpot; a Vay não cadastra ninguém à mão.

**Comissário = contato associado a pelo menos um registro de Créditos com motivo (`motivo_do_credito`) "Programa Comissário".**

- A sincronização busca todos esses registros (`/crm/v3/objects/0-410/search`), lê os contatos associados (`/crm/v4/associations/0-410/contacts/batch/read`) e cria no sistema os que ainda não existem.
- "Comissário desde" = data do primeiro crédito do Programa Comissário do contato.
- Nome, e-mail, CPF e saldo são atualizados a cada sincronização a partir do contato.
- Para alguém entrar no programa, basta lançar o primeiro crédito com esse motivo e associá-lo ao contato. Atenção: um crédito "Programa Comissário" associado por engano a outro contato também torna esse contato comissário.
- Comissário que deixa de ter créditos do programa não é apagado do sistema (o histórico fica).
- O acesso ao portal é dado pela Vay no detalhe do comissário ("Convidar para o portal"), usando o e-mail do contato.

Em 19/11/2026: 243 registros com esse motivo desde 09/09/2026; 70 créditos mensais em novembro.

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
- Ao convidar um comissário não há sincronização: os dados já estão no sistema.

## App privado

Escopos (só leitura): `crm.objects.contacts.read` e o escopo de leitura do objeto Courses (na tela de escopos do app privado, procure por "courses"). O token vai em `HUBSPOT_TOKEN`.
