import express from 'express';
import crypto from 'crypto';
import { loginUser, registerUser, refreshAccessToken, hashPassword, comparePassword } from '../services/authService.js';
import { updateUserProfile } from '../services/dbService.js';
import { authenticate } from '../middleware/auth.js';
import { User } from '../models/index.js';
import { sendTemporaryPassword } from '../services/emailService.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
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
router.post('/login', async (req, res) => {
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
 * Gera uma senha temporária e envia por email ao usuário
 */
router.post('/forgot-password', async (req, res) => {
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

        // Gerar senha temporária
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashed = await hashPassword(tempPassword);

        await user.update({ password: hashed, updatedAt: new Date() });

        // Tentar enviar email com a senha temporária
        const result = await sendTemporaryPassword(user.email, tempPassword);

        res.json({ success: true, emailSent: result?.success || false });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: error.message || 'Failed to process request' });
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

