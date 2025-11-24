import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(
    readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function deleteInvalidOrders() {
    try {
        console.log('🗑️  Deletando pedidos inválidos (com total NaN)...\n');

        const ordersSnapshot = await db.collection('orders').get();
        const batch = db.batch();
        let deletedCount = 0;

        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            if (isNaN(order.total) || !order.total) {
                batch.delete(doc.ref);
                deletedCount++;
                console.log(`  ❌ Deletando pedido ${doc.id} (total: ${order.total})`);
            }
        });

        await batch.commit();
        console.log(`\n✅ ${deletedCount} pedidos inválidos deletados!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao deletar pedidos:', error);
        process.exit(1);
    }
}

deleteInvalidOrders();
