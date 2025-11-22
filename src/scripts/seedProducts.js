// One-time script to seed Firestore with initial products
// Run this once to populate the database
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { products } from '../data/products';

export const seedProducts = async () => {
    try {
        console.log('Starting product migration to Firestore...');

        for (const product of products) {
            // Remove the id field since Firestore will generate its own
            const { id, ...productData } = product;

            await addDoc(collection(db, 'products'), {
                ...productData,
                createdAt: new Date(),
                updatedAt: new Date()
            });

            console.log(`✓ Migrated: ${product.name}`);
        }

        console.log('✅ All products migrated successfully!');
        alert('Produtos migrados com sucesso para o Firestore!');
    } catch (error) {
        console.error('Error seeding products:', error);
        alert('Erro ao migrar produtos: ' + error.message);
    }
};

// Uncomment the line below and run this file once to seed the database
// seedProducts();
