import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const serviceAccount = JSON.parse(
    readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createDefaultShippingRule() {
    try {
        // Create default shipping rule
        const shippingRule = {
            name: 'Frete Padrão Brasil',
            type: 'fixed',
            basePrice: 15.00,
            freeShippingThreshold: 200.00,
            enabled: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('shippingRules').add(shippingRule);
        console.log('✅ Default shipping rule created with ID:', docRef.id);
        console.log('   Base price: R$ 15.00');
        console.log('   Free shipping threshold: R$ 200.00');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating shipping rule:', error);
        process.exit(1);
    }
}

createDefaultShippingRule();
