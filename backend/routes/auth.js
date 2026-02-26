import express from 'express';
import { loginUser, registerUser, refreshAccessToken } from '../services/authService.js';
import { updateUserProfile } from '../services/databaseService.js';
import { authenticate } from '../middleware/auth.js';

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

export default router;
