# Integração com o HubSpot da Vay Agora

A sincronização (`src/lib/sync.ts`, cliente em `src/lib/hubspot.ts`) só **lê** do HubSpot (portal 44656712). Nada é gravado lá. Os nomes abaixo foram conferidos na conta em 19/11/2026.

## Quem é comissário

O sistema **importa** os comissários do HubSpot; a Vay não cadastra ninguém à mão.

**Comissário = contato com a opção "Comissário" marcada em "Condições Especiais" (`condicoes_especiais`, seleção múltipla).**

- A sincronização busca esses contatos (`/crm/v3/objects/contacts/search`, `condicoes_especiais IN ["Comissário"]`) e cria no sistema os que ainda não existem.
- Desmarcou a opção no HubSpot: na próxima sincronização o comissário sai da lista e perde o acesso ao portal (RLS). Categorias de milha e termo ficam guardados; se a marcação voltar, tudo reaparece.
- "Comissário desde" = data do primeiro crédito com motivo "Programa Comissário" do contato (sem nenhum, a do primeiro crédito).
- Nome, e-mail, CPF e saldo são atualizados a cada sincronização a partir do contato.
- O acesso ao portal é dado pela Vay no detalhe do comissário ("Convidar para o portal"), usando o e-mail do contato.

Por que não pelo motivo do crédito: em 19/11/2026, 38 contatos tinham a marcação, mas o lote de "Crédito Mensal - Programa Comissário" de novembro foi para 70 contatos (37 dos marcados + 33 sem marcação, muitos com o sobrenome de um comissário). O crédito do programa não identifica quem é o comissário; a marcação, sim.

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
