# mercado-harley (Sick Grip)

E-commerce de peças e acessórios, com pagamento via Mercado Pago (PIX, boleto e
cartão de crédito) e cálculo de frete via Melhor Envio.

## Stack

- **Frontend**: React 19 + Vite 7, React Router 7, Tailwind CSS — `src/`
- **Backend**: Node.js + Express (ESM) + Sequelize/MySQL — `backend/`
- **Pagamentos**: SDK Mercado Pago (PIX, boleto, cartão + parcelamento)
- **Frete**: Melhor Envio
- **E-mail**: Resend
- **Upload de imagens**: armazenamento local em disco (`backend/uploads` — não há integração com Cloudinary apesar do nome de algumas variáveis legadas)

## Setup

### Backend

```bash
cd backend
cp .env.example .env   # preencha com credenciais reais — o servidor recusa subir sem DB_* e JWT_SECRET
npm install
npm run dev             # http://localhost:3001
```

### Frontend

```bash
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

Para testar pagamentos sem chamar o Mercado Pago de verdade, defina `MOCK_PAYMENTS=true`
no `.env` do backend.

## Testes

```bash
cd backend
npm test
```

A suíte cobre hoje o recálculo de preço no servidor (proteção contra manipulação
de valores no checkout) e a validação de assinatura do webhook do Mercado Pago —
os dois pontos de maior risco financeiro do sistema. CI roda essa suíte, além de
lint e build do frontend, em cada push/PR (`.github/workflows/ci.yml`).

## Estrutura

```
mercado-harley/
├── src/                 # Frontend React
│   ├── pages/            # Páginas públicas + pages/admin/
│   ├── components/       # Componentes compartilhados
│   ├── context/           # AuthContext, CartContext
│   └── services/          # Clientes de API do frontend
├── backend/
│   ├── server.js
│   ├── models/            # Models Sequelize
│   ├── routes/            # Rotas Express
│   ├── services/          # Regras de negócio
│   ├── middleware/        # auth, validação (Joi), rate limiting, audit log
│   └── scripts/           # Scripts administrativos (backup, criação de admin, etc.)
├── schema.sql             # DDL de referência (a fonte real em dev é o sync do Sequelize)
└── docs/                   # Relatórios e planos de features passadas
```

## Documentação adicional

Relatórios e planos de features/migrações anteriores estão em [`docs/`](docs/).
