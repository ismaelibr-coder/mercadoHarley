import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import { sendOrderStatusUpdate } from './services/emailService.js';

dotenv.config();

const serviceAccount = JSON.parse(
    readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

async function testStatusUpdate() {
    try {
        const orderId = 'Facw5DbjVatRuzz2Xw5U';
        const newStatus = 'shipped';

        console.log(`📦 Updating order ${orderId} to status: ${newStatus}...\n`);

        const db = admin.firestore();

        // Get order first
        const orderDoc = await db.collection('orders').doc(orderId).get();
        if (!orderDoc.exists) {
            throw new Error('Order not found');
        }

        const orderData = { id: orderDoc.id, ...orderDoc.data() };
        console.log('Order found:', orderData.customer.email);

        // Update status
        await db.collection('orders').doc(orderId).update({
            status: newStatus,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            shippedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Status updated in Firestore');

        // Send email
        const emailResult = await sendOrderStatusUpdate({ ...orderData, status: newStatus });

        if (emailResult.success) {
            console.log('✅ Status update email sent successfully!');
            console.log('📧 Check your email for status update notification!');
        } else {
            console.log('❌ Failed to send email:', emailResult.error);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    process.exit(0);
}

testStatusUpdate();
