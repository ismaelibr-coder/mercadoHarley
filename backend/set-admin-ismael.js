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

const setAdminClaim = async () => {
    const email = 'ismael.ibr@gmail.com';

    try {
        console.log(`🔍 Procurando usuário: ${email}...`);

        // Buscar usuário por email
        const user = await auth.getUserByEmail(email);
        console.log(`✅ Usuário encontrado: ${user.uid}`);

        // Definir custom claim de admin
        await auth.setCustomUserClaims(user.uid, { admin: true });
        console.log('✅ Custom claim "admin: true" definido');

        // Atualizar Firestore
        await db.collection('users').doc(user.uid).set({
            email: email,
            displayName: user.displayName || 'Ismael',
            isAdmin: true,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('✅ Perfil atualizado no Firestore');
        console.log(`\n🎉 ${email} agora é ADMIN!`);
        console.log(`\n⚠️  O usuário precisa fazer LOGOUT e LOGIN novamente para as permissões serem aplicadas.`);

        process.exit(0);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.error(`\n❌ Usuário ${email} não encontrado!`);
            console.log(`\n💡 Solução: O usuário precisa primeiro criar uma conta no site.`);
            console.log(`   1. Acesse o site`);
            console.log(`   2. Clique em "Criar Conta"`);
            console.log(`   3. Use o email: ${email}`);
            console.log(`   4. Depois execute este script novamente`);
        } else {
            console.error('❌ Erro:', error);
        }
        process.exit(1);
    }
};

setAdminClaim();
