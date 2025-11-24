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

const auth = admin.auth();

async function createLongNameUser() {
    const email = 'longname@test.com';
    const password = 'password123';
    const displayName = 'Pedro de Alcântara João Carlos Leopoldo Salvador Bibiano Francisco Xavier de Paula Leocádio Miguel Gabriel Rafael Gonzaga';

    try {
        // Check if user exists
        try {
            const user = await auth.getUserByEmail(email);
            await auth.deleteUser(user.uid);
            console.log('Deleted existing user');
        } catch (e) {
            // User doesn't exist, ignore
        }

        const user = await auth.createUser({
            email,
            password,
            displayName
        });

        console.log(`Created user: ${user.email} with long name`);
        process.exit(0);
    } catch (error) {
        console.error('Error creating user:', error);
        process.exit(1);
    }
}

createLongNameUser();
