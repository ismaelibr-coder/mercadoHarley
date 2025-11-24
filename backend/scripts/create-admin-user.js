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

const auth = admin.auth();
const db = admin.firestore();

async function createAdminUser() {
    const email = 'admin@mercadoharley.com';
    const password = '123456';
    const displayName = 'Admin Mercado Harley';

    try {
        console.log('🔄 Criando usuário admin...');

        // Check if user already exists
        let user;
        try {
            user = await auth.getUserByEmail(email);
            console.log(`✓ Usuário já existe: ${email}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Create user
                user = await auth.createUser({
                    email: email,
                    password: password,
                    displayName: displayName,
                    emailVerified: true
                });
                console.log(`✓ Usuário criado: ${email}`);
            } else {
                throw error;
            }
        }

        // Set admin role in Firestore
        await db.collection('users').doc(user.uid).set({
            email: email,
            displayName: displayName,
            isAdmin: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log(`✓ Permissão de admin definida para: ${email}`);
        console.log(`\n✅ Usuário admin criado com sucesso!`);
        console.log(`   Email: ${email}`);
        console.log(`   Senha: ${password}`);
        console.log(`   Admin: true`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar usuário admin:', error);
        process.exit(1);
    }
}

createAdminUser();
