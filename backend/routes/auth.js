import express from 'express';
import crypto from 'crypto';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { loginUser, registerUser, refreshAccessToken, hashPassword, comparePassword } from '../services/authService.js';
import { updateUserProfile } from '../services/dbService.js';
import { authenticate } from '../middleware/auth.js';
import { User } from '../models/index.js';
import { sendPasswordReset } from '../services/emailService.js';

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10,
    message: 'Muitas tentativas de autenticação, tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    // ipKeyGenerator normalizes IPv6 addresses (by /56 subnet) before combining with
    // the email — using req.ip raw would let an IPv6 client rotate addresses within
    // its own subnet to dodge the limit, and express-rate-limit v8 refuses to boot
    // with a custom keyGenerator that skips this normalization.
    keyGenerator: (req) => {
        const email = String(req.body?.email || '').trim().toLowerCase();
        return `${ipKeyGenerator(req.ip)}:${email}`;
    }
});

// Same shape as loginLimiter — registration and forgot-password are also attractive
// to abuse (mass account creation / spamming reset emails at a target's inbox).
const sensitiveActionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Muitas tentativas, tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        const email = String(req.body?.email || '').trim().toLowerCase();
        return `${ipKeyGenerator(req.ip)}:${email}`;
    }
});

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', sensitiveActionLimiter, async (req, res) => {
    try {
        const { email, password, name, phone, cpf } = req.body;

        // Validate input
        if (!email || !password || !name) {
            return res.status(400).json({
                error: 'Email, password, and name are required'
            });
        }

        const result = await registerUser({
            email,
            password,
            name,
            phone,
            cpf
        });

        res.status(201).json({
            success: true,
            token: result.token,
            refreshToken: result.refreshToken,
            user: result.user
        });
    } catch (error) {
        console.error('Register error:', error);

        if (error.message.includes('already exists')) {
            return res.status(409).json({ error: 'User already exists' });
        }

        res.status(500).json({ error: error.message || 'Registration failed' });
    }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required'
            });
        }

        const result = await loginUser(email, password);

        res.json({
            success: true,
            token: result.token,
            refreshToken: result.refreshToken,
            user: result.user
        });
    } catch (error) {
        console.error('Login error:', error);

        if (error.message.includes('not found') || error.message.includes('Invalid')) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.status(500).json({ error: error.message || 'Login failed' });
    }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }

        const result = await refreshAccessToken(refreshToken);

        res.json({
            success: true,
            token: result.token
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});

/**
 * GET /api/auth/me
 * Get current user profile (requires authentication)
 */
router.get('/me', authenticate, async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // User info is already in req.user from middleware
        res.json({
            user: req.user
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

/**
 * PUT /api/auth/profile
 * Update user profile (requires authentication)
 */
router.put('/profile', authenticate, async (req, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { name, phone, address } = req.body;

        const updatedUser = await updateUserProfile(req.userId, {
            name,
            phone,
            address
        });

        res.json({
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                phone: updatedUser.phone,
                address: updatedUser.address
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);

        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(500).json({ error: error.message || 'Failed to update profile' });
    }
});

/**
 * POST /api/auth/logout
 * Logout (client-side should delete tokens)
 */
router.post('/logout', authenticate, async (req, res) => {
    // In a stateless JWT system, logout is handled on the client by deleting tokens
    // This endpoint can be used for cleanup/logging if needed
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

/**
 * POST /api/auth/forgot-password
 * Sends a password reset link (valid for 1h). Does NOT change the password —
 * that only happens if/when the link is used (see POST /reset-password below),
 * so a malicious "forgot password" call against someone else's email can no
 * longer lock them out of their own account.
 */
router.post('/forgot-password', sensitiveActionLimiter, async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await User.findOne({ where: { email: String(email).toLowerCase() } });

        // Não revelar se o usuário existe ou não
        if (!user) {
            return res.json({ success: true, message: 'Se o email existir, você receberá instruções para redefinir a senha.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        await user.update({
            resetTokenHash: hashResetToken(resetToken),
            resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
            updatedAt: new Date()
        });

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const link = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
        const result = await sendPasswordReset(user.email, link);

        res.json({ success: true, emailSent: result?.success || false });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: error.message || 'Failed to process request' });
    }
});

/**
 * POST /api/auth/reset-password
 * Completes a password reset started by /forgot-password: sets the new password
 * only if the token matches, hasn't expired, and hasn't been used already.
 */
router.post('/reset-password', sensitiveActionLimiter, async (req, res) => {
    try {
        const { email, token, newPassword } = req.body;

        if (!email || !token || !newPassword) {
            return res.status(400).json({ error: 'E-mail, token e nova senha são obrigatórios' });
        }
        if (String(newPassword).length < 6) {
            return res.status(400).json({ error: 'A nova senha deve ter ao menos 6 caracteres' });
        }

        const user = await User.findOne({ where: { email: String(email).toLowerCase() } });
        const invalidTokenResponse = () => res.status(400).json({ error: 'Link inválido ou expirado. Solicite uma nova recuperação de senha.' });

        if (!user || !user.resetTokenHash || !user.resetTokenExpiresAt) {
            return invalidTokenResponse();
        }
        if (new Date(user.resetTokenExpiresAt).getTime() < Date.now()) {
            return invalidTokenResponse();
        }

        const providedHash = hashResetToken(String(token));
        const storedHash = user.resetTokenHash;
        const providedBuf = Buffer.from(providedHash, 'hex');
        const storedBuf = Buffer.from(storedHash, 'hex');
        const matches = providedBuf.length === storedBuf.length && crypto.timingSafeEqual(providedBuf, storedBuf);
        if (!matches) {
            return invalidTokenResponse();
        }

        const hashed = await hashPassword(newPassword);
        await user.update({
            password: hashed,
            resetTokenHash: null,
            resetTokenExpiresAt: null,
            updatedAt: new Date()
        });

        res.json({ success: true, message: 'Senha redefinida com sucesso.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: error.message || 'Failed to reset password' });
    }
});

/**
 * PUT /api/auth/change-password
 * Change authenticated user's password (requires current password)
 */
router.put('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!req.userId) return res.status(401).json({ error: 'Not authenticated' });
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both current and new passwords are required' });

        const user = await User.findByPk(req.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const valid = await comparePassword(currentPassword, user.password);
        if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

        const hashed = await hashPassword(newPassword);
        await user.update({ password: hashed, updatedAt: new Date() });

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

export default router;

