# Análise e Resolução - Problema de Cálculo de Frete

## PROBLEMA DIAGNOSTICADO

**Status:** HTTP 503 Service Unavailable  
**Mensagem:** `"Frete indisponível neste momento. Verifique o CEP ou opte por retirada em loja."`

**Causa Raiz:** ❌ `MELHOR_ENVIO_TOKEN` não está configurado em `backend/.env`

## PAYLOAD TESTADO

```json
{
  "cep": "91540-315",
  "weight": 6.5,
  "dimensions": {
    "width": 11,
    "height": 67,
    "length": 67
  }
}
```

**Análise:**
- CEP: 91540-315 ✅ Válido (Porto Alegre, RS)
- Peso: 6.5 kg ✅ Dentro de limites Correios (máx 30kg)
- Dimensões: 11×67×67 cm ✅ Válido

## FLUXO ATUAL

```
Cliente → POST /api/shipping/calculate
          ↓
Backend → calculateMelhorEnvioShipping()
          ↓
Token undefined?
          ├─ SIM → console.error → return null
          └─ NÃO → axios.post() → Melhor Envio API
                   ├─ Success → return options
                   └─ Error → return null
          ↓
melhorEnvioOptions == null?
          ├─ SIM → HTTP 503 + error message
          └─ NÃO → HTTP 200 + shipping options
```

## POLÍTICA DE FRETE

⚠️ **IMPORTANTE:** Sistema está configurado para **APENAS Melhor Envio**
- ❌ SEM fallback para regras manuais
- ⚠️ SEM retirada em loja como opção dinâmica no checkout
- ✅ Frete online = Melhor Envio obrigatório

## SOLUÇÃO REQUERIDA

### Step 1: Gerar Token no Melhor Envio
1. Acessar: https://melhorenvio.com.br/painel/gerenciar/tokens
2. Fazer login com conta da loja
3. Clicar em "Novo Token"
4. Configurar escopos:
   - ✅ `shipping-calculate` (obrigatório)
   - ✅ `shipping-checkout` (opcional, para etiquetas)
5. Copiar token gerado (formato: `Bearer xxxxx`)

### Step 2: Configurar Token no Servidor
```bash
# SSH para servidor de produção
ssh root@187.77.62.63

# Editar arquivo de ambiente
nano /var/www/mercadoHarley/backend/.env
```

**Adicionar/Atualizar:**
```env
MELHOR_ENVIO_TOKEN=seu_token_aqui_sem_bearer
MELHOR_ENVIO_FROM_CEP=91030170
MELHOR_ENVIO_SANDBOX=false
```

### Step 3: Reiniciar Backend
```bash
cd /var/www/mercadoHarley
pm2 restart mercado-harley-backend

# Verificar logs
pm2 logs mercado-harley-backend --lines 20
```

### Step 4: Testar Novamente
```bash
curl -X POST https://sickgrip.com.br/api/shipping/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "cep":"91540-315",
    "weight":6.5,
    "dimensions":{"width":11,"height":67,"length":67}
  }'

# Esperado: Array com opções de frete
# [
#   { "id": "me_1", "name": "correios SEDEX", "price": 45.50, "deliveryTime": 2 },
#   { "id": "me_2", "name": "correios PAC", "price": 25.00, "deliveryTime": 8 },
#   ...
# ]
```

## ARQUIVO-CHAVE

| Arquivo | Linha | Responsabilidade |
|---------|-------|-----------------|
| `backend/routes/shipping.js` | 25-40 | Rota POST /api/shipping/calculate |
| `backend/services/melhorEnvioService.js` | 11-30 | Validação de token |
| `backend/.env` | - | Variável MELHOR_ENVIO_TOKEN |

## LOGS ESPERADOS (Quando Funcionando)

```
📦 Calculating Melhor Envio shipping: {
  from: 91030170,
  to: 91540315,
  weight: "6.5kg",
  dimensions: "67x11x67cm"
}
✅ Melhor Envio returned 4 services returned
💰 Prices: 
  - Correios SEDEX: R$ 45.50
  - Correios PAC: R$ 25.00
  - Transportadora A: R$ 55.00
  - Transportadora B: R$ 32.00
```

## LOGS DE ERRO (Problemas)

```
❌ MELHOR_ENVIO_TOKEN not configured!
   Action required: Set MELHOR_ENVIO_TOKEN in backend/.env
   Generate token: https://melhorenvio.com.br/painel/gerenciar/tokens
```

## ALTERNATIVAS (Não Implementadas)

Se Melhor Envio não funcionar:
1. **Removido:** Fallback para regras manuais (policy change)
2. **Não implementado:** Retirada em loja como opção checkout
3. **Futuro possível:** Integração com Shopify Shipping

## REFERÊNCIAS

- API Melhor Envio: https://www.melhorenvio.com.br/docs
- Dashboard: https://melhorenvio.com.br/painel
- Suporte: suporte@melhorenvio.com.br

