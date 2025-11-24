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

// Default shipping rules for Brazil
const defaultRules = [
    {
        name: "Sudeste - Econômico",
        states: ["SP", "RJ", "MG", "ES"],
        minWeight: 0,
        maxWeight: 5,
        price: 15.00,
        deliveryDays: 7
    },
    {
        name: "Sudeste - Expresso",
        states: ["SP", "RJ", "MG", "ES"],
        minWeight: 0,
        maxWeight: 5,
        price: 25.00,
        deliveryDays: 3
    },
    {
        name: "Sul - Econômico",
        states: ["PR", "SC", "RS"],
        minWeight: 0,
        maxWeight: 5,
        price: 20.00,
        deliveryDays: 10
    },
    {
        name: "Sul - Expresso",
        states: ["PR", "SC", "RS"],
        minWeight: 0,
        maxWeight: 5,
        price: 30.00,
        deliveryDays: 5
    },
    {
        name: "Nordeste - Econômico",
        states: ["BA", "SE", "PE", "AL", "PB", "RN", "CE", "PI", "MA"],
        minWeight: 0,
        maxWeight: 5,
        price: 25.00,
        deliveryDays: 12
    },
    {
        name: "Nordeste - Expresso",
        states: ["BA", "SE", "PE", "AL", "PB", "RN", "CE", "PI", "MA"],
        minWeight: 0,
        maxWeight: 5,
        price: 35.00,
        deliveryDays: 6
    },
    {
        name: "Norte - Econômico",
        states: ["PA", "AC", "RO", "RR", "AP", "AM", "TO"],
        minWeight: 0,
        maxWeight: 5,
        price: 30.00,
        deliveryDays: 15
    },
    {
        name: "Norte - Expresso",
        states: ["PA", "AC", "RO", "RR", "AP", "AM", "TO"],
        minWeight: 0,
        maxWeight: 5,
        price: 45.00,
        deliveryDays: 8
    },
    {
        name: "Centro-Oeste - Econômico",
        states: ["DF", "GO", "MT", "MS"],
        minWeight: 0,
        maxWeight: 5,
        price: 22.00,
        deliveryDays: 10
    },
    {
        name: "Centro-Oeste - Expresso",
        states: ["DF", "GO", "MT", "MS"],
        minWeight: 0,
        maxWeight: 5,
        price: 32.00,
        deliveryDays: 5
    }
];

const seedShippingRules = async () => {
    try {
        console.log('🚚 Seeding shipping rules...');

        // Check if rules already exist
        const existingRules = await db.collection('shippingRules').get();

        if (!existingRules.empty) {
            console.log(`⚠️  Found ${existingRules.size} existing rules. Skipping seed.`);
            console.log('   To re-seed, delete the shippingRules collection first.');
            process.exit(0);
        }

        // Add all rules
        for (const rule of defaultRules) {
            await db.collection('shippingRules').add({
                ...rule,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`✅ Added: ${rule.name}`);
        }

        console.log(`\n🎉 Successfully seeded ${defaultRules.length} shipping rules!`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding shipping rules:', error);
        process.exit(1);
    }
};

seedShippingRules();
