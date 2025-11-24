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

async function resetAdminUser() {
    const email = 'admin@mercadoharley.com';
    const password = '123456';
    const displayName = 'Admin Mercado Harley';

    try {
        console.log('🔄 Resetando usuário admin...\n');

        // Step 1: Try to delete existing user
        try {
            const existingUser = await auth.getUserByEmail(email);
            await auth.deleteUser(existingUser.uid);
            console.log(`✓ Usuário deletado do Authentication: ${email}`);

            // Delete from Firestore
            await db.collection('users').doc(existingUser.uid).delete();
            console.log(`✓ Usuário deletado do Firestore: ${email}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log(`ℹ️  Usuário não existia: ${email}`);
            } else {
                throw error;
            }
        }

        // Step 2: Create new user
        const newUser = await auth.createUser({
            email: email,
            password: password,
            displayName: displayName,
            emailVerified: true
        });
        console.log(`✓ Novo usuário criado: ${email}`);

        // Step 3: Set admin role in Firestore
        await db.collection('users').doc(newUser.uid).set({
            email: email,
            displayName: displayName,
            isAdmin: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✓ Permissão de admin definida`);

        console.log(`\n✅ Usuário admin resetado com sucesso!`);
        console.log(`╔════════════════════════════════════╗`);
        console.log(`║  Email: ${email.padEnd(20)} ║`);
        console.log(`║  Senha: ${password.padEnd(20)} ║`);
        console.log(`║  Admin: true${' '.repeat(19)} ║`);
        console.log(`╚════════════════════════════════════╝`);

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Erro ao resetar usuário admin:', error);
        process.exit(1);
    }
}

resetAdminUser();
