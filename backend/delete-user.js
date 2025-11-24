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

async function deleteUser() {
    try {
        const email = 'ismael.ibr@gmail.com';
        console.log(`Searching for user: ${email}`);

        const user = await admin.auth().getUserByEmail(email);
        console.log(`Found user: ${user.uid}`);

        await admin.auth().deleteUser(user.uid);
        console.log('✅ User deleted successfully');

        // Also delete from Firestore
        await admin.firestore().collection('users').doc(user.uid).delete();
        console.log('✅ User document deleted from Firestore');

    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.log('ℹ️ User not found (already deleted or never existed)');
        } else {
            console.error('Error:', error.code, error.message);
        }
    }
    process.exit(0);
}

deleteUser();
