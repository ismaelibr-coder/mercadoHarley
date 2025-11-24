import express from 'express';
import { getAllOrders, getOrderById, updateOrderStatus } from '../services/firebaseService.js';
import { sendOrderStatusUpdate } from '../services/emailService.js';
import { verifyToken, isUserAdmin } from '../services/firebaseService.js';

const router = express.Router();

// Middleware to verify admin
const verifyAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split('Bearer ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decodedToken = await verifyToken(token);
        const isAdmin = await isUserAdmin(decodedToken.uid);

        if (!isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// GET /api/orders
router.get('/', verifyAdmin, async (req, res) => {
    try {
        const orders = await getAllOrders();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET /api/orders/:id
router.get('/:id', verifyAdmin, async (req, res) => {
    try {
        const order = await getOrderById(req.params.id);
        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// PUT /api/orders/:id/status
router.put('/:id/status', verifyAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        await updateOrderStatus(orderId, status);

        // Fetch updated order to send email
        const order = await getOrderById(orderId);

        // Send status update email
        await sendOrderStatusUpdate(order, status);

        res.json({ message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

export default router;
