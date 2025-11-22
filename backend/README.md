# Mercado Harley Backend API

Backend server for Mercado Harley e-commerce with real Mercado Pago payment integration.

## 🚀 Features

- ✅ Real Mercado Pago payment processing (PIX, Boleto, Credit Card)
- ✅ Webhook handling for automatic order status updates
- ✅ Firebase integration for order management
- ✅ User authentication with Firebase Auth
- ✅ CORS configured for frontend
- ✅ Error handling middleware

## 📋 Prerequisites

- Node.js 18+ installed
- Firebase project with Firestore
- Mercado Pago account with API credentials

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file as `firebase-service-account.json` in the `backend` folder

### 3. Configure Environment Variables

The `.env` file is already configured with your Mercado Pago credentials. Make sure it contains:

```env
PORT=3001
MP_ACCESS_TOKEN=your_access_token_here
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
FRONTEND_URL=http://localhost:5173
```

### 4. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`

## 📡 API Endpoints

### Payments

- `POST /api/payments/pix` - Create PIX payment
- `POST /api/payments/boleto` - Create Boleto payment
- `POST /api/payments/credit-card` - Process credit card payment
- `GET /api/payments/:id/status` - Check payment status

### Webhooks

- `POST /api/webhooks/mercadopago` - Receive Mercado Pago notifications

## 🧪 Testing

### Test PIX Payment

```bash
curl -X POST http://localhost:3001/api/payments/pix \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {
      "name": "João Silva",
      "email": "joao@example.com",
      "cpf": "12345678900"
    },
    "total": 100.00,
    "items": []
  }'
```

## 🔒 Security

- Access Token is stored securely in backend `.env`
- Firebase Admin SDK credentials are not exposed to frontend
- CORS configured for specific frontend domain
- User authentication required for protected endpoints

## 📝 Production Deployment

For production deployment:

1. Set environment variables in your hosting platform
2. Use production Mercado Pago credentials
3. Configure production CORS origin
4. Enable HTTPS
5. Set up proper logging and monitoring

### Recommended Platforms

- **Railway** - Easy deployment with automatic HTTPS
- **Heroku** - Classic PaaS with good documentation
- **Vercel** - Serverless functions (requires adaptation)
- **Google Cloud Run** - Containerized deployment

## 🐛 Troubleshooting

### Firebase Error

If you see "Firebase not initialized":
- Make sure `firebase-service-account.json` exists
- Check the path in `.env` is correct
- Verify the JSON file is valid

### Mercado Pago Error

If payments fail:
- Verify your Access Token is correct
- Check if you're using test or production credentials
- Make sure your Mercado Pago account is active

### CORS Error

If frontend can't connect:
- Verify `FRONTEND_URL` in `.env` matches your frontend URL
- Check if backend server is running
- Ensure ports are not blocked by firewall

## 📚 Documentation

- [Mercado Pago API Docs](https://www.mercadopago.com.br/developers/pt/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

## 🎯 Next Steps

- [ ] Add order management endpoints
- [ ] Implement admin authentication
- [ ] Add rate limiting
- [ ] Set up logging service
- [ ] Add unit tests
- [ ] Configure CI/CD pipeline
