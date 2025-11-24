
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

const createAdmin = async () => {
    const email = 'admin@mercadoharley.com';
    const password = '123456';
    const displayName = 'Admin Novo';

    try {
        let user;
        try {
            console.log(`Checking if user ${email} exists...`);
            user = await auth.getUserByEmail(email);
            console.log('User already exists. Updating password...');
            await auth.updateUser(user.uid, {
                password: password,
                displayName: displayName
            });
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log('User not found. Creating new user...');
                user = await auth.createUser({
                    email: email,
                    password: password,
                    displayName: displayName
                });
            } else {
                throw error;
            }
        }

        console.log(`User ID: ${user.uid}`);

        // Update Custom Claims
        await auth.setCustomUserClaims(user.uid, { admin: true });
        console.log('✅ Custom claims updated');

        // Update Firestore
        await db.collection('users').doc(user.uid).set({
            email: email,
            displayName: displayName,
            isAdmin: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('✅ Firestore profile updated');
        console.log(`\n🎉 Admin user created successfully!`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

createAdmin();
