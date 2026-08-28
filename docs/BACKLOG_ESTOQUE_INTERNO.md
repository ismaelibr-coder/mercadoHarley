# Backlog Tecnico - Estoque Interno

## Objetivo do backlog
Transformar o plano do modulo de estoque interno em tarefas executaveis, com sequencia de implementacao, estimativa e criterios de pronto.

## Convencoes
- Esforco:
- P: ate 2h
- M: 2h a 6h
- G: 6h a 1 dia
- GG: acima de 1 dia
- Prioridade: P0 (critico), P1 (alto), P2 (medio)
- Status inicial: TODO

## Milestone 1 - Base de dados e contratos de API (P0)
Objetivo: colocar estrutura persistente no backend sem impactar estoque atual do site.

### Tarefa 1.1 - Criar migration da tabela de configuracao global
- Tipo: Backend/DB
- Prioridade: P0
- Esforco: M
- Dependencias: nenhuma
- Entrega:
- Criar tabela `pricing_config` com campos:
  - id (PK)
  - site_markup_percent DECIMAL(5,2) NOT NULL DEFAULT 0
  - marketplace_markup_percent DECIMAL(5,2) NOT NULL DEFAULT 0
  - rounding_strategy VARCHAR(20) DEFAULT '2_decimals'
  - updated_by VARCHAR(255) NULL
  - created_at, updated_at
- Inserir 1 registro inicial (seed): site=0, ml=0
- Criterio de pronto:
- Migration aplica e faz rollback sem erro.
- Registro inicial existe apos migracao/seed.

### Tarefa 1.2 - Criar migration da tabela de fornecedores
- Tipo: Backend/DB
- Prioridade: P0
- Esforco: M
- Dependencias: nenhuma
- Entrega:
- Criar tabela `suppliers`:
  - id (PK)
  - name VARCHAR(120) UNIQUE NOT NULL
  - active BOOLEAN DEFAULT true
  - source ENUM('manual','partner_import') DEFAULT 'manual'
  - created_at, updated_at
- Criterio de pronto:
- Constraint UNIQUE em name funcionando.
- Migration/rollback validos.

### Tarefa 1.3 - Criar migration da tabela de itens internos
- Tipo: Backend/DB
- Prioridade: P0
- Esforco: G
- Dependencias: 1.2
- Entrega:
- Criar tabela `internal_stock_items`:
  - id (PK)
  - name VARCHAR(200) NOT NULL
  - description TEXT NOT NULL
  - quantity INT NOT NULL DEFAULT 0
  - unit_cost DECIMAL(12,2) NOT NULL
  - supplier_id FK NOT NULL -> suppliers.id
  - site_sale_price DECIMAL(12,2) NOT NULL
  - ml_sale_price DECIMAL(12,2) NOT NULL
  - created_at, updated_at
- Criar indices por supplier_id e name.
- Criterio de pronto:
- FK e indices ativos.
- Insercao de item com supplier inexistente falha corretamente.

### Tarefa 1.4 - Criar models Sequelize
- Tipo: Backend
- Prioridade: P0
- Esforco: M
- Dependencias: 1.1, 1.2, 1.3
- Entrega:
- Model `PricingConfig`
- Model `Supplier`
- Model `InternalStockItem`
- Associacoes:
- Supplier hasMany InternalStockItem
- InternalStockItem belongsTo Supplier
- Criterio de pronto:
- Sync/migration ok.
- Consultas basicas por model funcionando em ambiente local.

### Tarefa 1.5 - Garantir nao regressao no estoque atual
- Tipo: Backend
- Prioridade: P0
- Esforco: P
- Dependencias: nenhuma
- Entrega:
- Revisar fluxo atual de checkout e confirmar que continua usando Product.stock.
- Adicionar comentario tecnico no codigo/README do modulo informando separacao de dominios.
- Criterio de pronto:
- Nenhuma alteracao do modulo novo escreve em Product.stock.

## Milestone 2 - Servicos e regras de preco (P0)
Objetivo: implementar regra de calculo global com recálculo em massa.

### Tarefa 2.1 - Criar utilitario de calculo de preco
- Tipo: Backend
- Prioridade: P0
- Esforco: P
- Dependencias: 1.1
- Entrega:
- Funcao:
- precoSite = custo * (1 + pSite/100)
- precoML = custo * (1 + pML/100)
- Arredondamento para 2 casas.
- Criterio de pronto:
- Testes unitarios cobrindo percentual 0, decimal e valores altos.

### Tarefa 2.2 - CRUD de fornecedores no service
- Tipo: Backend
- Prioridade: P0
- Esforco: M
- Dependencias: 1.2
- Entrega:
- listSuppliers, createSupplier, updateSupplier, deactivateSupplier.
- Validacao de duplicidade por nome normalizado (trim/case-insensitive).
- Criterio de pronto:
- Operacoes CRUD com retorno padrao e tratamento de erro.

### Tarefa 2.3 - CRUD de itens internos no service
- Tipo: Backend
- Prioridade: P0
- Esforco: G
- Dependencias: 1.3, 1.4, 2.1
- Entrega:
- createInternalStockItem com calculo automatico dos dois precos.
- updateInternalStockItem recalculando precos quando custo mudar.
- list e getById incluindo fornecedor relacionado.
- soft delete (campo active) ou delete controlado.
- Criterio de pronto:
- Campos obrigatorios validados e fornecedor obrigatorio respeitado.

### Tarefa 2.4 - Atualizacao global de percentual + recálculo em lote
- Tipo: Backend
- Prioridade: P0
- Esforco: G
- Dependencias: 1.1, 2.1, 2.3
- Entrega:
- updatePricingConfig em transacao.
- Recalcular site_sale_price e ml_sale_price de todos os itens internos.
- Retornar total de itens atualizados.
- Criterio de pronto:
- Mudanca de percentual reflete em 100% dos itens.
- Em erro, rollback completo.

## Milestone 3 - Rotas e validacao de API (P0)
Objetivo: expor endpoints seguros para o admin.

### Tarefa 3.1 - Rotas de fornecedores
- Tipo: Backend/API
- Prioridade: P0
- Esforco: M
- Dependencias: 2.2
- Entrega:
- GET /api/internal-stock/suppliers
- POST /api/internal-stock/suppliers
- PUT /api/internal-stock/suppliers/:id
- DELETE /api/internal-stock/suppliers/:id
- Proteger com verifyAdmin.
- Criterio de pronto:
- Somente admin acessa.
- Validacoes de payload aplicadas.

### Tarefa 3.2 - Rotas de configuracao de preco
- Tipo: Backend/API
- Prioridade: P0
- Esforco: M
- Dependencias: 2.4
- Entrega:
- GET /api/internal-stock/pricing-config
- PUT /api/internal-stock/pricing-config
- PUT retorna quantidade de itens recalculados.
- Criterio de pronto:
- Percentuais invalidos retornam 400.
- Operacao bem-sucedida retorna config atualizada.

### Tarefa 3.3 - Rotas de itens internos
- Tipo: Backend/API
- Prioridade: P0
- Esforco: G
- Dependencias: 2.3
- Entrega:
- GET /api/internal-stock/items
- GET /api/internal-stock/items/:id
- POST /api/internal-stock/items
- PUT /api/internal-stock/items/:id
- DELETE /api/internal-stock/items/:id
- Criterio de pronto:
- Criacao/edicao refletindo precos calculados.
- Erros de validacao padronizados.

### Tarefa 3.4 - Auditoria de alteracoes criticas
- Tipo: Backend/Security
- Prioridade: P1
- Esforco: M
- Dependencias: 3.2, 3.3
- Entrega:
- Logar alteracao de percentual e exclusao de item.
- Reusar middleware de audit log existente.
- Criterio de pronto:
- Eventos registrados em trilha de auditoria.

## Milestone 4 - Frontend admin (P0)
Objetivo: entregar fluxo completo no painel.

### Tarefa 4.1 - Criar pagina AdminEstoqueInterno
- Tipo: Frontend
- Prioridade: P0
- Esforco: M
- Dependencias: 3.1, 3.2, 3.3
- Entrega:
- Nova pagina com 3 blocos:
  - Configuracao global de preco
  - Cadastro de item interno
  - Lista de itens internos
- Criterio de pronto:
- Pagina carrega dados reais da API.

### Tarefa 4.2 - Adicionar rota e menu no admin
- Tipo: Frontend
- Prioridade: P0
- Esforco: P
- Dependencias: 4.1
- Entrega:
- Incluir item "Estoque Interno" no menu lateral.
- Configurar rota protegida de admin.
- Criterio de pronto:
- Navegacao funcionando desktop/mobile.

### Tarefa 4.3 - Formulario de configuracao global
- Tipo: Frontend
- Prioridade: P0
- Esforco: M
- Dependencias: 3.2
- Entrega:
- Inputs: percentual Site e percentual Mercado Livre.
- Botao "Salvar e Recalcular".
- Exibir retorno de qtd de itens recalculados.
- Criterio de pronto:
- Alterar percentual atualiza lista apos salvar.

### Tarefa 4.4 - Formulario de cadastro de item interno
- Tipo: Frontend
- Prioridade: P0
- Esforco: M
- Dependencias: 3.1, 3.3
- Entrega:
- Campos obrigatorios:
  - nome
  - descricao
  - quantidade
  - valor unitario
  - fornecedor (select)
- Validacao de formulario e mensagens de erro.
- Criterio de pronto:
- Item cadastrado aparece na listagem com os 5 campos solicitados.

### Tarefa 4.5 - Tabela de listagem com colunas obrigatorias
- Tipo: Frontend
- Prioridade: P0
- Esforco: M
- Dependencias: 4.4
- Entrega:
- Colunas:
  - Nome
  - Quantidade
  - Valor unitario
  - Valor venda site
  - Valor venda ML
  - Fornecedor
  - Acoes
- Criterio de pronto:
- Ordenacao basica por nome e busca por texto (opcional P1).

## Milestone 5 - Integracao com Parceiros/Marcas (P1)
Objetivo: permitir reaproveitamento da lista existente de parceiros/marcas.

### Tarefa 5.1 - Endpoint de importacao de parceiros para fornecedores
- Tipo: Backend/API
- Prioridade: P1
- Esforco: M
- Dependencias: 3.1
- Entrega:
- POST /api/internal-stock/suppliers/import-from-partners
- Le lista atual de partners e cria suppliers faltantes com source='partner_import'.
- Criterio de pronto:
- Operacao idempotente (rodar duas vezes sem duplicar).

### Tarefa 5.2 - Botao "Importar de Parceiros/Marcas" na tela
- Tipo: Frontend
- Prioridade: P1
- Esforco: P
- Dependencias: 5.1
- Entrega:
- Acao visual na area de fornecedores.
- Feedback de quantos foram importados.
- Criterio de pronto:
- Lista de fornecedores atualiza apos importacao.

## Milestone 6 - Testes e homologacao (P0)
Objetivo: garantir estabilidade e evitar regressao no fluxo atual.

### Tarefa 6.1 - Testes de backend (servicos e rotas)
- Tipo: QA/Backend
- Prioridade: P0
- Esforco: G
- Dependencias: 3.1, 3.2, 3.3
- Entrega:
- Testes para:
  - calculo de preco
  - CRUD de item
  - alteracao global de percentual
  - rollback transacional em falha
- Criterio de pronto:
- Cobertura minima dos casos criticos definida pelo time.

### Tarefa 6.2 - Testes de frontend (fluxo admin)
- Tipo: QA/Frontend
- Prioridade: P1
- Esforco: M
- Dependencias: 4.1 a 4.5
- Entrega:
- Validar:
  - cadastro fornecedor
  - cadastro item
  - listagem com colunas obrigatorias
  - mudanca de percentual com reflexo nos itens
- Criterio de pronto:
- Fluxo principal sem erro em homologacao.

### Tarefa 6.3 - Teste de nao regressao do checkout
- Tipo: QA
- Prioridade: P0
- Esforco: M
- Dependencias: 1.5
- Entrega:
- Rodar cenarios de compra e confirmar decremento de Product.stock como antes.
- Criterio de pronto:
- Nenhuma regressao funcional no estoque atual do site.

## Ordem de execucao recomendada (sequencia)
1. 1.1 -> 1.2 -> 1.3 -> 1.4 -> 1.5
2. 2.1 -> 2.2 -> 2.3 -> 2.4
3. 3.1 -> 3.2 -> 3.3 -> 3.4
4. 4.1 -> 4.2 -> 4.3 -> 4.4 -> 4.5
5. 6.1 -> 6.3 -> 6.2
6. 5.1 -> 5.2

## Sprint sugerida
- Sprint A (2-3 dias): Milestones 1, 2 e 3
- Sprint B (1-2 dias): Milestone 4
- Sprint C (1-2 dias): Milestones 6 e 5

## Definicao de pronto global (DoD)
- Banco com migrations e rollback validos.
- Endpoints protegidos com admin.
- Tela de estoque interno funcional com dados reais.
- Alteracao de percentual global recalcule todos os itens internos.
- Estoque atual do site (Product.stock) sem regressao.
- Logs de auditoria para alteracoes criticas.
- Documentacao minima de uso no README/admin.

## Checklist de homologacao funcional
- [ ] Cadastrar fornecedor manualmente.
- [ ] Cadastrar item interno com fornecedor da lista.
- [ ] Ver item na lista com nome, quantidade, valor unitario, valor site e valor ML.
- [ ] Alterar percentual do site e confirmar atualizacao em todos os itens.
- [ ] Alterar percentual do ML e confirmar atualizacao em todos os itens.
- [ ] Rodar compra normal e validar que checkout continua operando no estoque atual.
