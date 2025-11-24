import express from 'express';
import { verifyAdmin } from '../middleware/auth.js';
import {
    getAllBanners,
    getActiveBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner
} from '../services/bannerService.js';

const router = express.Router();

/**
 * GET /api/banners/active
 * Get active banners for public display
 */
router.get('/active', async (req, res) => {
    try {
        const banners = await getActiveBanners();
        res.json({ banners });
    } catch (error) {
        console.error('Error fetching active banners:', error);
        res.status(500).json({ error: 'Failed to fetch banners' });
    }
});

/**
 * GET /api/banners
 * Get all banners (admin only)
 */
router.get('/', verifyAdmin, async (req, res) => {
    try {
        const banners = await getAllBanners();
        res.json({ banners });
    } catch (error) {
        console.error('Error fetching banners:', error);
        res.status(500).json({ error: 'Failed to fetch banners' });
    }
});

/**
 * GET /api/banners/:id
 * Get single banner (admin only)
 */
router.get('/:id', verifyAdmin, async (req, res) => {
    try {
        const banner = await getBannerById(req.params.id);
        res.json(banner);
    } catch (error) {
        console.error('Error fetching banner:', error);
        if (error.message === 'Banner not found') {
            res.status(404).json({ error: 'Banner not found' });
        } else {
            res.status(500).json({ error: 'Failed to fetch banner' });
        }
    }
});

/**
 * POST /api/banners
 * Create new banner (admin only)
 */
router.post('/', verifyAdmin, async (req, res) => {
    try {
        const { title, image, link, order, active } = req.body;

        // Validation
        if (!title || !image || !link || !link.type || !link.value) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!['category', 'product', 'external'].includes(link.type)) {
            return res.status(400).json({ error: 'Invalid link type' });
        }

        const banner = await createBanner({
            title,
            image,
            link,
            order: order || 0,
            active: active !== undefined ? active : true
        });

        res.status(201).json(banner);
    } catch (error) {
        console.error('Error creating banner:', error);
        res.status(500).json({ error: 'Failed to create banner' });
    }
});

/**
 * PUT /api/banners/:id
 * Update banner (admin only)
 */
router.put('/:id', verifyAdmin, async (req, res) => {
    try {
        const { title, image, link, order, active } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (image !== undefined) updateData.image = image;
        if (link !== undefined) {
            if (!link.type || !link.value) {
                return res.status(400).json({ error: 'Invalid link data' });
            }
            if (!['category', 'product', 'external'].includes(link.type)) {
                return res.status(400).json({ error: 'Invalid link type' });
            }
            updateData.link = link;
        }
        if (order !== undefined) updateData.order = order;
        if (active !== undefined) updateData.active = active;

        const banner = await updateBanner(req.params.id, updateData);
        res.json(banner);
    } catch (error) {
        console.error('Error updating banner:', error);
        if (error.message === 'Banner not found') {
            res.status(404).json({ error: 'Banner not found' });
        } else {
            res.status(500).json({ error: 'Failed to update banner' });
        }
    }
});

/**
 * DELETE /api/banners/:id
 * Delete banner (admin only)
 */
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        await deleteBanner(req.params.id);
        res.json({ message: 'Banner deleted successfully' });
    } catch (error) {
        console.error('Error deleting banner:', error);
        if (error.message === 'Banner not found') {
            res.status(404).json({ error: 'Banner not found' });
        } else {
            res.status(500).json({ error: 'Failed to delete banner' });
        }
    }
});

export default router;
