# Plano de Desenvolvimento - Estoque Interno (separado do estoque atual)

## 1. Objetivo
Criar um modulo de **estoque interno** separado do estoque de venda atual do site, com:
- cadastro de fornecedores;
- cadastro de itens internos com custo e quantidade;
- exibicao de custo, preco de venda no site e preco de venda no Mercado Livre;
- configuracao global de percentual para precificacao (site e Mercado Livre), com efeito em todos os itens.

## 2. Regras de negocio consolidadas
1. O novo estoque interno nao substitui o estoque atual usado no checkout.
2. Fornecedor pode ser:
- uma lista propria de fornecedores; ou
- reaproveitamento da lista de Parceiros/Marcas ja existente.
3. No cadastro de item interno, campos obrigatorios:
- nome
- descricao
- quantidade
- valor unitario (custo)
- fornecedor (selecionado de lista previamente cadastrada)
4. A listagem de itens internos deve exibir:
- nome
- quantidade
- valor unitario
- valor de venda no site
- valor de venda no Mercado Livre
5. Percentual de venda do site e do Mercado Livre deve ser global e configuravel.
6. Ao alterar percentual global, todos os valores derivados devem refletir a mudanca.

## 3. Decisao de arquitetura (recomendada)
### 3.1 Separacao de dominios
- Manter dominio atual de `Product.stock` e checkout sem alteracao funcional.
- Criar novo dominio:
- `internal_stock_items`
- `pricing_config`
- `suppliers` (ou usar `partners` como fornecedor)

### 3.2 Persistencia obrigatoria
Hoje as configuracoes do admin estao em memoria no backend. Para esse modulo, usar banco de dados desde o inicio para evitar perda de dados em restart.

### 3.3 Estrategia para fornecedores
Opcao A (recomendada): tabela propria `suppliers`, com opcao "importar de parceiros".
- Pro: nao acopla compras internas ao marketing/marca.
- Pro: permite fornecedor sem ser marca.

Opcao B (atalho): usar `partners` diretamente como fornecedor.
- Pro: mais rapido para entregar.
- Contra: mistura conceito comercial e operacional.

## 4. Modelagem de dados
## 4.1 Tabela `pricing_config`
Uma linha ativa de configuracao global.
Campos sugeridos:
- `id`
- `site_markup_percent` DECIMAL(5,2) NOT NULL DEFAULT 0
- `marketplace_markup_percent` DECIMAL(5,2) NOT NULL DEFAULT 0
- `rounding_strategy` VARCHAR(20) DEFAULT '2_decimals'
- `updated_by`
- `created_at`
- `updated_at`

## 4.2 Tabela `suppliers`
Campos sugeridos:
- `id`
- `name` VARCHAR(120) UNIQUE NOT NULL
- `active` BOOLEAN DEFAULT true
- `source` ENUM('manual','partner_import') DEFAULT 'manual'
- `created_at`
- `updated_at`

## 4.3 Tabela `internal_stock_items`
Campos sugeridos:
- `id`
- `name` VARCHAR(200) NOT NULL
- `description` TEXT NOT NULL
- `quantity` INT NOT NULL DEFAULT 0
- `unit_cost` DECIMAL(12,2) NOT NULL
- `supplier_id` FK -> suppliers.id (NOT NULL)
- `site_sale_price` DECIMAL(12,2) NOT NULL
- `ml_sale_price` DECIMAL(12,2) NOT NULL
- `created_at`
- `updated_at`

Indices:
- `idx_internal_stock_items_supplier`
- `idx_internal_stock_items_name`

## 5. Formula de preco (global)
Com base no custo unitario `C`:
- preco_site = C * (1 + p_site/100)
- preco_ml = C * (1 + p_ml/100)

Onde:
- `p_site` = percentual global do site
- `p_ml` = percentual global do Mercado Livre

Regras:
1. Salvar os percentuais na `pricing_config`.
2. Recalcular `site_sale_price` e `ml_sale_price` em lote quando percentuais mudarem.
3. Arredondamento padrao para 2 casas.

Observacao: manter os valores calculados nas colunas melhora performance de listagem e exportacao.

## 6. API (backend)
## 6.1 Fornecedores
- `GET /api/internal-stock/suppliers`
- `POST /api/internal-stock/suppliers`
- `PUT /api/internal-stock/suppliers/:id`
- `DELETE /api/internal-stock/suppliers/:id` (soft delete recomendado)

## 6.2 Configuracao de precificacao
- `GET /api/internal-stock/pricing-config`
- `PUT /api/internal-stock/pricing-config`

Comportamento do PUT:
- valida percentuais >= 0;
- salva configuracao;
- dispara job transacional para recalcular precos de todos os itens internos.

## 6.3 Itens de estoque interno
- `GET /api/internal-stock/items`
- `GET /api/internal-stock/items/:id`
- `POST /api/internal-stock/items`
- `PUT /api/internal-stock/items/:id`
- `DELETE /api/internal-stock/items/:id`

No `POST/PUT`:
- valida campos obrigatorios;
- valida fornecedor existente;
- calcula e persiste `site_sale_price` e `ml_sale_price` com base na config atual.

## 7. Interface admin (frontend)
## 7.1 Navegacao
Adicionar item no menu admin:
- "Estoque Interno"

## 7.2 Tela principal do estoque interno
Blocos:
1. **Configuracao de Preco**
- percentual Site
- percentual Mercado Livre
- botao "Salvar e Recalcular"

2. **Cadastro de Item Interno**
- nome
- descricao
- quantidade
- valor unitario
- fornecedor (select)

3. **Lista de Itens**
Colunas:
- nome
- quantidade
- valor unitario
- valor venda site
- valor venda ML
- fornecedor
- acoes (editar/excluir)

## 7.3 Onde colocar no admin
Duas opcoes:
1. Nova pagina dedicada "Estoque Interno" (recomendada)
2. Bloco dentro de "Configuracoes" (mais rapido, menos escalavel)

Recomendacao: pagina dedicada para crescer com entradas/saidas, historico e relatorios.

## 7.4 Fornecedor vindo de Parceiros/Marcas
Adicionar botao na secao de fornecedores:
- "Importar de Parceiros/Marcas"

Comportamento:
- sincroniza nomes faltantes para `suppliers`;
- nao remove fornecedores ja cadastrados manualmente.

## 8. Migracao e rollout
## Fase 1 - Banco e backend base
- criar migrations das 3 tabelas;
- criar models e rotas;
- validacoes e testes unitarios de calculo.

## Fase 2 - Frontend admin
- nova tela de estoque interno;
- CRUD de fornecedores;
- CRUD de itens;
- configuracao global de precificacao.

## Fase 3 - Recalculo global seguro
- implementar recalculo em transacao;
- log de auditoria da alteracao de percentual;
- feedback de total de itens recalculados.

## Fase 4 - Integracao opcional com Parceiros/Marcas
- importar lista de parceiros para fornecedores;
- resolver duplicidade por nome normalizado.

## 9. Validacoes e seguranca
- endpoints protegidos por admin.
- validacao server-side de:
- `quantity >= 0`
- `unit_cost > 0`
- percentuais `>= 0`
- fornecedor valido
- auditar alteracoes de configuracao e exclusoes.

## 10. Criterios de aceite
1. Consigo cadastrar fornecedor e selecionar no cadastro do item interno.
2. Consigo cadastrar item com nome, descricao, quantidade e valor unitario.
3. Lista mostra nome, quantidade, valor unitario, valor site e valor ML.
4. Alterar percentual global atualiza preco derivado de todos os itens.
5. Nenhuma mudanca quebra o estoque atual do site/checkout.

## 11. Estimativa de execucao
- Fase 1: 1 a 2 dias
- Fase 2: 1 a 2 dias
- Fase 3: 0,5 a 1 dia
- Fase 4: 0,5 dia

Total: 3 a 5,5 dias uteis.

## 12. Riscos e mitigacoes
- Risco: confundir estoque interno com estoque de venda atual.
- Mitigacao: separar tabela, rotas e tela claramente.

- Risco: perder configuracao por restart.
- Mitigacao: persistir configuracoes em banco (nao em memoria).

- Risco: recalculo massivo lento.
- Mitigacao: update em lote com transacao e paginacao se necessario.

## 13. Proxima evolucao (depois do MVP)
- entrada/saida de estoque interno por movimentacao;
- custo medio ponderado;
- historico de alteracao de preco;
- exportacao CSV/PDF;
- alerta de estoque interno minimo.
