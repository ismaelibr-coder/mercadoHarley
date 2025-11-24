import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeFirebase } from './services/firebaseService.js';
import { errorHandler } from './middleware/errorHandler.js';
import paymentsRouter from './routes/payments.js';
import webhooksRouter from './routes/webhooks.js';
import productsRouter from './routes/products.js';
import shippingRouter from './routes/shipping.js';
import uploadRoutes from './routes/upload.js';
import analyticsRoutes from './routes/analytics.js';
import bannerRoutes from './routes/banner.js';
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5175', 'http://localhost:5174'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Firebase
try {
    initializeFirebase();
} catch (error) {
    console.error('Failed to initialize Firebase:', error);
    process.exit(1);
}

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Mercado Harley Backend API',
        version: '1.0.0',
        status: 'running'
    });
});

app.use('/api/payments', paymentsRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/products', productsRouter);
app.use('/api/shipping', shippingRouter);
app.use('/api/upload', uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════╗
║   🏍️  Mercado Harley Backend API    ║
║                                       ║
║   Server running on port ${PORT}       ║
║   Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
║                                       ║
║   Ready to process payments! 💰       ║
╚═══════════════════════════════════════╝
    `);
});

export default app;
