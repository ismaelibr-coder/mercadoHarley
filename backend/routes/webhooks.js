import express from 'express';
import { updateOrderStatus, getOrderById } from '../services/firebaseService.js';
import { getPaymentStatus } from '../services/mercadoPagoService.js';

const router = express.Router();

// Mercado Pago webhook
router.post('/mercadopago', async (req, res) => {
    try {
        console.log('📥 Webhook received:', req.body);

        const { type, data } = req.body;

        // Mercado Pago sends payment notifications
        if (type === 'payment') {
            const paymentId = data.id;

            // Get payment details from Mercado Pago
            const paymentStatus = await getPaymentStatus(paymentId);
            console.log('💳 Payment status:', paymentStatus);

            // Find order by payment ID (you might need to query Firestore)
            // For now, we'll get the order ID from metadata
            // In production, you should query orders collection

            // Update order status based on payment status
            if (paymentStatus.status === 'approved') {
                console.log('✅ Payment approved, updating order status');
                // await updateOrderStatus(orderId, 'paid');
            } else if (paymentStatus.status === 'rejected') {
                console.log('❌ Payment rejected');
                // await updateOrderStatus(orderId, 'cancelled');
            }
        }

        // Always respond 200 to acknowledge receipt
        res.sendStatus(200);
    } catch (error) {
        console.error('❌ Webhook error:', error);
        // Still respond 200 to prevent retries
        res.sendStatus(200);
    }
});

export default router;
