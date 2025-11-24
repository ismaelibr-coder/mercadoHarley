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

async function checkOrders() {
    try {
        console.log('🔍 Verificando pedidos no Firestore...\n');

        const ordersSnapshot = await db.collection('orders').get();

        console.log(`📦 Total de pedidos: ${ordersSnapshot.size}`);

        if (ordersSnapshot.size === 0) {
            console.log('❌ Nenhum pedido encontrado!');
            process.exit(1);
        }

        let totalSales = 0;
        let completedOrders = 0;
        let pendingOrders = 0;

        ordersSnapshot.forEach(doc => {
            const order = doc.data();
            console.log(`\nPedido ID: ${doc.id}`);
            console.log(`  Status: ${order.status}`);
            console.log(`  Total: R$ ${order.total?.toFixed(2) || 'N/A'}`);
            console.log(`  Data: ${order.createdAt?.toDate().toLocaleDateString('pt-BR') || 'N/A'}`);
            console.log(`  Itens: ${order.items?.length || 0}`);

            if (order.status === 'completed') {
                completedOrders++;
                totalSales += order.total || 0;
            } else if (order.status === 'pending') {
                pendingOrders++;
            }
        });

        console.log(`\n📊 Resumo:`);
        console.log(`   Total de vendas (completos): R$ ${totalSales.toFixed(2)}`);
        console.log(`   Pedidos completos: ${completedOrders}`);
        console.log(`   Pedidos pendentes: ${pendingOrders}`);
        console.log(`   Ticket médio: R$ ${(totalSales / completedOrders).toFixed(2)}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao verificar pedidos:', error);
        process.exit(1);
    }
}

checkOrders();
