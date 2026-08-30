import crypto from 'crypto';
import { Review } from '../models/index.js';
import { getOrdersByUserId } from './dbService.js';
import logger from '../utils/logger.js';

// Statuses that mean "the customer actually received this" — pending/cancelled/
// rejected orders don't count, so a review can't be posted for something that
// was never paid for or never delivered.
const REVIEW_ELIGIBLE_STATUSES = new Set(['paid', 'processing', 'shipped', 'delivered']);

// Real MySQL (production) auto-parses DataTypes.JSON columns into real arrays/
// objects on read. MariaDB (this project's local dev, via XAMPP) stores JSON as
// CHECK-constrained LONGTEXT and Sequelize's mysql2 dialect doesn't always
// recognize that as JSON to auto-parse — order.items can come back as a raw
// string locally even though the exact same code gets a real array in prod.
// Safe to call on an already-parsed value too.
const asArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
};

/**
 * Finds a paid/shipped/delivered order belonging to this user that contains
 * this product — the server-side proof a review is tied to a real purchase,
 * not just hidden behind a UI check.
 */
const findEligibleOrder = async (userId, productId) => {
    const orders = await getOrdersByUserId(userId);
    return orders.find((order) =>
        REVIEW_ELIGIBLE_STATUSES.has(order.status) &&
        asArray(order.items).some((item) => item.id === productId)
    ) || null;
};

export const canReviewProduct = async (userId, productId) => {
    const order = await findEligibleOrder(userId, productId);
    return Boolean(order);
};

export const createReview = async (userId, userName, productId, { rating, comment }) => {
    const order = await findEligibleOrder(userId, productId);
    if (!order) {
        const err = new Error('Você só pode avaliar produtos que já comprou');
        err.status = 403;
        throw err;
    }

    const existing = await Review.findOne({ where: { userId, productId } });
    if (existing) {
        const err = new Error('Você já avaliou este produto');
        err.status = 409;
        throw err;
    }

    try {
        const review = await Review.create({
            id: crypto.randomUUID(),
            orderId: order.id,
            productId,
            userId,
            userName,
            rating,
            comment
        });
        return review.toJSON();
    } catch (error) {
        logger.error('Error creating review:', error);
        throw error;
    }
};

export const getProductReviews = async (productId) => {
    const reviews = await Review.findAll({
        where: { productId },
        order: [['createdAt', 'DESC']]
    });

    const items = reviews.map((r) => r.toJSON());
    const count = items.length;
    const average = count > 0
        ? Number((items.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
        : 0;

    return { reviews: items, average, count };
};

export default { canReviewProduct, createReview, getProductReviews };
