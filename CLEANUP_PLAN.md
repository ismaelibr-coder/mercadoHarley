# ��� Plano de Limpeza do Projeto - Mercado Harley

## ⚠️ ATENÇÃO: Serviços Críticos Ainda Usam Firebase

Os seguintes serviços PRECISAM ser refatorados antes de remover Firebase:
- `backend/services/bannerService.js` - usa Firestore
- `backend/services/analyticsService.js` - usa Firestore  
- `backend/services/shippingService.js` - usa Firestore

---

## FASE 1: Arquivos Seguros para Deletar AGORA ✅

### Backend Root (scripts temporários/debug):
- [ ] `add-clothing-direct.js`
- [ ] `add-clothing.js`
- [ ] `check-order-shipping.js`
- [ ] `check-token.js`
- [ ] `check-user.js` (usa Firebase)
- [ ] `create-admin.js` (usa Firebase, já executado)
- [ ] `debug-orders.js`
- [ ] `delete-user.js` (usa Firebase)
- [ ] `export-firebase.js` (migração feita)
- [ ] `fix-order-status.js`
- [ ] `fix-payment-status-simple.js`
- [ ] `fix-tracking-and-payment.js`
- [ ] `get-product.js` (usa Firebase)
- [ ] `import-firebase.js` (migração feita)
- [ ] `inspect-response.js`
- [ ] `list-products.js` (usa Firebase)
- [ ] `repro-crash.js`
- [ ] `seed-shipping-rules.js` (usa Firebase)
- [ ] `seedData.js` (usa Firebase)
- [ ] `set-admin-ismael.js` (usa Firebase)
- [ ] `set-admin.js` (usa Firebase)
- [ ] `test-complete-order.js`
- [ ] `test-email.js`
- [ ] `test-endpoints.js`
- [ ] `test-melhor-envio.js`
- [ ] `test-order.js`
- [ ] `test-payment.js`
- [ ] `test-shipping.js`
- [ ] `test-status-direct.js` (usa Firebase)
- [ ] `test-status-update.js`
- [ ] `test-token.js`
- [ ] `update-all-tracking.js`
- [ ] `update-images.js` (usa Firebase)
- [ ] `update-tracking-code.js`
- [ ] `verify-order.js`
- [ ] `create-db-and-import.js` (migração feita)
- [ ] `create-pavilhao-user.js` (já executado)
- [ ] `create-pavilhao-users.js` (já executado)
- [ ] `ecosystem.config.cjs` (já arquivado)

### Backend Scripts (maioria temporários):
- [ ] `backend/scripts/create-admins.js` (usa Firebase)
- [ ] `backend/scripts/create-long-name-user.js`
- [ ] `backend/scripts/create-test-orders.js`
- [ ] `backend/scripts/delete-invalid-orders.js`
- [ ] `backend/scripts/test-banners.js`

### Pastas inteiras:
- [ ] `archive/` - já está no Git, não precisa mais no workspace
- [ ] `backend/firebase-export/` - dados já migrados

### Arquivos sensíveis (desindexados, mas ainda presentes):
- [ ] `backend/firebase-service-account.json` - credencial exposta

**Total: ~45 arquivos/pastas**

---

## FASE 2: Após Refatorar Serviços ⏳

### Deletar após migrar serviços:
- [ ] `backend/services/firebaseService.js`
- [ ] `backend/services/databaseService.js` (verificar se duplica dbService.js)
- [ ] Remover `firebase-admin` do `package.json`
- [ ] Atualizar imports nos serviços restantes

### Scripts que podem ser úteis (MANTER):
- ✅ `backend/smoke-tests.sh`
- ✅ `backend/scripts/backup-mysql.sh`
- ✅ `backend/scripts/create-admin-user.js`
- ✅ `backend/scripts/create-admins-mysql.js`
- ✅ `backend/scripts/create-shipping-rule.js`
- ✅ `backend/scripts/force-reset-passwords-mysql.js`
- ✅ `backend/scripts/migrate-banner-schema.js`
- ✅ `backend/scripts/reset-admin-user.js`
- ✅ `backend/scripts/seed-banners.js`
- ✅ `backend/scripts/check-orders.js`
- ✅ `backend/scripts/add-stock-to-products.js`

---

## Estimativa de Espaço Liberado

- Scripts temporários: ~1-2 MB
- firebase-export/: ~500 KB - 2 MB
- archive/: ~100-500 KB
- node_modules duplicados: (se houver)

**Total estimado: 2-5 MB** (pode ser mais se node_modules tiver duplicatas)

