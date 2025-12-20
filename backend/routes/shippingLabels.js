import express from 'express';
import { getOrderById, getFirestore } from '../services/firebaseService.js';
import { verifyToken, isUserAdmin } from '../services/firebaseService.js';
import {
    createShippingLabel,
    purchaseShippingLabel,
    generateShippingLabelPDF,
    printShippingLabel,
    requestPickup,
    getTrackingInfo,
    getShipmentDetails
} from '../services/melhorEnvioShippingService.js';
import { sendOrderStatusUpdate, sendShippingNotification } from '../services/emailService.js';

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

/**
 * POST /api/shipping-labels/:orderId/create
 * Create and purchase shipping label
 */
router.post('/:orderId/create', verifyAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await getOrderById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        console.log('📦 Creating shipping label for order:', orderId);
        console.log('📋 Complete order structure:', JSON.stringify(order, null, 2));

        // Step 1: Create label in cart
        const cartItem = await createShippingLabel(order);
        const melhorEnvioId = cartItem.id;

        console.log('✅ Cart item created:', melhorEnvioId);

        // Step 2: Purchase label
        const purchaseResult = await purchaseShippingLabel(melhorEnvioId);

        console.log('✅ Label purchased');

        // Step 3: Generate label PDF
        const generateResult = await generateShippingLabelPDF(melhorEnvioId);

        console.log('✅ Label generated');

        // Step 4: Get print URL
        const labelUrl = await printShippingLabel(melhorEnvioId);

        console.log('✅ Label URL:', labelUrl);

        // Step 5: Get shipment details to get tracking code
        const shipmentDetails = await getShipmentDetails(melhorEnvioId);
        const trackingCode = shipmentDetails.tracking;

        console.log('✅ Tracking code:', trackingCode);

        // Step 6: Update order in Firestore
        const db = getFirestore();
        await db.collection('orders').doc(orderId).update({
            'shipping.melhorEnvioId': melhorEnvioId,
            'shipping.trackingCode': trackingCode,
            'shipping.labelUrl': labelUrl,
            'shipping.labelCreatedAt': new Date(),
            status: 'processing'
        });

        console.log('✅ Order updated with shipping info');

        // Step 7: Send shipping notification email with tracking code
        try {
            const estimatedDelivery = shipmentDetails.delivery_range?.max
                ? new Date(shipmentDetails.delivery_range.max)
                : null;

            await sendShippingNotification(order, trackingCode, estimatedDelivery);
            console.log('📧 Shipping notification email sent');
        } catch (emailError) {
            console.error('❌ Error sending shipping email:', emailError);
        }

        res.json({
            success: true,
            melhorEnvioId,
            trackingCode,
            labelUrl,
            message: 'Etiqueta criada com sucesso'
        });

    } catch (error) {
        console.error('❌ Error creating shipping label:', error);
        res.status(500).json({
            error: 'Failed to create shipping label',
            message: error.message
        });
    }
});

/**
 * POST /api/shipping-labels/:orderId/pickup
 * Request pickup for shipment
 */
router.post('/:orderId/pickup', verifyAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await getOrderById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const melhorEnvioId = order.shipping?.melhorEnvioId;

        if (!melhorEnvioId) {
            return res.status(400).json({ error: 'No shipping label found for this order' });
        }

        console.log('🚚 Requesting pickup for order:', orderId);

        // Request pickup
        const pickupResult = await requestPickup([melhorEnvioId]);

        console.log('✅ Pickup requested:', pickupResult);

        // Update order status
        const db = getFirestore();
        await db.collection('orders').doc(orderId).update({
            'shipping.pickupScheduled': true,
            'shipping.pickupDate': new Date(),
            status: 'shipped'
        });

        // Send shipping notification email
        try {
            await sendOrderStatusUpdate(order, 'shipped');
            console.log('📧 Shipping notification email sent');
        } catch (emailError) {
            console.error('❌ Error sending shipping email:', emailError);
        }

        res.json({
            success: true,
            message: 'Coleta solicitada com sucesso',
            pickupResult
        });

    } catch (error) {
        console.error('❌ Error requesting pickup:', error);
        res.status(500).json({
            error: 'Failed to request pickup',
            message: error.message
        });
    }
});

/**
 * GET /api/shipping-labels/:orderId/tracking
 * Get tracking information
 */
router.get('/:orderId/tracking', verifyAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await getOrderById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const trackingCode = order.shipping?.trackingCode;

        if (!trackingCode) {
            return res.status(400).json({ error: 'No tracking code found for this order' });
        }

        console.log('📍 Getting tracking info for:', trackingCode);

        const trackingInfo = await getTrackingInfo(trackingCode);

        res.json({
            success: true,
            trackingCode,
            trackingInfo
        });

    } catch (error) {
        console.error('❌ Error getting tracking info:', error);
        res.status(500).json({
            error: 'Failed to get tracking info',
            message: error.message
        });
    }
});

/**
 * GET /api/shipping-labels/:orderId/label
 * Get label URL
 */
router.get('/:orderId/label', verifyAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await getOrderById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const labelUrl = order.shipping?.labelUrl;

        if (!labelUrl) {
            return res.status(400).json({ error: 'No label found for this order' });
        }

        res.json({
            success: true,
            labelUrl
        });

    } catch (error) {
        console.error('❌ Error getting label:', error);
        res.status(500).json({
            error: 'Failed to get label',
            message: error.message
        });
    }
});

export default router;
