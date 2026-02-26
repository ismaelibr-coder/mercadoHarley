# 📋 Plano de Migração Firebase → MySQL (Hostinger)

## Contexto
Migração completa do projeto Mercado Harley de **Firebase** para **MySQL** no Hostinger Business.

---

## Collections Firebase → Tabelas MySQL

### 1. **users** → `users`
```sql
id (UUID) | email | password (hashed) | name | phone | cpf | 
address (JSON) | isAdmin | createdAt | updatedAt
```

### 2. **products** → `products`
```sql
id | name | price | stock | images (JSON) | 
dimensions (JSON) | weight | description | category | 
createdAt | updatedAt
```

### 3. **orders** → `orders`
```sql
id | orderNumber | userId | items (JSON) | 
customer (JSON) | shipping (JSON) | payment (JSON) | 
total | subtotal | discount | status | method |
createdAt | updatedAt | paidAt | shippedAt | deliveredAt
```

### 4. **banners** → `banners`
```sql
id | title | subtitle | image | link | 
active | displayOrder | createdAt | updatedAt
```

### 5. **shippingRules** → `shipping_rules`
```sql
id | name | states (JSON) | minWeight | maxWeight | 
price | deliveryDays | createdAt | updatedAt
```

### 6. **audit_logs** → `audit_logs`
```sql
id | userId | action | resource | resourceId | 
changes (JSON) | timestamp
```

---

## Etapas de Migração

### ✅ Etapa 1: Schema MySQL criado
### ⏳ Etapa 2: Instalar Sequelize + drivers MySQL
### ⏳ Etapa 3: Criar modelos Sequelize
### ⏳ Etapa 4: Adaptar autenticação (JWT)
### ⏳ Etapa 5: Migrar serviços Firebase → MySQL
### ⏳ Etapa 6: Testar localmente
### ⏳ Etapa 7: Exportar dados + importar
### ⏳ Etapa 8: Deploy Hostinger

---

## Notas Importantes
- Firebase Auth pode ser mantido OU migrado para JWT + MySQL
- Alguns dados (Melhor Envio, Mercado Pago) continuam externos
- Transações MySQL funcionam diferente do Firestore
