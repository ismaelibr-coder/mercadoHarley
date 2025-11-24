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

async function checkUser() {
    try {
        const email = 'ismael.ibr@gmail.com';
        console.log(`Checking user: ${email}`);
        const user = await admin.auth().getUserByEmail(email);
        console.log('User found:', user.uid);
    } catch (error) {
        console.error('Error:', error.code, error.message);
    }
}

checkUser();
