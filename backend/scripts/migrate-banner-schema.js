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

async function migrateBannersToNewSchema() {
    try {
        const bannersSnapshot = await db.collection('banners').get();

        if (bannersSnapshot.empty) {
            console.log('No banners found to migrate.');
            process.exit(0);
        }

        console.log(`Found ${bannersSnapshot.size} banners to migrate...`);

        const batch = db.batch();
        let count = 0;

        bannersSnapshot.forEach(doc => {
            const data = doc.data();

            // Only update if displayType doesn't exist
            if (!data.displayType) {
                batch.update(doc.ref, {
                    displayType: 'carousel', // Default to carousel
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                count++;
            }
        });

        if (count > 0) {
            await batch.commit();
            console.log(`✅ Successfully migrated ${count} banners to new schema`);
            console.log('   All banners now have displayType field (default: carousel)');
        } else {
            console.log('✅ All banners already have displayType field');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error migrating banners:', error);
        process.exit(1);
    }
}

migrateBannersToNewSchema();
