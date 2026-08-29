import express from 'express';
import { getOrderById } from '../services/dbService.js';
import { Order } from '../models/index.js';
import { verifyAdmin } from '../middleware/auth.js';
import logger from '../utils/logger.js';
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

        // Logs the order id and item count only — the full order (name/CPF/phone/
        // address) used to be dumped here, which put customer PII into server logs.
        logger.info('📦 Creating shipping label for order:', orderId, `(${order.items?.length || 0} itens)`);

        // Step 1: Create label in cart
        const cartItem = await createShippingLabel(order);
        const melhorEnvioId = cartItem.id;

        logger.info('✅ Cart item created:', melhorEnvioId);

        // Step 2: Purchase label
        const purchaseResult = await purchaseShippingLabel(melhorEnvioId);

        logger.info('✅ Label purchased');

        // Step 3: Generate label PDF
        const generateResult = await generateShippingLabelPDF(melhorEnvioId);

        logger.info('✅ Label generated');

        // Step 4: Get print URL
        const labelUrl = await printShippingLabel(melhorEnvioId);

        logger.info('✅ Label URL:', labelUrl);

        // Step 5: Wait and retry to get Correios tracking code
        // Correios assigns tracking code after PDF generation, but it takes time
        logger.info('⏳ Waiting for Correios to assign tracking code...');

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
                logger.info(`⏳ Attempt ${attempts + 1}/${maxAttempts}: Waiting ${delays[attempts] / 1000}s...`);
            }

            await new Promise(resolve => setTimeout(resolve, delays[attempts]));

            shipmentDetails = await getShipmentDetails(melhorEnvioId);

            if (isCorreiosCode(shipmentDetails.tracking)) {
                correiosTracking = shipmentDetails.tracking;
                logger.info('✅ Correios tracking code found:', correiosTracking);
                break;
            }

            attempts++;
            logger.info(`   - tracking: ${shipmentDetails.tracking || 'null'}`);
            logger.info(`   - protocol: ${shipmentDetails.protocol}`);
        }

        // Use Correios code if available, otherwise use Melhor Envio protocol
        const trackingCode = correiosTracking || shipmentDetails.protocol;
        const hasCorreiosCode = !!correiosTracking;

        logger.info('📦 Final tracking code:', trackingCode);
        logger.info('   - Is Correios code:', hasCorreiosCode);
        logger.info('   - Correios tracking:', shipmentDetails.tracking);
        logger.info('   - Melhor Envio protocol:', shipmentDetails.protocol);

        // Calculate estimated delivery date
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + (shipmentDetails.delivery_max || 7));

        // Step 6: Update order in database
        const orderRecord = await Order.findByPk(orderId);
        if (!orderRecord) {
            return res.status(404).json({ error: 'Order not found' });
        }

        await orderRecord.update({
            shipping: {
                ...(orderRecord.shipping || {}),
                melhorEnvioId,
                trackingCode,
                correiosTracking, // Correios code (can be null)
                melhorEnvioProtocol: shipmentDetails.protocol, // Melhor Envio ID
                hasCorreiosCode,
                labelUrl,
                labelCreatedAt: new Date(),
                deliveryMin: shipmentDetails.delivery_min,
                deliveryMax: shipmentDetails.delivery_max,
                estimatedDelivery: deliveryDate
            },
            status: 'processing'
        });

        logger.info('✅ Order updated with shipping info');

        // Step 7: Send shipping notification email ONLY if we have Correios tracking code
        try {
            if (hasCorreiosCode) {
                await sendShippingNotification(order, correiosTracking, deliveryDate);
                logger.info('📧 Shipping notification email sent with Correios tracking');
            } else {
                logger.info('⚠️ Skipping email - no Correios tracking code yet');
                logger.info('   Admin can manually update tracking code later');
            }
        } catch (emailError) {
            logger.error('❌ Error sending shipping email:', emailError);
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
        logger.error('❌ Error creating shipping label:', error);
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

        logger.info('🚚 Requesting pickup for order:', orderId);

        // Request pickup
        const pickupResult = await requestPickup([melhorEnvioId]);

        logger.info('✅ Pickup requested:', pickupResult);

        // Update order status
        const orderRecord = await Order.findByPk(orderId);
        if (!orderRecord) {
            return res.status(404).json({ error: 'Order not found' });
        }

        await orderRecord.update({
            shipping: {
                ...(orderRecord.shipping || {}),
                pickupScheduled: true,
                pickupDate: new Date()
            },
            status: 'shipped'
        });

        // Send shipping notification email
        try {
            await sendOrderStatusUpdate(order, 'shipped');
            logger.info('📧 Shipping notification email sent');
        } catch (emailError) {
            logger.error('❌ Error sending shipping email:', emailError);
        }

        res.json({
            success: true,
            message: 'Coleta solicitada com sucesso',
            pickupResult
        });

    } catch (error) {
        logger.error('❌ Error requesting pickup:', error);
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

        logger.info('📍 Getting tracking info for:', trackingCode);

        const trackingInfo = await getTrackingInfo(trackingCode);

        res.json({
            success: true,
            trackingCode,
            trackingInfo
        });

    } catch (error) {
        logger.error('❌ Error getting tracking info:', error);
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
        logger.error('❌ Error getting label:', error);
        res.status(500).json({
            error: 'Failed to get label',
            message: error.message
        });
    }
});

export default router;
