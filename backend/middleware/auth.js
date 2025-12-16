import { verifyToken } from '../services/firebaseService.js';

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyToken(token);

        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split('Bearer ')[1];
            const decodedToken = await verifyToken(token);
            req.user = decodedToken;
        }

        next();
    } catch (error) {
        // If token is invalid, just continue without user
        next();
    }
};
export const verifyAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await verifyToken(token);

        // Verificar se o usuário tem claim de admin ou email autorizado
        const isAdmin = decodedToken.admin === true ||
            decodedToken.email?.endsWith('@sickgrip.com.br') ||
            decodedToken.email === 'admin@sickgrip.com.br';

        if (!isAdmin) {
            console.warn(`Unauthorized admin access attempt by: ${decodedToken.email}`);
            return res.status(403).json({ error: 'Admin access denied' });
        }

        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(403).json({ error: 'Admin access denied' });
    }
};
