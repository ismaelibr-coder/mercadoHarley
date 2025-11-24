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

async function addStockToProducts() {
    try {
        console.log('🔄 Iniciando migração de estoque...');

        const productsSnapshot = await db.collection('products').get();

        if (productsSnapshot.empty) {
            console.log('⚠️  Nenhum produto encontrado.');
            return;
        }

        const batch = db.batch();
        let count = 0;

        productsSnapshot.forEach(doc => {
            const productData = doc.data();

            // Only add stock if it doesn't exist
            if (productData.stock === undefined || productData.stock === null) {
                batch.update(doc.ref, {
                    stock: 10,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                count++;
                console.log(`✓ Adicionando stock=10 ao produto: ${productData.name || doc.id}`);
            } else {
                console.log(`⏭️  Produto já tem stock: ${productData.name || doc.id} (stock: ${productData.stock})`);
            }
        });

        if (count > 0) {
            await batch.commit();
            console.log(`\n✅ Migração concluída! ${count} produtos atualizados.`);
        } else {
            console.log('\n✅ Nenhum produto precisou ser atualizado.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        process.exit(1);
    }
}

addStockToProducts();
