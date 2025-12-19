import express from 'express';
import { updateOrderStatus, getOrderById, getFirestore } from '../services/firebaseService.js';
import { getPaymentStatus } from '../services/mercadoPagoService.js';

const router = express.Router();

// Helper function to find order by payment ID
async function findOrderByPaymentId(paymentId) {
    const db = getFirestore();
    const ordersSnapshot = await db.collection('orders')
        .where('payment.paymentId', '==', paymentId)
        .limit(1)
        .get();

    if (ordersSnapshot.empty) {
        return null;
    }

    return {
        id: ordersSnapshot.docs[0].id,
        ...ordersSnapshot.docs[0].data()
    };
}

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

            // Find order by payment ID
            const order = await findOrderByPaymentId(paymentId);

            if (!order) {
                console.log('⚠️ Order not found for payment ID:', paymentId);
                return res.sendStatus(200);
            }

            console.log('📦 Order found:', order.id);

            // Update order status based on payment status
            if (paymentStatus.status === 'approved') {
                console.log('✅ Payment approved, updating order status to paid');
                await updateOrderStatus(order.id, 'paid');
            } else if (paymentStatus.status === 'rejected') {
                console.log('❌ Payment rejected, updating order status to cancelled');
                await updateOrderStatus(order.id, 'cancelled');
            } else if (paymentStatus.status === 'pending') {
                console.log('⏳ Payment pending');
                // Status remains 'pending'
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
