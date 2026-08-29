import express from 'express';
import logger from '../utils/logger.js';
import {
    createPixPayment,
    createBoletoPayment,
    processCreditCardPayment,
    getPaymentStatus
} from '../services/mercadoPagoService.js';
import {
    createOrder as createOrderRecord,
    updateOrderPayment,
    getOrderById,
    findOrderByPaymentId
} from '../services/dbService.js';
import { calculateOrderTotal } from '../services/orderCalculationService.js';
import { sendOrderConfirmation } from '../services/emailService.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';
import { validateOrder, validateCreditCardPayment } from '../middleware/validation.js';

const router = express.Router();

// Generate unique order number
const generateOrderNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `HD-${year}-${random}`;
};

// Create PIX payment
router.post('/pix', optionalAuth, validateOrder, async (req, res, next) => {
    try {
        const orderData = req.body;

        // Generate order number if not provided
        if (!orderData.orderNumber) {
            orderData.orderNumber = generateOrderNumber();
        }

        // Recompute subtotal/discount/total server-side from real product prices —
        // never trust the amounts the client sent (price tampering protection).
        const { subtotal, discount, shipping, total, items } = await calculateOrderTotal(orderData.items, {
            shipping: orderData.shipping,
            paymentMethod: 'pix'
        });
        orderData.items = items;
        orderData.subtotal = subtotal;
        orderData.discount = discount;
        orderData.total = total;
        if (orderData.shipping) orderData.shipping.price = shipping;

        // Create order in database first
        const order = await createOrderRecord({
            ...orderData,
            userId: req.user?.uid || 'guest',
            userEmail: req.user?.email || orderData.customer.email,
            status: 'pending'
        });

        // Create PIX payment with Mercado Pago
        const paymentResult = await createPixPayment({
            ...orderData,
            id: order.id,
            orderNumber: order.orderNumber
        });

        // Update order with payment info
        logger.info('💾 Saving payment info to order:', {
            orderId: order.id,
            paymentId: paymentResult.paymentId,
            paymentIdType: typeof paymentResult.paymentId
        });

        await updateOrderPayment(order.id, {
            method: 'pix',
            status: paymentResult.status,
            paymentId: paymentResult.paymentId,
            qrCode: paymentResult.qrCode,
            qrCodeBase64: paymentResult.qrCodeBase64
        });

        res.json({
            success: true,
            orderId: order.id,
            orderNumber: order.orderNumber,
            payment: paymentResult
        });
    } catch (error) {
        next(error);
    }
});

// Create Boleto payment
router.post('/boleto', optionalAuth, validateOrder, async (req, res, next) => {
    try {
        const orderData = req.body;

        if (!orderData.orderNumber) {
            orderData.orderNumber = generateOrderNumber();
        }

        // Recompute subtotal/discount/total server-side from real product prices —
        // never trust the amounts the client sent (price tampering protection).
        const { subtotal, discount, shipping, total, items } = await calculateOrderTotal(orderData.items, {
            shipping: orderData.shipping,
            paymentMethod: 'boleto'
        });
        orderData.items = items;
        orderData.subtotal = subtotal;
        orderData.discount = discount;
        orderData.total = total;
        if (orderData.shipping) orderData.shipping.price = shipping;

        // Create order in database
        const order = await createOrderRecord({
            ...orderData,
            userId: req.user?.uid || 'guest',
            userEmail: req.user?.email || orderData.customer.email,
            status: 'pending'
        });

        // Create Boleto payment
        const paymentResult = await createBoletoPayment({
            ...orderData,
            id: order.id,
            orderNumber: order.orderNumber
        });

        // Update order with payment info
        await updateOrderPayment(order.id, {
            method: 'boleto',
            status: paymentResult.status,
            paymentId: paymentResult.paymentId,
            boletoUrl: paymentResult.boletoUrl,
            barcode: paymentResult.barcode,
            expirationDate: paymentResult.expirationDate
        });

        res.json({
            success: true,
            orderId: order.id,
            orderNumber: order.orderNumber,
            payment: paymentResult
        });
    } catch (error) {
        next(error);
    }
});

// Process credit card payment
router.post('/credit-card', optionalAuth, validateCreditCardPayment, async (req, res, next) => {
    try {
        const { orderData, cardToken, installments = 1, paymentMethodId } = req.body;

        if (!cardToken) {
            return res.status(400).json({ error: 'Token do cartão é obrigatório' });
        }

        if (!paymentMethodId) {
            return res.status(400).json({ error: 'Método de pagamento é obrigatório' });
        }

        if (!orderData.orderNumber) {
            orderData.orderNumber = generateOrderNumber();
        }

        // Recompute subtotal/discount/total server-side from real product prices —
        // never trust the amounts the client sent (price tampering protection).
        const { subtotal, discount, shipping, total, items } = await calculateOrderTotal(orderData.items, {
            shipping: orderData.shipping,
            paymentMethod: 'credit_card'
        });
        orderData.items = items;
        orderData.subtotal = subtotal;
        orderData.discount = discount;
        orderData.total = total;
        if (orderData.shipping) orderData.shipping.price = shipping;

        // Create order in database
        const order = await createOrderRecord({
            ...orderData,
            userId: req.user?.uid || 'guest',
            userEmail: req.user?.email || orderData.customer.email,
            status: 'pending'
        });

        // Process credit card payment with installments
        const paymentResult = await processCreditCardPayment({
            ...orderData,
            id: order.id,
            orderNumber: order.orderNumber
        }, cardToken, installments, paymentMethodId);

        // Update order with payment info
        await updateOrderPayment(order.id, {
            method: 'credit_card',
            status: paymentResult.status,
            paymentId: paymentResult.paymentId,
            statusDetail: paymentResult.statusDetail,
            installments: paymentResult.installments
        });

        // Send confirmation email if approved
        if (paymentResult.status === 'approved') {
            const fullOrder = await getOrderById(order.id);
            await sendOrderConfirmation(fullOrder);
        }

        res.json({
            success: true,
            orderId: order.id,
            orderNumber: order.orderNumber,
            payment: paymentResult
        });
    } catch (error) {
        next(error);
    }
});

// Get payment status — requires auth and ownership so a paymentId can't be
// guessed/enumerated to read a stranger's payment status.
router.get('/:paymentId/status', authenticate, async (req, res, next) => {
    try {
        const { paymentId } = req.params;

        const order = await findOrderByPaymentId(paymentId);
        if (!order) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        if (!req.user.isAdmin && order.userId !== req.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const status = await getPaymentStatus(paymentId);

        res.json(status);
    } catch (error) {
        next(error);
    }
});

export default router;
