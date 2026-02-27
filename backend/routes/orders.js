import express from 'express';
import { getAllOrders, getOrderById, updateOrderStatus, createOrder, getOrdersByUserId } from '../services/databaseService.js';
import { sendOrderStatusUpdate } from '../services/emailService.js';
import { verifyAdmin, authenticate } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLog.js';

const router = express.Router();

/**
 * GET /api/orders
 * Get orders for authenticated user (or all orders if admin)
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const isAdmin = req.user?.isAdmin || false;
        const orders = isAdmin ? await getAllOrders() : await getOrdersByUserId(req.userId);
        res.json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

/**
 * GET /api/orders/:id
 * Get order by ID (admin or order owner)
 */
router.get('/:id', authenticate, async (req, res) => {
    try {
        const order = await getOrderById(req.params.id);

        // Check if user is admin or order owner
        if (req.user.isAdmin || order.userId === req.userId) {
            return res.json(order);
        }

        res.status(403).json({ error: 'Access denied' });
    } catch (error) {
        console.error('Error fetching order:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

/**
 * POST /api/orders
 * Create order (requires authentication)
 */
router.post('/', authenticate, auditLog('CREATE_ORDER'), async (req, res) => {
    try {
        const orderData = req.body;
        orderData.userId = req.userId;

        // Get user to check if it's a pavilhao user
        const { User } = await import('../models/index.js');
        const user = await User.findByPk(req.userId);

        // If pavilhao user, require sellerName
        if (user && user.userType === 'pavilhao') {
            if (!orderData.sellerName || orderData.sellerName.trim() === '') {
                return res.status(400).json({
                    error: 'Campo "Nome do Vendedor" é obrigatório para vendas no pavilhão'
                });
            }
            orderData.orderType = 'pavilhao';
        } else {
            orderData.orderType = 'online';
        }

        const order = await createOrder(orderData);

        res.status(201).json({
            success: true,
            order,
            message: 'Order created successfully'
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: error.message || 'Failed to create order' });
    }
});

/**
 * PUT /api/orders/:id/status
 * Update order status (admin only)
 */
router.put('/:id/status', verifyAdmin, auditLog('UPDATE_ORDER_STATUS'), async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const updatedOrder = await updateOrderStatus(orderId, status);

        // Send status update email
        try {
            await sendOrderStatusUpdate(updatedOrder, status);
        } catch (emailError) {
            console.warn('Email sending failed:', emailError);
            // Don't fail the request if email fails
        }

        res.json({
            success: true,
            order: updatedOrder,
            message: 'Order status updated successfully'
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.status(500).json({ error: error.message || 'Failed to update order status' });
    }
});

export default router;
