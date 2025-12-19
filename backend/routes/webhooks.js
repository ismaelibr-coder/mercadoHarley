import express from 'express';
import { updateOrderStatus, getOrderById, getFirestore } from '../services/firebaseService.js';
import { getPaymentStatus } from '../services/mercadoPagoService.js';

const router = express.Router();

// Helper function to find order by payment ID
async function findOrderByPaymentId(paymentId) {
    const db = getFirestore();

    console.log('🔍 Searching for order with payment ID:', paymentId, 'Type:', typeof paymentId);

    // Try as string first
    let ordersSnapshot = await db.collection('orders')
        .where('payment.paymentId', '==', String(paymentId))
        .limit(1)
        .get();

    console.log('📊 Query results (as string):', {
        empty: ordersSnapshot.empty,
        size: ordersSnapshot.size
    });

    // If not found as string, try as number
    if (ordersSnapshot.empty) {
        console.log('🔄 Trying as number...');
        ordersSnapshot = await db.collection('orders')
            .where('payment.paymentId', '==', Number(paymentId))
            .limit(1)
            .get();

        console.log('📊 Query results (as number):', {
            empty: ordersSnapshot.empty,
            size: ordersSnapshot.size
        });
    }

    if (ordersSnapshot.empty) {
        console.log('⚠️ No order found with payment.paymentId ==', paymentId, '(tried both string and number)');
        return null;
    }

    const orderData = {
        id: ordersSnapshot.docs[0].id,
        ...ordersSnapshot.docs[0].data()
    };

    console.log('📦 Order found:', {
        id: orderData.id,
        orderNumber: orderData.orderNumber,
        paymentId: orderData.payment?.paymentId,
        paymentIdType: typeof orderData.payment?.paymentId
    });

    return orderData;
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
