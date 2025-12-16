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
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// CORS must come BEFORE helmet
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:5173',
        'http://localhost:5175',
        'http://localhost:5174',
        'https://sickgrip.com.br',
        'https://www.sickgrip.com.br',
        'https://mercado-harley.vercel.app' // Vercel preview URL
    ],
    credentials: true
}));

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: false, // Disable to allow CORS
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.mercadopago.com", "https://sdk.mercadopago.com"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP
    message: 'Muitas requisições, tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas de login
    message: 'Muitas tentativas de autenticação, tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}

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
app.use('/api/products', limiter, productsRouter);
app.use('/api/shipping', limiter, shippingRouter);
app.use('/api/upload', limiter, uploadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/orders', limiter, orderRoutes);

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
