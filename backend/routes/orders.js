import express from 'express';
import { getAllOrders, getOrderById, updateOrderStatus, createOrder, getOrdersByUserId } from '../services/dbService.js';
import { createPendingOrder } from '../services/orderCalculationService.js';
import { sendOrderStatusUpdate } from '../services/emailService.js';
import { verifyAdmin, authenticate } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLog.js';
import { validateOrder, validateOrderStatus } from '../middleware/validation.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/orders
 * Get orders for authenticated user (or all orders if admin)
 */
router.get('/', authenticate, async (req, res, next) => {
    try {
        const isAdmin = req.user?.isAdmin || false;
        const orders = isAdmin ? await getAllOrders() : await getOrdersByUserId(req.userId);
        res.json({ orders });
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/orders/:id
 * Get order by ID (admin or order owner)
 */
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const order = await getOrderById(req.params.id);

        // Check if user is admin or order owner
        if (req.user.isAdmin || order.userId === req.userId) {
            return res.json(order);
        }

        res.status(403).json({ error: 'Access denied' });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/orders
 * Create order (requires authentication)
 */
router.post('/', authenticate, validateOrder, auditLog('CREATE_ORDER'), async (req, res, next) => {
    try {
        const orderData = req.body;
        orderData.userId = req.userId;

        // Get user to check if it's a pavilhao user
        const { User } = await import('../models/index.js');
        const user = await User.findByPk(req.userId);

        let order;
        if (user && user.userType === 'pavilhao') {
            if (!orderData.sellerName || orderData.sellerName.trim() === '') {
                return res.status(400).json({
                    error: 'Campo "Nome do Vendedor" é obrigatório para vendas no pavilhão'
                });
            }
            // Pavilhão sales are settled in-store, outside the payment system, but the
            // total still feeds sales reporting (getSalesReportPavilhaoVsOnline) — see
            // the validation added in Fase 2, not skipped/zeroed here.
            orderData.orderType = 'pavilhao';
            order = await createOrder(orderData);
        } else {
            orderData.orderType = 'online';

            // Assigns orderNumber, recomputes subtotal/discount/total/shipping
            // server-side from real product prices (never trusts the client), and
            // persists the pending order.
            const created = await createPendingOrder(orderData, {
                paymentMethod: orderData.payment?.method,
                userId: orderData.userId,
                userEmail: orderData.customer?.email
            });
            order = created.order;
        }

        res.status(201).json({
            success: true,
            order,
            message: 'Order created successfully'
        });
    } catch (error) {
        next(error);
    }
});

/**
 * PUT /api/orders/:id/status
 * Update order status (admin only)
 */
router.put('/:id/status', verifyAdmin, validateOrderStatus, auditLog('UPDATE_ORDER_STATUS'), async (req, res, next) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        const updatedOrder = await updateOrderStatus(orderId, status);

        // Send status update email
        try {
            await sendOrderStatusUpdate(updatedOrder, status);
        } catch (emailError) {
            logger.warn('Email sending failed:', emailError);
            // Don't fail the request if email fails
        }

        res.json({
            success: true,
            order: updatedOrder,
            message: 'Order status updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

export default router;
