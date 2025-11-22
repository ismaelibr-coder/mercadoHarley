import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
let db = null;

export const initializeFirebase = () => {
    try {
        const serviceAccount = JSON.parse(
            readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf8')
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

export const getFirestore = () => {
    if (!db) {
        throw new Error('Firestore not initialized');
    }
    return db;
};

// Order operations
export const createOrder = async (orderData) => {
    const db = getFirestore();
    const docRef = await db.collection('orders').add({
        ...orderData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
        id: docRef.id,
        ...orderData
    };
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

