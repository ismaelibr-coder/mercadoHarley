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

async function createTestOrders() {
    try {
        console.log('🔄 Criando pedidos de teste...\n');

        // Get some products
        const productsSnapshot = await db.collection('products').limit(5).get();
        const products = [];
        productsSnapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        if (products.length === 0) {
            console.log('❌ Nenhum produto encontrado. Adicione produtos primeiro.');
            process.exit(1);
        }

        // Create 10 test orders over the last 30 days
        const orders = [];
        const now = new Date();

        for (let i = 0; i < 10; i++) {
            // Random date in the last 30 days
            const daysAgo = Math.floor(Math.random() * 30);
            const orderDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

            // Random products (1-3 items)
            const itemCount = Math.floor(Math.random() * 3) + 1;
            const orderItems = [];
            let subtotal = 0;

            for (let j = 0; j < itemCount; j++) {
                const product = products[Math.floor(Math.random() * products.length)];
                const quantity = Math.floor(Math.random() * 3) + 1;
                const price = parseFloat(product.price) || 100; // Default price if invalid
                const itemTotal = price * quantity;

                orderItems.push({
                    id: product.id,
                    name: product.name,
                    price: price,
                    quantity: quantity,
                    image: product.image
                });

                subtotal += itemTotal;
            }

            const shipping = 25.00;
            const total = subtotal + shipping;

            const order = {
                userId: 'test-user-' + i,
                items: orderItems,
                subtotal: subtotal,
                shipping: shipping,
                total: total,
                status: Math.random() > 0.3 ? 'completed' : 'pending',
                shippingAddress: {
                    street: 'Rua Teste',
                    number: '123',
                    city: 'São Paulo',
                    state: 'SP',
                    zipCode: '01310-100'
                },
                createdAt: admin.firestore.Timestamp.fromDate(orderDate),
                updatedAt: admin.firestore.Timestamp.fromDate(orderDate)
            };

            orders.push(order);
        }

        // Save orders to Firestore
        const batch = db.batch();
        orders.forEach(order => {
            const orderRef = db.collection('orders').doc();
            batch.set(orderRef, order);
        });

        await batch.commit();

        console.log(`✅ ${orders.length} pedidos de teste criados com sucesso!`);
        console.log('\n📊 Resumo:');
        console.log(`   Total de vendas: R$ ${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}`);
        console.log(`   Pedidos completos: ${orders.filter(o => o.status === 'completed').length}`);
        console.log(`   Pedidos pendentes: ${orders.filter(o => o.status === 'pending').length}`);
        console.log('\n✓ Acesse o dashboard admin para ver os dados!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar pedidos:', error);
        process.exit(1);
    }
}

createTestOrders();
