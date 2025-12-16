import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
let db = null;

export const initializeFirebase = () => {
    try {
        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
        const serviceAccount = JSON.parse(
            readFileSync(serviceAccountPath, 'utf8')
        );

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        db = admin.firestore();
        console.log('✅ Firebase Admin SDK initialized');
        return db;
    } catch (error) {
        console.error('❌ Error initializing Firebase:', error);
        throw error;
    }
};

// Export db for use in other services
export { db };

export const getFirestore = () => {
    if (!db) {
        throw new Error('Firestore not initialized');
    }
    return db;
};

// Order operations
export const createOrder = async (orderData) => {
    const db = getFirestore();

    try {
        // Use transaction to ensure stock is checked and decremented atomically
        const result = await db.runTransaction(async (transaction) => {
            // 1. Read all products and check stock
            const productRefs = [];
            const productDocs = [];

            for (const item of orderData.items) {
                const productRef = db.collection('products').doc(item.id);
                const productDoc = await transaction.get(productRef);

                if (!productDoc.exists) {
                    throw new Error(`Produto ${item.name} não encontrado`);
                }

                const productData = productDoc.data();
                const currentStock = productData.stock || 0;

                if (currentStock < item.quantity) {
                    throw new Error(
                        `Estoque insuficiente para ${item.name}. ` +
                        `Disponível: ${currentStock}, Solicitado: ${item.quantity}`
                    );
                }

                productRefs.push(productRef);
                productDocs.push({ ...productData, currentStock });
            }

            // 2. Decrement stock for all products
            for (let i = 0; i < productRefs.length; i++) {
                const newStock = productDocs[i].currentStock - orderData.items[i].quantity;
                transaction.update(productRefs[i], {
                    stock: newStock,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }

            // 3. Create the order
            const orderRef = db.collection('orders').doc();
            transaction.set(orderRef, {
                ...orderData,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            return orderRef.id;
        });

        return {
            id: result,
            ...orderData
        };
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

export const getOrderById = async (orderId) => {
    const db = getFirestore();
    const doc = await db.collection('orders').doc(orderId).get();

    if (!doc.exists) {
        throw new Error('Order not found');
    }

    return {
        id: doc.id,
        ...doc.data()
    };
    return {
        id: doc.id,
        ...doc.data()
    };
};

export const getAllOrders = async () => {
    const db = getFirestore();
    const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

export const updateOrderStatus = async (orderId, status, additionalData = {}) => {
    const db = getFirestore();
    const updateData = {
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        ...additionalData
    };

    // Add timestamp for specific status changes
    if (status === 'paid') {
        updateData.paidAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (status === 'shipped') {
        updateData.shippedAt = admin.firestore.FieldValue.serverTimestamp();
    } else if (status === 'delivered') {
        updateData.deliveredAt = admin.firestore.FieldValue.serverTimestamp();
    }

    await db.collection('orders').doc(orderId).update(updateData);
};

export const updateOrderPayment = async (orderId, paymentData) => {
    const db = getFirestore();
    await db.collection('orders').doc(orderId).update({
        payment: paymentData,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
};

// Verify user token
export const verifyToken = async (idToken) => {
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        return decodedToken;
    } catch (error) {
        throw new Error('Invalid token');
    }
};

// Check if user is admin
export const isUserAdmin = async (uid) => {
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
        return false;
    }

    return userDoc.data().isAdmin === true;
};

// Create product
export const createProduct = async (productData) => {
    const db = getFirestore();
    const docRef = await db.collection('products').add({
        ...productData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return docRef.id;
};

// Get all products
export const getAllProducts = async () => {
    const db = getFirestore();
    const snapshot = await db.collection('products').get();
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

