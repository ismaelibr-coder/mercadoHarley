# Implementação: Usuário Pavilhão para Controle de Estoque

## 📋 Resumo
Implementação de um sistema de usuário "Pavilhão" que funciona como ponto de venda integrado ao e-commerce. Este usuário permite que a loja física controle o estoque centralizado do site quando vende produtos no balcão físico.

---

## ✅ Alterações Realizadas

### 1️⃣ **Banco de Dados (schema.sql)**

#### Tabela `users` - Adicionado campo `userType`:
```sql
userType VARCHAR(50) DEFAULT 'customer' COMMENT 'Type: customer, pavilhao, admin'
INDEX idx_userType (userType)
```

**Tipos de usuário:**
- `customer` - Cliente normal (padrão)
- `pavilhao` - Usuário para controle de estoque da loja física
- `admin` - Administrador do sistema

#### Tabela `orders` - Adicionados campos:
```sql
sellerName VARCHAR(255) COMMENT 'Nome do vendedor (para vendas pavilhão)'
orderType VARCHAR(50) DEFAULT 'online' COMMENT 'Type: online, pavilhao'
INDEX idx_orderType (orderType)
```

---

### 2️⃣ **Modelos Sequelize**

#### [User.js](backend/models/User.js)
```javascript
userType: {
    type: DataTypes.STRING(50),
    defaultValue: 'customer',
    validate: {
        isIn: [['customer', 'pavilhao', 'admin']]
    }
}
```

#### [Order.js](backend/models/Order.js)
```javascript
sellerName: {
    type: DataTypes.STRING(255),
    allowNull: true
},
orderType: {
    type: DataTypes.STRING(50),
    defaultValue: 'online',
    validate: {
        isIn: [['online', 'pavilhao']]
    }
}
```

---

### 3️⃣ **Lógica de Desconto Automático**

#### [databaseService.js](backend/services/databaseService.js) - Função `createOrder`

Quando um usuário do tipo `pavilhao` cria um pedido:
- ✅ Aplica desconto de **100%** no subtotal + frete
- ✅ Define total do pedido como **R$ 0,00**
- ✅ Força método de frete como **"withdrawal"** (retirada)
- ✅ Define frete como **grátis**
- ✅ Registra pedido com `orderType: 'pavilhao'`

---

### 4️⃣ **Validação no Checkout**

#### [orders.js - Rota POST /api/orders](backend/routes/orders.js)

Adicionada validação obrigatória:
- Se usuário é `pavilhao`, o campo `sellerName` (nome do vendedor) **é obrigatório**
- Retorna erro 400 se `sellerName` estiver vazio

```javascript
if (user && user.userType === 'pavilhao') {
    if (!orderData.sellerName || orderData.sellerName.trim() === '') {
        return res.status(400).json({
            error: 'Campo "Nome do Vendedor" é obrigatório para vendas no pavilhão'
        });
    }
}
```

---

### 5️⃣ **Script de Criação do Usuário**

#### [create-pavilhao-user.js](backend/create-pavilhao-user.js)

Novo script para criar o usuário pavilhão:

```bash
npm run create:pavilhao
# ou
node backend/create-pavilhao-user.js
```

**Credenciais criadas:**
- 📧 Email: `pavilhao@sickgrip.com.br`
- 🔐 Senha: `Pavilhao@59`
- 👤 Nome: `Pavilhão Sickgrip`
- 🏷️ Tipo: `pavilhao`

---

### 6️⃣ **Relatório Pavilhão vs Online**

#### [analyticsService.js](backend/services/analyticsService.js) - Nova função

```javascript
getSalesReportPavilhaoVsOnline(startDate, endDate)
```

#### [analytics.js - Rota GET /api/analytics/pavilhao-report](backend/routes/analytics.js)

```
GET /api/analytics/pavilhao-report?startDate=2024-01-01&endDate=2024-01-31
```

**Resposta do relatório:**
```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-01-31"
    },
    "pavilhao": {
      "totalOrders": 45,
      "totalSubtotal": 5000.00,
      "totalDiscount": 5000.00,
      "totalRevenue": 0.00,
      "averageOrderValue": 0.00
    },
    "online": {
      "totalOrders": 120,
      "totalSubtotal": 15000.00,
      "totalDiscount": 500.00,
      "totalRevenue": 14500.00,
      "averageOrderValue": 120.83
    },
    "comparison": {
      "pavilhaoPercentage": 27.27,
      "onlinePercentage": 72.73
    },
    "sellerBreakdown": [
      {
        "seller": "João Silva",
        "totalOrders": 25,
        "totalSubtotal": 2500.00,
        "totalDiscount": 2500.00,
        "totalRevenue": 0.00,
        "averageOrderValue": 0.00
      }
    ]
  }
}
```

---

## 🚀 Como Usar

### 1. Criar o usuário Pavilhão
```bash
cd backend
node create-pavilhao-user.js
```

### 2. Login Como Pavilhão
```javascript
// Frontend - Login
const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
        email: 'pavilhao@sickgrip.com.br',
        password: 'Pavilhao@59'
    })
});
```

### 3. Fazer "Compra" (Dar Baixa no Estoque)
```javascript
// Frontend - Create Order
const response = await fetch('/api/orders', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        items: [
            { id: 'prod_123', name: 'Pneu X', quantity: 2, price: 250.00 }
        ],
        customer: { name: 'Pavilhão', email: 'pavilhao@sickgrip.com.br' },
        shipping: { method: 'withdrawal', cost: 0 },
        subtotal: 500.00,
        sellerName: 'João Silva'  // ← OBRIGATÓRIO
    })
});
```

### 4. Gerar Relatório
```bash
# Admin apenas
GET /api/analytics/pavilhao-report?startDate=2024-01-01&endDate=2024-01-31
```

---

## 📊 Fluxo de Funcionamento

```
┌─────────────────────────────────────────────────────────┐
│  LOJA FÍSICA - Venda de Pneu                            │
├─────────────────────────────────────────────────────────┤
│  1. Cliente compra pneu no balcão                        │
│  2. Vendedor (ex: João) anota a venda                    │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  SITE - Dar Baixa no Estoque                            │
├─────────────────────────────────────────────────────────┤
│  1. Login com: pavilhao@sickgrip.com.br / Pavilhao@59   │
│  2. "Compra" o pneu com nome do vendedor: "João Silva"  │
│  3. Clica em "Retirada" (única opção)                   │
│  4. Confirma compra (tudo grátis/zerado)                │
│  5. Estoque é automaticamente decrementado no banco      │
└─────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────┐
│  RELATÓRIO - Análise de Vendas                          │
├─────────────────────────────────────────────────────────┤
│  1. Admin acessa: /api/analytics/pavilhao-report        │
│  2. Vê comparação: Pavilhão vs Online                   │
│  3. Vê detalhamento por vendedor                        │
│  4. Monitora estoque real da loja                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Segurança

- ✅ Usuário pavilhão requer autenticação (login)
- ✅ Campo "Nome do Vendedor" obrigatório para auditoria
- ✅ Todas as operações registradas em audit_logs
- ✅ Acesso ao relatório restrito a admins
- ✅ Frete forçado como retirada (sem risco de endereço errado)

---

## 📝 Próximos Passos (Opcional)

### Implementações futuras:
1. **Auditoria Detalhada** - Log completo de quem fez o que
2. **Notificações de Estoque** - Avisar quando produto está acabando
3. **Dashboard Pavilhão** - Interface específica para vendedor
4. **Integração com PDV** - Conectar com caixa registradora física
5. **Sincronização em Tempo Real** - Estoque atualizado instantaneamente

---

## 📞 Suporte

Para dúvidas sobre a implementação, consulte:
- Schema: [schema.sql](schema.sql)
- Modelos: [backend/models/](backend/models/)
- Serviços: [backend/services/](backend/services/)
- Rotas: [backend/routes/](backend/routes/)
