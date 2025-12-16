
import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('./firebase-service-account.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "mercado-harley.appspot.com"
    });
}

const db = admin.firestore();

const PARTNERS = [
    'Pavilhão Acessorios',
    '20W50',
    'Dilemburg Peças',
    'Torbal',
    'Wings Custom'
];

const PART_TYPES = [
    'Guidão', 'Escapamento', 'Banco', 'Rodas', 'Pneus',
    'Iluminação', 'Filtro de Ar', 'Motor', 'Freios', 'Suspensão'
];

const CATEGORIES = ['Peças', 'Acessórios', 'Vestuário'];

const CONDITIONS = ['Novo', 'Usado'];

const SAMPLE_PRODUCTS = [
    { name: 'Guidão Diablo 12"', price: 850.00, weight: 3.5 },
    { name: 'Ponteira Torbal Short Shots', price: 2100.00, weight: 6.0 },
    { name: 'Banco Solo Diamond', price: 1200.00, weight: 2.0 },
    { name: 'Filtro de Ar Esportivo', price: 450.00, weight: 1.0 },
    { name: 'Manopla Billet', price: 280.00, weight: 0.5 },
    { name: 'Farol LED 7"', price: 650.00, weight: 1.2 },
    { name: 'Alforge Lateral Couro', price: 1500.00, weight: 4.0 },
    { name: 'Amortecedor Progressive', price: 3200.00, weight: 5.5 },
    { name: 'Pneu Faixa Branca', price: 1800.00, weight: 7.0 },
    { name: 'Kit Comando Avançado', price: 2500.00, weight: 4.5 }
];

const seedProducts = async () => {
    console.log('Iniciando população de dados...');

    try {
        const batch = db.batch();
        const collectionRef = db.collection('products');

        // Create 20 sample products
        for (let i = 0; i < 20; i++) {
            const docRef = collectionRef.doc();
            const template = SAMPLE_PRODUCTS[i % SAMPLE_PRODUCTS.length];
            const partner = PARTNERS[Math.floor(Math.random() * PARTNERS.length)];
            const partType = PART_TYPES[Math.floor(Math.random() * PART_TYPES.length)];
            const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
            const condition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)];

            // Randomize price slightly
            const price = template.price * (0.8 + Math.random() * 0.4); // +/- 20%
            const profitMargin = 15 + Math.floor(Math.random() * 25); // 15-40%

            const product = {
                name: `${template.name} - ${partner}`,
                description: `Produto de alta qualidade da marca ${partner}. Ideal para customização.`,
                price: parseFloat(price.toFixed(2)),
                image: 'https://via.placeholder.com/400x400.png?text=SICK+GRIP+Product', // Placeholder
                category,
                condition,
                partType,
                partner,
                profitMargin,
                stock: 5 + Math.floor(Math.random() * 20),
                rating: 3 + Math.floor(Math.random() * 3),
                dimensions: {
                    weight: template.weight,
                    height: 20,
                    width: 30,
                    length: 40
                },
                specs: ['Alta Durabilidade', 'Acabamento Premium', 'Fácil Instalação'],
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            };

            batch.set(docRef, product);
        }

        await batch.commit();
        console.log('✅ 20 produtos inseridos com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro ao popular dados:', error);
        process.exit(1);
    }
};

seedProducts();
