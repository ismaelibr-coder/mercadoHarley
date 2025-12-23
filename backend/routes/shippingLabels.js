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

        // Step 5: Wait and retry to get Correios tracking code
        // Correios assigns tracking code after PDF generation, but it takes time
        console.log('⏳ Waiting for Correios to assign tracking code...');

        let shipmentDetails = null;
        let correiosTracking = null;
        let attempts = 0;
        const maxAttempts = 3;
        const delays = [30000, 15000, 15000]; // 30s, then 15s, then 15s

        // Helper to validate Correios tracking code format (2 letters + 9 digits + BR)
        const isCorreiosCode = (code) => {
            return code && /^[A-Z]{2}\d{9}BR$/.test(code);
        };

        while (attempts < maxAttempts && !correiosTracking) {
            if (attempts > 0) {
                console.log(`⏳ Attempt ${attempts + 1}/${maxAttempts}: Waiting ${delays[attempts] / 1000}s...`);
            }

            await new Promise(resolve => setTimeout(resolve, delays[attempts]));

            shipmentDetails = await getShipmentDetails(melhorEnvioId);

            if (isCorreiosCode(shipmentDetails.tracking)) {
                correiosTracking = shipmentDetails.tracking;
                console.log('✅ Correios tracking code found:', correiosTracking);
                break;
            }

            attempts++;
            console.log(`   - tracking: ${shipmentDetails.tracking || 'null'}`);
            console.log(`   - protocol: ${shipmentDetails.protocol}`);
        }

        // Use Correios code if available, otherwise use Melhor Envio protocol
        const trackingCode = correiosTracking || shipmentDetails.protocol;
        const hasCorreiosCode = !!correiosTracking;

        console.log('📦 Final tracking code:', trackingCode);
        console.log('   - Is Correios code:', hasCorreiosCode);
        console.log('   - Correios tracking:', shipmentDetails.tracking);
        console.log('   - Melhor Envio protocol:', shipmentDetails.protocol);

        // Calculate estimated delivery date
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + (shipmentDetails.delivery_max || 7));

        // Step 6: Update order in Firestore
        const db = getFirestore();
        await db.collection('orders').doc(orderId).update({
            'shipping.melhorEnvioId': melhorEnvioId,
            'shipping.trackingCode': trackingCode,
            'shipping.correiosTracking': correiosTracking, // Correios code (can be null)
            'shipping.melhorEnvioProtocol': shipmentDetails.protocol, // Melhor Envio ID
            'shipping.hasCorreiosCode': hasCorreiosCode,
            'shipping.labelUrl': labelUrl,
            'shipping.labelCreatedAt': new Date(),
            'shipping.deliveryMin': shipmentDetails.delivery_min,
            'shipping.deliveryMax': shipmentDetails.delivery_max,
            'shipping.estimatedDelivery': deliveryDate,
            status: 'processing'
        });

        console.log('✅ Order updated with shipping info');

        // Step 7: Send shipping notification email ONLY if we have Correios tracking code
        try {
            if (hasCorreiosCode) {
                await sendShippingNotification(order, correiosTracking, deliveryDate);
                console.log('📧 Shipping notification email sent with Correios tracking');
            } else {
                console.log('⚠️ Skipping email - no Correios tracking code yet');
                console.log('   Admin can manually update tracking code later');
            }
        } catch (emailError) {
            console.error('❌ Error sending shipping email:', emailError);
        }

        res.json({
            success: true,
            melhorEnvioId,
            trackingCode,
            correiosTracking,
            hasCorreiosCode,
            labelUrl,
            estimatedDelivery: deliveryDate
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
