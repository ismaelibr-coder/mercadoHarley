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

async function testGetBanners() {
    try {
        console.log('🔍 Testing getActiveBanners...\n');

        const bannersSnapshot = await db.collection('banners')
            .where('active', '==', true)
            .get();

        const banners = [];
        bannersSnapshot.forEach(doc => {
            banners.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log(`📦 Found ${banners.length} active banners`);

        if (banners.length > 0) {
            console.log('First banner:', banners[0]);
        }

        // Test sorting
        const sortedBanners = banners.sort((a, b) => (a.order || 0) - (b.order || 0));
        console.log('✅ Sorted banners count:', sortedBanners.length);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error getting banners:', error);
        process.exit(1);
    }
}

testGetBanners();
