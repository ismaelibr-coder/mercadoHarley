# 🧪 Teste de Rotas - API Mercado Harley (JWT + MySQL)

## Pré-requisitos

```bash
# 1. Copiar .env.example para .env
cp .env.example .env

# 2. Configurar .env com dados locais:
#    DB_HOST=localhost
#    DB_USER=root
#    DB_PASSWORD=
#    JWT_SECRET=seu-secret-local

# 3. Instalar dependências
npm install

# 4. Criar banco MySQL
# mysql -u root
# CREATE DATABASE mercado_harley;

# 5. Iniciar servidor
npm run dev
```

---

## 🔐 Autenticação

### 1. Registrar novo usuário

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123456",
    "name": "Teste User",
    "phone": "11999999999",
    "cpf": "12345678901"
  }'
```

**Resposta (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "uid": "user_1708974234567_abc123def",
    "email": "teste@example.com",
    "name": "Teste User",
    "isAdmin": false
  }
}
```

---

### 2. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@example.com",
    "password": "senha123456"
  }'
```

**Salve o token retornado para usar nas próximas requisições:**

```bash
export TOKEN="seu_token_aqui"
```

---

### 3. Refresh Token

```bash
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "seu_refresh_token_aqui"
  }'
```

---

### 4. Obter perfil do usuário

```bash
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

### 5. Atualizar perfil do usuário

```bash
curl -X PUT http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Novo Nome",
    "phone": "11988888888",
    "address": {
      "street": "Rua Teste",
      "number": "123",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01311100"
    }
  }'
```

---

## 📦 Produtos

### 1. Listar todos os produtos

```bash
curl -X GET http://localhost:3001/api/products
```

---

### 2. Obter produto por ID

```bash
curl -X GET http://localhost:3001/api/products/prod_xxx
```

---

### 3. Criar novo produto (ADMIN ONLY)

```bash
# Primeiro, crie um usuário admin (com isAdmin=true no banco)
curl -X POST http://localhost:3001/api/products \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Capacete Harley",
    "price": 299.90,
    "stock": 10,
    "category": "Capacetes",
    "description": "Capacete premium para motocicletas",
    "weight": 1.5,
    "images": ["https://...", "https://..."],
    "dimensions": {
      "width": 20,
      "height": 30,
      "length": 25,
      "weight": 1.5
    }
  }'
```

---

### 4. Atualizar produto (ADMIN ONLY)

```bash
curl -X PUT http://localhost:3001/api/products/prod_xxx \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 279.90,
    "stock": 8
  }'
```

---

### 5. Deletar produto (ADMIN ONLY)

```bash
curl -X DELETE http://localhost:3001/api/products/prod_xxx \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 📋 Pedidos

### 1. Criar pedido

```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderNumber": "HD-1708974567890-ABC123",
    "items": [
      {
        "id": "prod_xxx",
        "name": "Capacete",
        "price": 299.90,
        "quantity": 1,
        "image": "https://..."
      }
    ],
    "customer": {
      "name": "João Silva",
      "email": "joao@example.com",
      "cpf": "12345678901",
      "phone": "11999999999"
    },
    "shipping": {
      "cep": "01311100",
      "address": "Rua Paulista",
      "number": "1000",
      "neighborhood": "Bela Vista",
      "city": "São Paulo",
      "state": "SP",
      "method": "PAC",
      "price": 25.00
    },
    "total": 324.90,
    "subtotal": 299.90,
    "discount": 0,
    "method": "pix"
  }'
```

---

### 2. Listar todos os pedidos (ADMIN ONLY)

```bash
curl -X GET http://localhost:3001/api/orders \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 3. Obter pedido por ID

```bash
curl -X GET http://localhost:3001/api/orders/ord_xxx \
  -H "Authorization: Bearer $TOKEN"
```

**Nota:** Usuários normais só veem seus próprios pedidos, admins veem todos.

---

### 4. Atualizar status do pedido (ADMIN ONLY)

```bash
curl -X PUT http://localhost:3001/api/orders/ord_xxx/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "paid"
  }'
```

Valores válidos: `pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`

---

## 📊 Analytics (ADMIN ONLY)

### 1. Métricas do dashboard

```bash
curl -X GET http://localhost:3001/api/analytics/metrics \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

### 2. Gráfico de vendas

```bash
curl -X GET "http://localhost:3001/api/analytics/sales-chart?period=day&limit=30" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

---

## 🔧 Dicas para Testes

### Definir variáveis de ambiente no bash

```bash
# Registrar um usuário
RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }')

# Extrair o token (requer jq)
export TOKEN=$(echo $RESPONSE | jq -r '.token')

# Verificar
echo $TOKEN
```

### Usando Postman

1. Crie uma Collection
2. Defina uma variável `{{baseUrl}}` = `http://localhost:3001`
3. Defina uma variável `{{token}}` e configure um script de teste:
   ```javascript
   var jsonData = pm.response.json();
   pm.environment.set("token", jsonData.token);
   ```

---

## ❌ Erros Comuns

| Erro | Causa | Solução |
|------|-------|--------|
| `ECONNREFUSED` | Servidor não está rodando | `npm run dev` |
| `401 Unauthorized` | Token inválido/expirado | Faça login novamente |
| `403 Admin access denied` | Não é admin | Crie user com `isAdmin=true` no banco |
| `404 Product not found` | Produto não existe | Use um ID válido |
| `500 Database error` | Conexão com MySQL falhou | Verifique `.env` e se MySQL está rodando |

---

## 📝 Próximos Passos

1. ✅ Testar todas as rotas acima
2. ⏳ Criar script de migração Firebase → MySQL
3. ⏳ Deploy no Hostinger
