import express from 'express';
import { verifyAdmin } from '../middleware/auth.js';
import { getFilterSettings, updateFilterSettings } from '../services/settingsStore.js';

const router = express.Router();

// Get filter settings (categories, partTypes, partners)
router.get('/filters', (req, res) => {
    try {
        res.json(getFilterSettings());
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({ error: 'Failed to get settings' });
    }
});

// Update filter settings (admin only)
router.put('/filters', verifyAdmin, (req, res) => {
    try {
        const { categories, partTypes, partners } = req.body;

        const settings = updateFilterSettings({ categories, partTypes, partners });

        res.json({ success: true, settings });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
