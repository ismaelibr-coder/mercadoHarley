import { initializeFirebase, getFirestore } from './services/firebaseService.js';

// Initialize Firebase first
initializeFirebase();

async function checkOrderShipping() {
    try {
        const orderId = 'DlFU2U1QfWlzR6z2lDK3';
        const db = getFirestore();

        console.log('🔍 Fetching order:', orderId);

        const orderDoc = await db.collection('orders').doc(orderId).get();

        if (!orderDoc.exists) {
            console.log('❌ Order not found');
            return;
        }

        const order = { id: orderDoc.id, ...orderDoc.data() };

        console.log('\n📦 Order Details:');
        console.log('   Order Number:', order.orderNumber);
        console.log('   Status:', order.status);
        console.log('   Payment Status:', order.payment?.status);

        console.log('\n📮 Shipping Details:');
        console.log('   Melhor Envio ID:', order.shipping?.melhorEnvioId);
        console.log('   Tracking Code:', order.shipping?.trackingCode);
        console.log('   Correios Tracking:', order.shipping?.correiosTracking);
        console.log('   Melhor Envio Protocol:', order.shipping?.melhorEnvioProtocol);
        console.log('   Has Correios Code:', order.shipping?.hasCorreiosCode);
        console.log('   Label URL:', order.shipping?.labelUrl);
        console.log('   Label Created At:', order.shipping?.labelCreatedAt?.toDate());
        console.log('   Estimated Delivery:', order.shipping?.estimatedDelivery?.toDate());
        console.log('   Email Sent:', order.shipping?.emailSent);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkOrderShipping();
