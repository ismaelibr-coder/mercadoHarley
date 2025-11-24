import express from 'express';
import admin from 'firebase-admin';
import { sendPasswordReset, sendWelcomeEmail } from '../services/emailService.js';

const router = express.Router();

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Generate password reset link using Firebase Admin SDK
        const link = await admin.auth().generatePasswordResetLink(email);

        // Send email using Resend
        const result = await sendPasswordReset(email, link);

        if (!result.success) {
            console.error('Failed to send password reset email:', result.error);
            return res.status(500).json({ error: 'Failed to send email' });
        }

        res.json({ message: 'Password reset email sent successfully' });
    } catch (error) {
        console.error('Error in forgot-password:', error);

        if (error.code === 'auth/user-not-found') {
            // For security reasons, we shouldn't reveal if the user exists or not
            // But for debugging/development it might be useful to know
            // Let's return success to prevent user enumeration
            return res.json({ message: 'If the email exists, a reset link has been sent' });
        }

        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/welcome
router.post('/welcome', async (req, res) => {
    try {
        const { email, displayName } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const result = await sendWelcomeEmail({ email, displayName });

        if (!result.success) {
            console.error('Failed to send welcome email:', result.error);
            // Don't return error to client, just log it
            return res.json({ message: 'Welcome email failed but registration successful' });
        }

        res.json({ message: 'Welcome email sent successfully' });
    } catch (error) {
        console.error('Error in welcome email:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
