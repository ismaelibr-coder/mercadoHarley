# 📦 Migração Firebase → MySQL - Progresso

## ✅ Concluído

### 1. Análise da Estrutura Firebase
- Identificadas 6 collections principais
- Mapeadas estruturas de dados e relacionamentos

### 2. Schema MySQL Criado (`schema.sql`)
- ✅ `users` - autenticação e perfil
- ✅ `products` - catálogo
- ✅ `orders` - pedidos com relacionamento com usuários
- ✅ `banners` - banners de marketing
- ✅ `shipping_rules` - regras de frete
- ✅ `audit_logs` - logging de ações
- ✅ `sessions` - para refresh tokens

### 3. Sequelize Configurado
- `backend/config/database.js` - conexão MySQL
- Instaladas dependências:
  - `sequelize` v6.35.1
  - `mysql2` v3.6.5
  - `bcrypt` v5.1.0
  - `jsonwebtoken` v9.1.2
  - `uuid` v9.0.1

### 4. Modelos Sequelize Criados
- `backend/models/User.js` - usuários com hashing de senha
- `backend/models/Product.js` - produtos
- `backend/models/Order.js` - pedidos com FK para User
- `backend/models/Banner.js` - banners
- `backend/models/ShippingRule.js` - regras de frete
- `backend/models/AuditLog.js` - auditoria
- `backend/models/index.js` - exportação centralizada

### 5. Autenticação JWT Implementada
- `backend/services/authService.js`:
  - `hashPassword()` - hash bcrypt
  - `comparePassword()` - validação de senha
  - `generateToken()` - JWT access token
  - `generateRefreshToken()` - JWT refresh token
  - `verifyToken()` - validação de token
  - `loginUser()` - login com email/senha
  - `registerUser()` - registro de novo usuário
  - `refreshAccessToken()` - refresh do token

### 6. Middleware de Auth Atualizado
- `backend/middleware/auth.js` substituído:
  - Agora usa JWT em vez de Firebase
  - `authenticate` - middleware obrigatório
  - `optionalAuth` - middleware opcional
  - `verifyAdmin` - verifica se é admin

---

## ⏳ Próximas Etapas

## ⏳ Próximas Etapas

### ✅ Etapa 5: Migrar Serviços Firebase → MySQL - CONCLUÍDO!
Reescrevemos:
1. ✅ `backend/services/databaseService.js` - Operações CRUD com Sequelize
2. ✅ `backend/routes/auth.js` - Register, Login, Refresh com JWT
3. ✅ `backend/routes/products.js` - Atualizado para usar databaseService
4. ✅ `backend/routes/orders.js` - Atualizado para usar databaseService
5. ✅ `backend/routes/analytics.js` - Atualizado para novo middleware
6. ✅ `backend/server.js` - Inicializa Sequelize, sincroniza banco
7. ✅ `.env.example` - Documentação de variáveis de ambiente

### Etapa 6: Testar Todas as Rotas Localmente
Procedimento:
1. Copiar `.env.example` para `.env` e configurar:
   ```bash
   cp .env.example .env
   ```
2. Instalar dependências:
   ```bash
   npm install
   ```
3. Criar banco de dados MySQL local:
   ```sql
   CREATE DATABASE mercado_harley;
   ```
4. Iniciar servidor em modo desenvolvimento:
   ```bash
   npm run dev
   ```
5. Testar rotas (ver curl commands abaixo)

### Etapa 7: Exportar Dados Firebase e Importar no MySQL
(próximo passo)

### Etapa 8: Deploy no Hostinger
(após testar localmente)

---

## ⚙️ Variáveis de Ambiente Necessárias

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=seu_password
DB_NAME=mercado_harley

# JWT
JWT_SECRET=sua-chave-super-secreta-muito-forte
JWT_EXPIRY=7d
REFRESH_TOKEN_EXPIRY=30d

# APIs Externas (mantêm as mesmas)
MERCADOPAGO_ACCESS_TOKEN=...
MELHOR_ENVIO_TOKEN=...
CLOUDINARY_API_KEY=...
```

---

## 📝 Notas Importantes

- **Firebase Admin SDK** pode ser removido quando terminar a migração
- **Firebase Auth** pode ser mantido ou substituído completamente (agora temos JWT)
- Dados externos (Melhor Envio, Mercado Pago) continuam como estão
- Transações MySQL funcionam de forma similar ao Firestore

---

## 🔄 Próximo Passo Recomendado
Reescrever `backend/services/firebaseService.js` para usar Sequelize
