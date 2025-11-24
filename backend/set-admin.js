
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
    readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json', 'utf8')
);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();
const auth = admin.auth();

const setAdmin = async (email) => {
    try {
        console.log(`Looking for user with email: ${email}`);
        const user = await auth.getUserByEmail(email);

        console.log(`Found user: ${user.uid}`);

        // Update Custom Claims
        await auth.setCustomUserClaims(user.uid, { admin: true });
        console.log('✅ Custom claims updated');

        // Update Firestore
        await db.collection('users').doc(user.uid).set({
            isAdmin: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('✅ Firestore profile updated');
        console.log(`🎉 User ${email} is now an ADMIN!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

const email = process.argv[2];
if (!email) {
    console.error('Please provide an email address');
    process.exit(1);
}

setAdmin(email);
