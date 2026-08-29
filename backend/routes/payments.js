import express from 'express';
import logger from '../utils/logger.js';
import {
    createPixPayment,
    createBoletoPayment,
    processCreditCardPayment,
    getPaymentStatus
} from '../services/mercadoPagoService.js';
import {
    updateOrderPayment,
    getOrderById,
    findOrderByPaymentId
} from '../services/dbService.js';
import { createPendingOrder } from '../services/orderCalculationService.js';
import { sendOrderConfirmation } from '../services/emailService.js';
import { optionalAuth, authenticate } from '../middleware/auth.js';
import { validateOrder, validateCreditCardPayment } from '../middleware/validation.js';

const router = express.Router();

// Create PIX payment
router.post('/pix', optionalAuth, validateOrder, async (req, res, next) => {
    try {
        let orderData = req.body;

        // Assigns orderNumber, recomputes subtotal/discount/total/shipping server-side
        // from real product prices (never trusts what the client sent), and persists
        // the pending order.
        // Guest checkout (no logged-in user): userId must be null, not the literal
        // string 'guest' — orders.userId has a FK to users.id (ON DELETE SET NULL,
        // i.e. nullable by design), and 'guest' is not a real user row, so every
        // guest order was failing with a foreign-key-constraint error before ever
        // reaching Mercado Pago. Confirmed in production: 0 guest orders exist.
        const created = await createPendingOrder(orderData, {
            paymentMethod: 'pix',
            userId: req.user?.uid || null,
            userEmail: req.user?.email || orderData.customer.email
        });
        const order = created.order;
        orderData = created.orderData;

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
        let orderData = req.body;

        const created = await createPendingOrder(orderData, {
            paymentMethod: 'boleto',
            userId: req.user?.uid || null,
            userEmail: req.user?.email || orderData.customer.email
        });
        const order = created.order;
        orderData = created.orderData;

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
        let { orderData, cardToken, installments = 1, paymentMethodId } = req.body;

        if (!cardToken) {
            return res.status(400).json({ error: 'Token do cartão é obrigatório' });
        }

        if (!paymentMethodId) {
            return res.status(400).json({ error: 'Método de pagamento é obrigatório' });
        }

        const created = await createPendingOrder(orderData, {
            paymentMethod: 'credit_card',
            userId: req.user?.uid || null,
            userEmail: req.user?.email || orderData.customer.email
        });
        const order = created.order;
        orderData = created.orderData;

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
