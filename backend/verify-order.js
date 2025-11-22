import { initializeFirebase, getFirestore } from './services/firebaseService.js';
import dotenv from 'dotenv';

dotenv.config();

const verifyOrder = async () => {
    try {
        initializeFirebase();
        const db = getFirestore();

        console.log('Checking for recent orders...');
        const snapshot = await db.collection('orders')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.log('❌ No orders found.');
            return;
        }

        const order = snapshot.docs[0].data();
        console.log('✅ Most recent order found:');
        console.log('ID:', snapshot.docs[0].id);
        console.log('Order Number:', order.orderNumber);
        console.log('Customer:', order.customer.name);
        console.log('Total:', order.total);
        console.log('Payment Method:', order.payment?.method);
        console.log('Status:', order.status);
        console.log('Created At:', order.createdAt.toDate());

    } catch (error) {
        console.error('❌ Error verifying order:', error);
    }
};

verifyOrder();
