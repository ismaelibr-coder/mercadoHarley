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

const db = admin.firestore();

const banners = [
    {
        title: 'Custom Choppers',
        image: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1920&q=80',
        link: {
            type: 'category',
            value: 'Peças'
        },
        order: 1,
        active: true
    },
    {
        title: 'Estilo & Liberdade',
        image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c3d?auto=format&fit=crop&w=1920&q=80',
        link: {
            type: 'category',
            value: 'Vestuário'
        },
        order: 2,
        active: true
    },
    {
        title: 'Aventura na Estrada',
        image: 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?auto=format&fit=crop&w=1920&q=80',
        link: {
            type: 'category',
            value: 'Acessórios'
        },
        order: 3,
        active: true
    },
    {
        title: 'Mercado Harley',
        image: 'https://images.unsplash.com/photo-1615172282427-9a5752d64b57?auto=format&fit=crop&w=1920&q=80',
        link: {
            type: 'external',
            value: 'https://mercadoharley.com.br'
        },
        order: 0,
        active: true
    }
];

async function seedBanners() {
    try {
        console.log('🚀 Seeding banners...\n');

        const batch = db.batch();
        const collectionRef = db.collection('banners');

        // Delete existing banners first (optional, but good for clean state)
        const snapshot = await collectionRef.get();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Add new banners
        banners.forEach(banner => {
            const docRef = collectionRef.doc();
            batch.set(docRef, {
                ...banner,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`  ➕ Adicionando banner: ${banner.title}`);
        });

        await batch.commit();
        console.log('\n✅ Banners criados com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao criar banners:', error);
        process.exit(1);
    }
}

seedBanners();
