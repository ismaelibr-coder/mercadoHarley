import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
    readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')
);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

// Map of product names to new images
const imageUpdates = {
    // Generated Images (Local)
    'Jaqueta de Couro Harley-Davidson': '/products/jacket.png',
    'Capacete Harley-Davidson Vintage': '/products/helmet.png',
    'Luvas de Couro Premium': '/products/gloves.png',
    'Botas Harley-Davidson Engineer': '/products/boots.png',
    'Camiseta Harley-Davidson Classic': '/products/tshirt.png',
    'Óculos de Sol Aviador': '/products/sunglasses.png',

    // Unsplash Images (High Quality)
    'Banco Solo Diamond Stitch': 'https://images.unsplash.com/photo-1558981806-ec527fa84f3d?q=80&w=2070&auto=format&fit=crop', // Motorcycle seat detail
    'Farol LED Daymaker': 'https://images.unsplash.com/photo-1480936600919-bffa6b7ecf1e?q=80&w=2071&auto=format&fit=crop', // Motorcycle headlight
    'Filtro de Ar Esportivo': 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?q=80&w=2070&auto=format&fit=crop', // Engine detail
    'Escapamento Vance & Hines Shortshots': 'https://images.unsplash.com/photo-1558981359-219d6364c969?q=80&w=2070&auto=format&fit=crop', // Exhaust detail
    'Guidão Ape Hanger 14"': 'https://images.unsplash.com/photo-1558980664-3a031cf67ea8?q=80&w=2070&auto=format&fit=crop', // Handlebars
    'Alforges de Couro Legítimo': 'https://images.unsplash.com/photo-1558981852-426c6c22a060?q=80&w=2070&auto=format&fit=crop' // Saddlebags/Leather detail
};

async function updateImages() {
    try {
        console.log('🔄 Atualizando imagens dos produtos...\n');

        const snapshot = await db.collection('products').get();

        if (snapshot.empty) {
            console.log('Nenhum produto encontrado.');
            return;
        }

        let updatedCount = 0;

        for (const doc of snapshot.docs) {
            const product = doc.data();
            const newImage = imageUpdates[product.name];

            if (newImage) {
                await doc.ref.update({ image: newImage });
                console.log(`✅ ${product.name} -> Imagem atualizada!`);
                updatedCount++;
            } else {
                console.log(`⚠️ ${product.name} -> Nenhuma imagem nova definida.`);
            }
        }

        console.log(`\n🎉 ${updatedCount} produtos atualizados com sucesso!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

updateImages();
