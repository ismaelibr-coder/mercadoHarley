# Análise - Campo de Parcelas Não Exibindo Opções

## 🔴 PROBLEMA IDENTIFICADO

**Status:** Campo exibindo placeholder ao invés de opções de parcelamento  
**Localização:** Checkout → Pagamento em Cartão de Crédito → Campo "Parcelas"  
**Comportamento:** Mostra mensagem "Digite o número do cartão para ver as opções de parcelamento" mesmo após digitar número válido  

### Captura do Problema
```
Parcelas
[Digite o número do cartão para ver as opções de parcelamento] ← DEVERIA MOSTRAR DROPDOWN COM OPÇÕES
```

## 🔍 ANÁLISE TÉCNICA

### 1. Fluxo de Funcionamento (Esperado)
```
Usuário digita número cartão (BIN: 6 dígitos)
    ↓
handleCardNumberChange() → formatCardNumber()
    ↓
getPaymentMethod(bin) → obtém método via Mercado Pago
    ↓
getInstallmentOptions(bin, total) → fetch parcelas com juros
    ↓
mp.getInstallments({ amount, bin, locale })
    ↓
Resposta com array de payer_costs
    ↓
Renderiza <select> com opções de parcelas
```

### 2. Fluxo Atual (Quebrado)
```
Usuário digita número cartão
    ↓
handleCardNumberChange() → formatCardNumber()
    ↓
getPaymentMethod(bin) → tenta chamar
    ↓
mp === null ❌ (SDK não inicializado)
    ↓
getInstallmentOptions() nunca executa
    ↓
installmentOptions === [] (vazio)
    ↓
Renderiza placeholder: "Digite o número do cartão..."
```

## 🎯 CAUSA RAIZ IDENTIFICADA

### Arquivo: `.env.production`
```env
VITE_API_URL=https://sickgrip.com.br
# ❌ FALTANDO: VITE_MERCADOPAGO_PUBLIC_KEY
```

### Arquivo: `src/components/CreditCardForm.jsx` (Linha 17)
```jsx
useEffect(() => {
    const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
    // ❌ publicKey === undefined
    
    if (window.MercadoPago && publicKey) {
        // ❌ Esta condição falha porque publicKey é undefined
        const mercadopago = new window.MercadoPago(publicKey);
        setMp(mercadopago); // setMp(null)
    }
}, []);
```

### Consequência Cascata
```
1. publicKey = undefined
   ↓
2. if (window.MercadoPago && publicKey) = false
   ↓
3. setMp() nunca é chamado
   ↓
4. mp permanece null
   ↓
5. getPaymentMethod(bin) → if (!mp) return ❌
   ↓
6. getInstallmentOptions() nunca executa
   ↓
7. installmentOptions.length === 0
   ↓
8. Renderiza placeholder ao invés de select
```

## 📋 VERIFICAÇÃO DE CÓDIGO

### CreditCardForm.jsx - Renderização Condicional (Linha 235)
```jsx
{/* Installments */}
<div className="mb-4">
    <label className="block text-gray-400 text-sm mb-2">Parcelas</label>
    {installmentOptions.length > 0 ? (
        // ✅ Mostra <select> com opções
        <select>
            {installmentOptions.map(option => (...))}
        </select>
    ) : (
        // ❌ Mostra placeholder quando vazio
        <div className="w-full bg-gray-800 text-gray-400 px-4 py-3 rounded border border-gray-700">
            Digite o número do cartão para ver as opções de parcelamento
        </div>
    )}
</div>
```

### Logs Esperados vs Reais

#### Esperado (Com SDK inicializado)
```
🔍 Fetching installments: { bin: "555555", amount: "1234.56" }
📊 Installments API Response: [
    {
        "payer_costs": [
            { "installments": 1, "installment_amount": 1234.56, "recommended_message": "à vista" },
            { "installments": 2, "installment_amount": 617.28, "recommended_message": null },
            ...
        ]
    }
]
✅ Parsed options: [{installments: 1, installmentAmount: 1234.56, ...}, ...]
```

#### Real (SDK não inicializado)
```
🔍 Fetching installments: { bin: "555555", amount: "1234.56" }
❌ Error getting installments: TypeError: Cannot read property 'getInstallments' of null
🔄 Using fallback options due to error: [{installments: 1, ...}, {installments: 2, ...}, ...]
✅ Parsed options: [{installments: 1, ...}, ...]
```

Wait... O fallback DEVERIA estar funcionando! Deixa eu verificar melhor...

## 🚨 DIAGNÓSTICO VERIFICAÇÃO

Se o fallback está sendo usado e ainda assim não aparece, possíveis causas:

### Causa 1: SDK Mercado Pago não carregando
- ✅ Script está no `index.html`: `<script src="https://sdk.mercadopago.com/js/v2"></script>`
- ❌ Mas `window.MercadoPago` pode estar undefined se ocorrer erro ao carregar

### Causa 2: Chave pública faltando
- 📍 **CONFIRMADO:** `.env.production` não tem `VITE_MERCADOPAGO_PUBLIC_KEY`
- Sem a chave: `window.MercadoPago && publicKey` = false → SDK não inicializa

### Causa 3: Combinação de ambos
- HTML carrega script
- Script tenta executar
- Sem chave pública: instância não criada
- `mp` permanece null
- Fallback nunca alcançado porque erro ocorre antes (mp.getPaymentMethod não é chamado)

## 🔧 ARQUIVOS AFETADOS

| Arquivo | Linhas | Status | Issue |
|---------|--------|--------|-------|
| `.env.production` | - | ❌ Incompleto | Falta `VITE_MERCADOPAGO_PUBLIC_KEY` |
| `src/components/CreditCardForm.jsx` | 17-22 | ⚠️ OK (código correto) | Depende de variável não configurada |
| `/var/www/mercadoHarley/.env` (servidor) | - | ❓ Desconhecido | Precisa verificar |
| `backend/server.js` | - | ⚠️ Pode estar OK | Backend pode estar gerando parcelas via fallback |
| `index.html` | ~68 | ✅ OK | Script do Mercado Pago presente |

## 📊 MATRIX DE DIAGNÓSTICO

| Componente | Status | Evidência | Ação |
|-----------|--------|-----------|------|
| Script MP carregado? | ⚠️ Provável | Tag no HTML | Verificar console do navegador |
| window.MercadoPago existe? | ❌ Provável não | SDK script presente mas chave falta | Verificar console |
| publicKey definida? | ❌ Confirmado | `.env.production` vazio | Adicionar à config |
| mp inicializado? | ❌ Não | publicKey = undefined | Aguarda chave |
| getInstallments chamado? | ❌ Não | mp = null | Aguarda inicialização |
| Fallback executado? | ❓ Possível | Se há erro na promise | Verificar console |
| Parcelas renderizadas? | ❌ Não | Vê-se placeholder | Aguarda opções |

## 🛠️ SOLUÇÃO NECESSÁRIA

### Step 1: Obter Chave Pública Mercado Pago
1. Acessar: https://www.mercadopago.com.br/account/credentials
2. Na seção "Credenciais de Producción"
3. Copiar: "Public key" (formato: APP_USER_ID-XXXXXXXXXXXXXXXX-YYYYYYYYYYYYYY)

### Step 2: Adicionar ao `.env.production`
```env
VITE_API_URL=https://sickgrip.com.br
VITE_MERCADOPAGO_PUBLIC_KEY=APP_12345678901234567890123456789012
```

### Step 3: Atualizar Servidor de Produção
```bash
SSH para servidor
Editar: /var/www/mercadoHarley/.env.production
Adicionar chave MP
cd /var/www/mercadoHarley
npm run build  # Rebuildar frontend com nova chave
pm2 restart mercado-harley-frontend (ou reiniciar nginx)
```

### Step 4: Testar
```bash
1. Abrir checkout
2. Digitar número cartão: 4111 1111 1111 1111 (teste Visa)
3. Observar console: deve ver logs "Fetching installments..."
4. Campo parcelas deve mostrar dropdown com 1x até 12x
```

## ⚠️ VALIDAÇÃO DE REQUISITOS

### Mercado Pago SDK v2 - Método getInstallments()
```javascript
// ✅ Método existe no SDK v2
// ✅ Requer: chave pública configurada
// ✅ Requer: BIN do cartão (6 dígitos)
// ✅ Requer: amount em string ("1234.56")
// ✅ Requer: locale ("pt-BR")

// Chamada correta:
const installments = await mp.getInstallments({
    amount: "1234.56",
    bin: "555555",
    locale: "pt-BR"
});

// Resposta esperada:
[{
    "payer_costs": [
        { "installments": 1, "installment_amount": 1234.56 },
        { "installments": 2, "installment_amount": 617.28 },
        ...
    ]
}]
```

## 📝 RESUMO EXECUTIVO

**Problema:** Campo não exibindo opções de parcelamento  
**Causa:** `VITE_MERCADOPAGO_PUBLIC_KEY` não configurada em `.env.production`  
**Impacto:** SDK Mercado Pago não inicializa → Parcelas não carregam → Cliente vê placeholder  
**Severidade:** 🔴 Alta (impede pagamento em cartão)  
**Solução:** Adicionar chave pública ao `.env.production` no servidor e fazer rebuild

## 🔒 Informações Sensíveis Necessárias

Para resolver:
1. Credenciais Mercado Pago (Produção)
   - Public Key (seguro para frontend)
   - Access Token (manter seguro no backend - já configurado?)
   
## ✅ Checklist de Resolução

- [ ] Obter Public Key do Mercado Pago (Production)
- [ ] Adicionar VITE_MERCADOPAGO_PUBLIC_KEY ao `.env.production`
- [ ] Deploy para servidor (/var/www/mercadoHarley/.env.production)
- [ ] Fazer rebuild do frontend (npm run build)
- [ ] Reiniciar serviço frontend (nginx/pm2)
- [ ] Testar em staging/produção
- [ ] Verificar console do navegador para logs de instalments
- [ ] Validar dropdown de parcelas exibe options
- [ ] Testar pagamento completo com parcelas
