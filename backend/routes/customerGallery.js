import express from 'express';
import { verifyAdmin } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import {
    getAllGalleryItems,
    getGalleryItemById,
    createGalleryItem,
    updateGalleryItem,
    deleteGalleryItem
} from '../services/customerGalleryService.js';

const router = express.Router();

// GET /api/customer-gallery — public, ordered list for the Home grid
router.get('/', async (req, res) => {
    try {
        const items = await getAllGalleryItems();
        res.json({ items });
    } catch (error) {
        logger.error('Error fetching gallery items:', error);
        res.status(500).json({ error: 'Failed to fetch gallery items' });
    }
});

// GET /api/customer-gallery/:id (admin only)
router.get('/:id', verifyAdmin, async (req, res) => {
    try {
        const item = await getGalleryItemById(req.params.id);
        res.json(item);
    } catch (error) {
        logger.error('Error fetching gallery item:', error);
        if (error.message === 'Gallery item not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to fetch gallery item' });
        }
    }
});

// POST /api/customer-gallery (admin only)
router.post('/', verifyAdmin, async (req, res) => {
    try {
        const { image, caption, displayOrder } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'Missing required field: image' });
        }
        const item = await createGalleryItem({ image, caption, displayOrder });
        res.status(201).json(item);
    } catch (error) {
        logger.error('Error creating gallery item:', error);
        res.status(500).json({ error: 'Failed to create gallery item' });
    }
});

// PUT /api/customer-gallery/:id (admin only)
router.put('/:id', verifyAdmin, async (req, res) => {
    try {
        const item = await updateGalleryItem(req.params.id, req.body);
        res.json(item);
    } catch (error) {
        logger.error('Error updating gallery item:', error);
        if (error.message === 'Gallery item not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to update gallery item' });
        }
    }
});

// DELETE /api/customer-gallery/:id (admin only)
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        await deleteGalleryItem(req.params.id);
        res.json({ message: 'Gallery item deleted successfully' });
    } catch (error) {
        logger.error('Error deleting gallery item:', error);
        if (error.message === 'Gallery item not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to delete gallery item' });
        }
    }
});

export default router;
