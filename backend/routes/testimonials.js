import express from 'express';
import { verifyAdmin } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import {
    getAllTestimonials,
    getTestimonialById,
    createTestimonial,
    updateTestimonial,
    deleteTestimonial
} from '../services/testimonialService.js';

const router = express.Router();

// GET /api/testimonials — public, ordered list for the Home section
router.get('/', async (req, res) => {
    try {
        const items = await getAllTestimonials();
        res.json({ items });
    } catch (error) {
        logger.error('Error fetching testimonials:', error);
        res.status(500).json({ error: 'Failed to fetch testimonials' });
    }
});

// GET /api/testimonials/:id (admin only)
router.get('/:id', verifyAdmin, async (req, res) => {
    try {
        const item = await getTestimonialById(req.params.id);
        res.json(item);
    } catch (error) {
        logger.error('Error fetching testimonial:', error);
        if (error.message === 'Testimonial not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to fetch testimonial' });
        }
    }
});

// POST /api/testimonials (admin only)
router.post('/', verifyAdmin, async (req, res) => {
    try {
        const { name, city, quote, rating, photo, displayOrder } = req.body;
        if (!name || !quote) {
            return res.status(400).json({ error: 'Missing required fields: name, quote' });
        }
        if (rating !== undefined && (rating < 1 || rating > 5)) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        const item = await createTestimonial({ name, city, quote, rating, photo, displayOrder });
        res.status(201).json(item);
    } catch (error) {
        logger.error('Error creating testimonial:', error);
        res.status(500).json({ error: 'Failed to create testimonial' });
    }
});

// PUT /api/testimonials/:id (admin only)
router.put('/:id', verifyAdmin, async (req, res) => {
    try {
        if (req.body.rating !== undefined && (req.body.rating < 1 || req.body.rating > 5)) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }
        const item = await updateTestimonial(req.params.id, req.body);
        res.json(item);
    } catch (error) {
        logger.error('Error updating testimonial:', error);
        if (error.message === 'Testimonial not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to update testimonial' });
        }
    }
});

// DELETE /api/testimonials/:id (admin only)
router.delete('/:id', verifyAdmin, async (req, res) => {
    try {
        await deleteTestimonial(req.params.id);
        res.json({ message: 'Testimonial deleted successfully' });
    } catch (error) {
        logger.error('Error deleting testimonial:', error);
        if (error.message === 'Testimonial not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Failed to delete testimonial' });
        }
    }
});

export default router;
