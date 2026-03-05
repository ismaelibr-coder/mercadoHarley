import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Load service account
const serviceAccount = JSON.parse(
    readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json', 'utf8')
);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const auth = admin.auth();
const db = admin.firestore();

const admins = [
    { email: 'ismael.ibr@gmail.com', password: '12345678', displayName: 'Ismael' },
    { email: 'pietrogarcez@gmail.com', password: '12345678', displayName: 'Pietro Garcez' }
];

async function createAdmins() {
    for (const u of admins) {
        try {
            console.log(`\nProcessing ${u.email}...`);

            let user;
            try {
                user = await auth.getUserByEmail(u.email);
                console.log(`User exists (${user.uid}) — updating password/displayName...`);
                await auth.updateUser(user.uid, {
                    password: u.password,
                    displayName: u.displayName,
                    emailVerified: true
                });
            } catch (err) {
                if (err.code === 'auth/user-not-found') {
                    console.log('User not found — creating...');
                    user = await auth.createUser({
                        email: u.email,
                        password: u.password,
                        displayName: u.displayName,
                        emailVerified: true
                    });
                    console.log(`Created user ${u.email} -> UID: ${user.uid}`);
                } else {
                    throw err;
                }
            }

            // Set admin custom claim
            await auth.setCustomUserClaims(user.uid, { admin: true });

            // Update Firestore users collection
            await db.collection('users').doc(user.uid).set({
                email: u.email,
                displayName: u.displayName,
                isAdmin: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log(`✅ ${u.email} is now ADMIN (UID: ${user.uid})`);
            console.log(`   Password: ${u.password}`);
        } catch (error) {
            console.error(`❌ Error processing ${u.email}:`, error);
        }
    }

    console.log('\nAll done.');
    process.exit(0);
}

createAdmins();
