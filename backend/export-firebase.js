import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync('firebase-service-account.json', 'utf8'));

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL || ''
});

const db = admin.firestore();

/**
 * Export all Firestore collections to JSON files
 */
async function exportFirebaseData() {
    console.log('🔄 Iniciando exportação de dados do Firebase...\n');

    const collections = ['users', 'products', 'orders', 'banners', 'shippingRules', 'auditLogs'];
    const exportDir = './firebase-export';

    // Create export directory if it doesn't exist
    if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
    }

    for (const collectionName of collections) {
        try {
            console.log(`📦 Exportando ${collectionName}...`);
            const snapshot = await db.collection(collectionName).get();
            
            const data = [];
            snapshot.forEach(doc => {
                data.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            const fileName = path.join(exportDir, `${collectionName}.json`);
            fs.writeFileSync(fileName, JSON.stringify(data, null, 2));
            
            console.log(`   ✅ ${data.length} registros exportados para ${fileName}\n`);
        } catch (error) {
            console.error(`   ❌ Erro ao exportar ${collectionName}:`, error);
        }
    }

    console.log('✨ Exportação concluída!');
    console.log(`📁 Arquivos salvos em: ${path.resolve(exportDir)}`);
    
    // Export summary
    console.log('\n📊 RESUMO DA EXPORTAÇÃO:');
    console.log('=====================');
    
    for (const collectionName of collections) {
        const fileName = path.join(exportDir, `${collectionName}.json`);
        if (fs.existsSync(fileName)) {
            const content = JSON.parse(fs.readFileSync(fileName, 'utf8'));
            console.log(`${collectionName}: ${content.length} registros`);
        }
    }

    process.exit(0);
}

// Run export
exportFirebaseData().catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
});
