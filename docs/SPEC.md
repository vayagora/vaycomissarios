# Portal do Comissário Vay Agora — especificação (handoff do protótipo)

Protótipo validado em 19/11/2026. Este pacote reúne as telas, o design system e as regras de negócio decididas durante o desenho. Use este documento como especificação; as telas em `docs/prototipo/telas/` são a referência visual.

Protótipo navegável (canvas): https://claude.ai/artifact/SvkCFw4ezEGGhXrF4NWpB6

---

## 1. O que tem no pacote

| Pasta / arquivo | Conteúdo |
|---|---|
| `telas/comissario/Main.dc.html` | Início do portal do comissário |
| `telas/comissario/Programas.dc.html` | Meus programas (lista de categorias vigentes) |
| `telas/comissario/ProgramaDetalhe.dc.html` | Detalhe de uma categoria (benefícios, escada, dados de acesso) |
| `telas/comissario/Creditos.dc.html` | Extrato |
| `telas/comissario/Termo.dc.html` | Meu termo de parceria |
| `telas/admin-vay/VayComissarios.dc.html` | Painel interno: lista de comissários |
| `telas/admin-vay/VayComissarioDetalhe.dc.html` | Painel interno: detalhe do comissário (categorias, termo, extrato) |
| `design-system/` | Tokens da marca Vay Agora (cores, tipografia, espaçamento, base) |

**Sobre os arquivos `.dc.html`:** são páginas HTML de protótipo. A marcação usa estilos inline com os tokens do design system (`var(--...)`), `<sc-for>` para listas, `<sc-if>` para condicionais e `{{campo}}` para dados. Os dados de exemplo e a lógica de interação ficam no `<script type="text/x-dc">` no fim de cada arquivo. Componentes da marca aparecem como `<x-import component-from-global-scope="VayAgoraV1_0fc08b.Button" ...>` (Button, Input, Select, Badge, Tag, Avatar). Reimplemente com o componente equivalente do projeto.

**Fontes:** Nortica (UI/texto) e Zujin (títulos e números). Não estão no pacote; Zujin é licenciada via Envato Elements para o projeto Vay Agora. Os arquivos estão no design system oficial: https://claude.ai/artifact/8PAvhrVQT4X5D5HKMgxgeF

**Ícones:** Lucide (stroke 2px, 24×24).

---

## 2. Perfis e navegação

### Comissário (portal externo)
Menu lateral, nesta ordem:
1. **Início**
2. **Meus programas**
3. **Extrato**
4. **Meu termo de parceria**

Rodapé do menu: card "Fale com a gente" com link para o WhatsApp `https://wa.me/553184698918` (+55 31 8469-8918). É o único ponto de contato/pedido de passagem do portal; não repetir botões de WhatsApp nas telas.

### Admin Vay (painel interno)
Menu lateral escuro (`--surface-inverse`), rótulo "Painel interno":
1. **Comissários**
2. **Relatórios de créditos** (ainda não desenhado)

Rodapé: avatar, nome e equipe do usuário logado.

---

## 3. Regras de negócio

### Comissários
- Todo comissário é sempre ativo. **Não existe status de comissário** — não exibir.
- O comissário **não compra nem usa créditos pelo sistema**. Pedidos de passagem são sempre pelo WhatsApp.
- O comissário **não vê movimentações das contas de milhas** (emissões feitas com o CPF dele). Só a Vay vê isso.

### Créditos
- **Créditos nunca expiram.** Não exibir validade, vencimento ou "vence em breve" para créditos.
- **Saldo** = campo do contato no HubSpot **"Saldo atual em créditos"** (`creditos_abertos`, número).
- **Extrato** = registros do objeto **"Créditos"** associados ao contato no HubSpot (é o objeto padrão *Course*, `objectTypeId 0-410`, renomeado para "Créditos"). **Cada registro vira uma linha do extrato.**
- **Não é permitido lançar créditos pelo sistema.** Lançamentos são criados e corrigidos só no HubSpot. O painel interno é apenas leitura para créditos.

### Categorias de milha
- As categorias **não vêm das companhias**. São atribuídas manualmente pelo admin Vay, comissário a comissário.
- **Uma categoria por empresa por comissário.** Atribuir uma nova numa empresa que já tem categoria substitui a anterior (o modal avisa).
- **Validade é obrigatória** e precisa ser uma data futura.
- **Na data de validade, a categoria é encerrada automaticamente**: some do portal do comissário e vai para "Encerradas" no painel do admin, com a opção "Recadastrar".
- Categorias a até 45 dias da validade aparecem como "Vence em X dias" (amarelo) no painel do admin e no portal.
- O admin pode **excluir** uma categoria (vigente ou encerrada), sempre com confirmação e aviso de que a ação não pode ser desfeita.
- As categorias **não são guardadas no HubSpot**; ficam no próprio sistema.

**Empresas e categorias disponíveis (listas suspensas do modal):**

| Empresa | Categorias (em ordem) |
|---|---|
| LATAM Pass | Gold, Platinum, Black, Black Signature |
| Smiles | Prata, Ouro, Diamante |
| Azul Fidelidade | Topázio, Safira, Diamante, Diamante Unique |

Observações: o LATAM Pass descontinuou a Gold Plus; Azul Fidelidade é o nome atual do antigo TudoAzul. Revisar estas listas periodicamente com os regulamentos dos programas.

### Termo de parceria
- Definido pelo admin Vay, **caso a caso**, na tela do comissário:
  - **Início** e **Vigente até** (datas; fim não pode ser antes do início)
  - Três listas editáveis (adicionar/remover itens): **O que recebe**, **O que pode fazer**, **O que não pode fazer**
- O comissário vê apenas leitura: as duas datas e as três listas. Sem download de PDF, sem histórico, sem texto jurídico.

### Dados de acesso aos programas
- No detalhe de cada programa, o comissário pode guardar **login e senha** do programa para consulta própria (mostrar/ocultar senha, salvar).
- **Requisito de segurança:** a senha precisa ser armazenada criptografada e não pode ser exibida à equipe Vay por este campo.

---

## 4. Integração HubSpot

### Contato (`CONTACT`)
| Uso | Propriedade | Tipo |
|---|---|---|
| Saldo exibido no portal e no painel | `creditos_abertos` — "Saldo atual em créditos" | number |
| (referência) | `creditos_utilizados` — "Créditos utilizados" | number |
| CPF exibido mascarado | `cpf` | string |

Não existe hoje uma propriedade que identifique quem é comissário. Criar uma (ex.: checkbox "É comissário") para montar a lista do painel.

### Objeto Créditos (`COURSE`, 0-410) → linhas do extrato
| Coluna do extrato | Propriedade | Observação |
|---|---|---|
| Data | `hs_createdate` | Não há campo de data próprio; usar a data de criação |
| Lançamento (descrição) | `hs_course_name` — "Lançamento" | ex.: "Crédito Mensal - Programa Comissário", "Biometria Latam - LWQXRT" |
| Tipo | `tipo_de_movimentacao` | enum: `Acúmulo` / `Uso` |
| Motivo | `motivo_do_credito` — "Motivo de movimentação" | enum (ver abaixo) |
| Valor (entrada) | `valor_total_do_credito` — "[ACÚMULO] Valor creditado" | usar quando Tipo = Acúmulo |
| Valor (saída) | `valor_utilizado` — "[USO] Valor debitado" | usar quando Tipo = Uso |
| (não exibido) | `valor_restante_do_credito`, `nome_do_beneficiado`, `hs_course_description` | |

Valores do enum `motivo_do_credito`: Cancelamento de compra, Nova compra, Prestação de serviço, Programa Afiliados, Programa Comissário, Relacionamento, Saque, Transferência pessoal, Vay Explora, Vencimento, Venda de milhas, VM/comissão.

**Rótulos por perfil:** no painel Vay, o tipo aparece como no HubSpot ("Acúmulo" / "Uso"). No portal do comissário, como "Entrada" / "Gasto".

**Coluna Saldo do extrato:** saldo após cada lançamento, calculado de trás para frente a partir de `creditos_abertos` (lançamentos ordenados do mais recente para o mais antigo).

### Sincronização
- Padrão igual ao sistema de agências parceiras: botão **"Sincronizar com HubSpot"** (outline) + ícone "i" com tooltip "Última sincronização: …". Feedback em toast escuro no canto superior direito.
- Não existe aba de integração no menu.

---

## 5. Telas

### Comissário
**Início** — saudação; card roxo com saldo de créditos (+ "Seus créditos não expiram") e botão "Ver extrato"; card "Sua parceria" (comissário desde, categorias vigentes, termo vigente até, link para o termo); grade "Suas categorias" com as categorias vigentes (empresa, categoria, validade).

**Meus programas** — só o título e cards simples, sem filtros: empresa, categoria, validade, botão "Ver detalhes". Mostra só categorias vigentes.

**Detalhe do programa** — bloco escuro com empresa, categoria, validade e dias restantes; "Onde você está no programa" (escada de categorias da empresa); benefícios da categoria; "Seus dados de acesso". Sem movimentações da conta.

**Extrato** — título "Extrato"; três números (Saldo disponível, Total acumulado, Total usado); filtros Tudo / Entradas / Gastos; tabela Data, Tipo, Descrição (lançamento + motivo), Valor, Saldo.

**Meu termo de parceria** — Início, Vigente até e as três listas (recebe / pode / não pode).

### Admin Vay
**Lista de comissários** — botão "Sincronizar com HubSpot" + "Cadastrar comissário"; KPIs (comissários, saldo total em créditos, créditos acumulados no mês, créditos usados no mês); busca por nome/CPF; filtros Todos / Categoria vencendo / Saldo acima de R$ 3.000; tabela com comissário, categorias vigentes (chips; amarelo quando vencendo), última movimentação, saldo e "Ver comissário".

**Detalhe do comissário** — cabeçalho com nome, CPF mascarado, datas do termo, "Abrir no HubSpot" e **"Atribuir categoria de milha"**; números de saldo (com tooltip da origem), total acumulado, total usado e sincronização; seção **Categorias de milha** (vigentes com Alterar/Excluir; encerradas com Excluir/Recadastrar); seção **Termo de parceria** editável com "Salvar termo"; **Extrato de créditos** (Data, Lançamento, Motivo, Tipo, Valor, Saldo; filtros Tudo / Acúmulos / Usos).

**Modal "Atribuir categoria de milha"** — Empresa (select) → Categoria (select dependente, desabilitado até escolher a empresa) → Validade (date, obrigatória, futura). Aviso de substituição quando já existe categoria naquela empresa. Botão "Atribuir categoria" só habilita com tudo válido.

**Confirmação de exclusão** — `alertdialog` com ícone de lixeira, nome da categoria, texto "Esta ação não pode ser desfeita." em vermelho, botões "Cancelar" e "Excluir categoria" (variant danger).

---

## 6. Padrões de design e UX (manter iguais ao sistema de agências parceiras)
- Títulos de página = nome da aba, sem frase de chamada nem subtítulo.
- Explicações secundárias em ícone "i" com tooltip, não em texto corrido.
- Feedback de ações: toast escuro, canto superior direito, some sozinho (~3,5 s).
- Botões em pílula; primário roxo (`--color-primary`), outline para ações secundárias, danger para exclusões.
- Cards brancos, borda `--border-subtle`, raio 16–22px, sombra suave.
- Números grandes e categorias em Zujin; todo o resto em Nortica.
- Alvos de toque ≥ 44px; páginas fluidas, menu lateral empilha no celular, tabelas com rolagem horizontal.

## 7. Pendências
- Tela "Relatórios de créditos" (painel interno) não foi desenhada.
- Tela de login do portal e do painel não foi desenhada (sugestão: seguir a do sistema de agências parceiras).
- Criar no HubSpot a propriedade que marca o contato como comissário.
- Validar com o jurídico o uso de contas de terceiros e o armazenamento de senhas.
