import { initializeFirebase, getFirestore, updateOrderStatus } from './services/firebaseService.js';

// Initialize Firebase first
initializeFirebase();

async function fixOrderStatus() {
    try {
        const db = getFirestore();
        const paymentId = '138109011235';

        console.log('🔍 Searching for order with payment ID:', paymentId);

        // Try as string first
        let ordersSnapshot = await db.collection('orders')
            .where('payment.paymentId', '==', String(paymentId))
            .limit(1)
            .get();

        // If not found as string, try as number
        if (ordersSnapshot.empty) {
            console.log('🔄 Trying as number...');
            ordersSnapshot = await db.collection('orders')
                .where('payment.paymentId', '==', Number(paymentId))
                .limit(1)
                .get();
        }

        if (ordersSnapshot.empty) {
            console.log('❌ Order not found with payment ID:', paymentId);
            return;
        }

        const orderDoc = ordersSnapshot.docs[0];
        const orderId = orderDoc.id;
        const orderData = orderDoc.data();

        console.log('📦 Order found:', {
            id: orderId,
            orderNumber: orderData.orderNumber,
            currentStatus: orderData.status,
            paymentId: orderData.payment?.paymentId
        });

        if (orderData.status === 'paid') {
            console.log('✅ Order is already marked as paid!');
            return;
        }

        console.log('🔄 Updating order status to "paid"...');
        await updateOrderStatus(orderId, 'paid');

        console.log('✅ Order status updated successfully!');
        console.log('📧 Email notification should have been sent to customer.');

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

fixOrderStatus();
