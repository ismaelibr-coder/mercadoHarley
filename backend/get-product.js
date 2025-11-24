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

async function getFirstProduct() {
    try {
        const db = admin.firestore();
        const snapshot = await db.collection('products').limit(1).get();

        if (snapshot.empty) {
            console.log('No products found');
            return;
        }

        const product = snapshot.docs[0];
        console.log('First product:', {
            id: product.id,
            ...product.data()
        });
    } catch (error) {
        console.error('Error:', error);
    }
    process.exit(0);
}

getFirstProduct();
