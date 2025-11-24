import express from 'express';
import {
    createPixPayment,
    createBoletoPayment,
    processCreditCardPayment,
    getPaymentStatus
} from '../services/mercadoPagoService.js';
import {
    createOrder as createOrderInFirestore,
    updateOrderPayment,
    getOrderById
} from '../services/firebaseService.js';
import { sendOrderConfirmation } from '../services/emailService.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Generate unique order number
const generateOrderNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `HD-${year}-${random}`;
};

// Create PIX payment
router.post('/pix', optionalAuth, async (req, res, next) => {
    try {
        const orderData = req.body;

        // Generate order number if not provided
        if (!orderData.orderNumber) {
            orderData.orderNumber = generateOrderNumber();
        }

        // Create order in Firestore first
        const order = await createOrderInFirestore({
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
router.post('/boleto', optionalAuth, async (req, res, next) => {
    try {
        const orderData = req.body;

        if (!orderData.orderNumber) {
            orderData.orderNumber = generateOrderNumber();
        }

        // Create order in Firestore
        const order = await createOrderInFirestore({
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
router.post('/credit-card', optionalAuth, async (req, res, next) => {
    try {
        const { orderData, cardToken } = req.body;

        if (!orderData.orderNumber) {
            orderData.orderNumber = generateOrderNumber();
        }

        // Create order in Firestore
        const order = await createOrderInFirestore({
            ...orderData,
            userId: req.user?.uid || 'guest',
            userEmail: req.user?.email || orderData.customer.email,
            status: 'pending'
        });

        // Process credit card payment
        const paymentResult = await processCreditCardPayment({
            ...orderData,
            id: order.id,
            orderNumber: order.orderNumber
        }, cardToken);

        // Update order with payment info
        await updateOrderPayment(order.id, {
            method: 'credit_card',
            status: paymentResult.status,
            paymentId: paymentResult.paymentId,
            statusDetail: paymentResult.statusDetail
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

// Get payment status
router.get('/:paymentId/status', async (req, res, next) => {
    try {
        const { paymentId } = req.params;
        const status = await getPaymentStatus(paymentId);

        res.json(status);
    } catch (error) {
        next(error);
    }
});

export default router;
