import { verifyToken } from '../services/authService.js';
import { User } from '../models/index.js';

const resolveUserFromToken = async (decodedToken) => {
    const tokenUid = decodedToken?.uid;
    const tokenEmail = decodedToken?.email;

    let dbUser = null;

    if (tokenUid) {
        dbUser = await User.findByPk(tokenUid);
    }

    if (!dbUser && tokenEmail) {
        dbUser = await User.findOne({
            where: { email: String(tokenEmail).toLowerCase() }
        });
    }

    const isAdmin = Boolean(
        dbUser?.isAdmin ||
        dbUser?.userType === 'admin'
    );

    return {
        ...decodedToken,
        uid: dbUser?.id || tokenUid,
        email: dbUser?.email || tokenEmail,
        name: dbUser?.name || decodedToken?.name,
        isAdmin,
        userType: dbUser?.userType || decodedToken?.userType || 'customer'
    };
};

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = verifyToken(token);
        const user = await resolveUserFromToken(decodedToken);

        req.user = user;
        req.userId = user.uid;
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
            const decodedToken = verifyToken(token);
            const user = await resolveUserFromToken(decodedToken);
            req.user = user;
            req.userId = user.uid;
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
        const decodedToken = verifyToken(token);
        const user = await resolveUserFromToken(decodedToken);

        if (!user.isAdmin) {
            console.warn(`Unauthorized admin access attempt by: ${user.email || decodedToken.email}`);
            return res.status(403).json({ error: 'Admin access denied' });
        }

        req.user = user;
        req.userId = user.uid;
        next();
    } catch (error) {
        console.error('Admin auth error:', error);
        res.status(403).json({ error: 'Admin access denied' });
    }
};
