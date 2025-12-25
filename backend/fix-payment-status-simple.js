import { initializeFirebase, getFirestore } from './services/firebaseService.js';

// Initialize Firebase first
initializeFirebase();

async function fixPaymentStatus() {
    try {
        const orderId = 'DlFU2U1QfWlzR6z2lDK3'; // Order ID from screenshot
        const db = getFirestore();

        console.log('🔍 Fetching order:', orderId);

        const orderDoc = await db.collection('orders').doc(orderId).get();

        if (!orderDoc.exists) {
            console.log('❌ Order not found');
            return;
        }

        const order = { id: orderDoc.id, ...orderDoc.data() };

        console.log('📦 Current order status:', {
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.payment?.status,
            paymentMethod: order.payment?.method
        });

        // Update payment status to Portuguese
        const updateData = {};

        // Fix payment status
        if (order.payment?.status === 'pending') {
            console.log('🔄 Updating payment status from "pending" to "approved"...');
            updateData['payment.status'] = 'approved';
        }

        // Fix order status
        if (order.status === 'pending') {
            console.log('🔄 Updating order status from "pending" to "paid"...');
            updateData['status'] = 'paid';
        }

        if (Object.keys(updateData).length > 0) {
            console.log('💾 Applying updates:', updateData);
            await db.collection('orders').doc(orderId).update(updateData);
            console.log('✅ Order updated successfully!');
        } else {
            console.log('ℹ️ No updates needed');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

fixPaymentStatus();
