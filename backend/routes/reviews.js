import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { validateReview } from '../middleware/validation.js';
import { createReview, getProductReviews, canReviewProduct } from '../services/reviewService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/products/:productId/reviews
 * Public — list + average/count for a product.
 */
router.get('/products/:productId/reviews', async (req, res, next) => {
    try {
        const result = await getProductReviews(req.params.productId);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/products/:productId/reviews/eligibility
 * Authenticated — whether the current user can review this product (has a
 * paid/shipped/delivered order containing it, and hasn't already reviewed it).
 * Lets the frontend show/hide the review form without guessing.
 */
router.get('/products/:productId/reviews/eligibility', authenticate, async (req, res, next) => {
    try {
        const eligible = await canReviewProduct(req.userId, req.params.productId);
        res.json({ eligible });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/reviews
 * Authenticated. Eligibility (a real paid/delivered order containing this
 * product) is re-checked server-side in reviewService — the eligibility
 * endpoint above is only a UI convenience, not the actual gate.
 */
router.post('/reviews', authenticate, validateReview, async (req, res, next) => {
    try {
        const { productId, rating, comment } = req.body;
        const userName = req.user.name || 'Cliente Sick Grip';
        const review = await createReview(req.userId, userName, productId, { rating, comment });
        res.status(201).json({ success: true, review });
    } catch (error) {
        next(error);
    }
});

export default router;
