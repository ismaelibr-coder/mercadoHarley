import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { testDatabaseConnection, syncDatabase } from './config/database.js';
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
import cleanupRoutes from './routes/cleanup.js';
import shippingLabelsRouter from './routes/shippingLabels.js';
import settingsRouter from './routes/settings.js';
import internalStockRouter from './routes/internalStock.js';
import reviewsRouter from './routes/reviews.js';
import customerGalleryRouter from './routes/customerGallery.js';
import testimonialsRouter from './routes/testimonials.js';
import videoSettingsRouter from './routes/videoSettings.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Refuse to boot with missing critical config — running with an unset JWT_SECRET
// (falling back to a hardcoded value) or without DB credentials is unsafe/broken,
// and failing loudly here beats failing silently/insecurely later.
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
if (missingEnvVars.length > 0) {
    logger.error(`❌ Variáveis de ambiente obrigatórias ausentes: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - Required for Render deployment
app.set('trust proxy', 1);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', uptime: process.uptime() });
});

// CORS — restricted to known frontend origins (FRONTEND_URL, plus any extra
// origins in CORS_ORIGINS as a comma-separated list). Requests with no Origin
// header (server-to-server, curl, the Mercado Pago webhook) are still allowed.
const allowedOrigins = (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error(`Origin não permitida pelo CORS: ${origin}`));
    },
    credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable pre-flight for all routes

// Security headers (CSP allows the Mercado Pago SDK, which the checkout loads client-side)
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // uploaded images are fetched from other origins
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "https://sdk.mercadopago.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.mercadopago.com", "https://sdk.mercadopago.com"],
        },
    },
}));

// Rate limiting — the production limits (100 req/15min general, 20/15min for
// payments) are tuned for real traffic, not for an active local dev session
// where a single browser tab reloading the homepage fires a dozen requests
// (products, category counts, 5 banner placements, reviews...) and gets
// exhausted within minutes of normal testing. Much looser in development so a
// local preview session doesn't start silently failing (every fetch that hits
// 429 fails safe to "empty" in the UI — search returns 0, category cards
// disappear, etc. — which looks exactly like a bug but is just this).
const isDev = process.env.NODE_ENV === 'development';

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: isDev ? 2000 : 100,
    message: 'Muitas requisições, tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Stricter limit for payment creation — this is the endpoint most attractive to
// card-testing / order-spam abuse (see also the per-order stock check in dbService).
const paymentsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 500 : 20,
    message: 'Muitas tentativas de pagamento, tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads (local file storage)
let uploadsDir = process.env.UPLOADS_DIR;

if (!uploadsDir) {
    const countFiles = (dirPath) => {
        try {
            if (!fs.existsSync(dirPath)) return -1;
            return fs.readdirSync(dirPath).length;
        } catch (error) {
            return -1;
        }
    };

    const possiblePaths = [
        '/var/www/mercadoHarley/repo/uploads',
        '/var/www/mercadoHarley/uploads',
        path.resolve(process.cwd(), '../uploads'),
        path.resolve(process.cwd(), './uploads')
    ];

    const existingPaths = possiblePaths
        .filter(candidate => fs.existsSync(candidate))
        .sort((a, b) => countFiles(b) - countFiles(a));

    if (existingPaths.length > 0) {
        uploadsDir = existingPaths[0];
        logger.info(`✅ Found uploads directory: ${uploadsDir}`);
    }
}

if (!uploadsDir) {
    uploadsDir = path.resolve(process.cwd(), '../uploads');
}

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

logger.info(`📁 Serving uploads from: ${uploadsDir}`);
app.use('/api/uploads', express.static(uploadsDir));
// Also try /uploads in case nginx allows it
app.use('/uploads', express.static(uploadsDir));

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

// Initialize Database
async function initializeDatabase() {
    try {
        logger.info('🔄 Testing database connection...');
        await testDatabaseConnection();
        
        logger.info('🔄 Syncing database schema...');
        await syncDatabase({ alter: process.env.NODE_ENV === 'development' });
        
        logger.info('✅ Database initialized successfully');
        return true;
    } catch (error) {
        logger.error('❌ Failed to initialize database:', error);
        process.exit(1);
    }
}

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Sick Grip Backend API',
        version: '1.0.0',
        status: 'running'
    });
});

// CORS test endpoint
app.get('/test-cors', (req, res) => {
    res.json({
        success: true,
        message: 'CORS is working!',
        origin: req.headers.origin,
        timestamp: new Date().toISOString()
    });
});

app.use('/api/payments', paymentsLimiter, paymentsRouter);
app.use('/api/webhooks', limiter, webhooksRouter);
app.use('/api/products', limiter, productsRouter);
app.use('/api/shipping', limiter, shippingRouter);
app.use('/api/upload', limiter, uploadRoutes);
app.use('/api/analytics', limiter, analyticsRoutes);
app.use('/api/banners', limiter, bannerRoutes);
app.use('/api/auth', limiter, authRoutes);
app.use('/api/orders', limiter, orderRoutes);
app.use('/api/shipping-labels', limiter, shippingLabelsRouter);
app.use('/api/settings', limiter, settingsRouter);
app.use('/api/internal-stock', limiter, internalStockRouter);
app.use('/api/customer-gallery', limiter, customerGalleryRouter);
app.use('/api/testimonials', limiter, testimonialsRouter);
app.use('/api/video-settings', limiter, videoSettingsRouter);
app.use('/api/admin', limiter, cleanupRoutes); // Admin cleanup routes — includes a destructive DELETE, must be rate limited too
// reviews.js defines its own full paths (/products/:id/reviews, /reviews), so it
// mounts at the bare /api prefix rather than a single fixed sub-path.
app.use('/api', limiter, reviewsRouter);


// Error handling
app.use(errorHandler);

// Start server
async function startServer() {
    try {
        // Initialize database first
        await initializeDatabase();
        
        app.listen(PORT, () => {
            logger.info(`
╔═══════════════════════════════════════╗
║   🏍️  Sick Grip Backend API             ║
║                                       ║
║   Server running on port ${PORT}       ║
║   Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
║   Database: MySQL (${process.env.DB_HOST || 'localhost'})       ║
║                                       ║
║   Ready to process payments! 💰       ║
╚═══════════════════════════════════════╝
            `);
        });
    } catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

export default app;
