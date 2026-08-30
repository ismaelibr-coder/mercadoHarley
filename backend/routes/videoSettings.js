import express from 'express';
import { verifyAdmin } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import { getVideoSettings, updateVideoSettings } from '../services/videoSettingsService.js';

const router = express.Router();

// GET /api/video-settings — public, the Hero's current video/poster/title
router.get('/', async (req, res) => {
    try {
        const settings = await getVideoSettings();
        res.json(settings);
    } catch (error) {
        logger.error('Error fetching video settings:', error);
        res.status(500).json({ error: 'Failed to fetch video settings' });
    }
});

// PUT /api/video-settings (admin only)
router.put('/', verifyAdmin, async (req, res) => {
    try {
        const { videoUrl, posterUrl, title } = req.body;
        const settings = await updateVideoSettings({ videoUrl, posterUrl, title });
        res.json(settings);
    } catch (error) {
        logger.error('Error updating video settings:', error);
        res.status(500).json({ error: 'Failed to update video settings' });
    }
});

export default router;
