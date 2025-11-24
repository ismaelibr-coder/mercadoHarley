import { db } from './firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';

const ORDERS_COLLECTION = 'orders';

// Generate unique order number
export const generateOrderNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `HD-${year}-${random}`;
};

// Create new order
export const createOrder = async (orderData) => {
    try {
        const orderNumber = generateOrderNumber();

        const order = {
            orderNumber,
            ...orderData,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, ORDERS_COLLECTION), order);

        return {
            id: docRef.id,
            orderNumber,
            ...orderData
        };
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

// Get order by ID
export const getOrderById = async (orderId) => {
    try {
        const docRef = doc(db, ORDERS_COLLECTION, orderId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        } else {
            throw new Error('Order not found');
        }
    } catch (error) {
        console.error('Error getting order:', error);
        throw error;
    }
};

// Get all orders for a specific user
export const getUserOrders = async (userId, userEmail) => {
    try {
        // Query by userId
        const q1 = query(
            collection(db, ORDERS_COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );

        // Query by userEmail (for orders made before login or as guest)
        const q2 = userEmail ? query(
            collection(db, ORDERS_COLLECTION),
            where('userEmail', '==', userEmail),
            orderBy('createdAt', 'desc')
        ) : null;

        const snapshot1 = await getDocs(q1);
        const orders1 = snapshot1.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        if (!q2) return orders1;

        const snapshot2 = await getDocs(q2);
        const orders2 = snapshot2.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Merge and remove duplicates
        const allOrders = [...orders1, ...orders2];
        const uniqueOrders = allOrders.filter((order, index, self) =>
            index === self.findIndex(o => o.id === order.id)
        );

        // Sort by createdAt desc
        return uniqueOrders.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
            const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
            return dateB - dateA;
        });
    } catch (error) {
        console.error('Error getting user orders:', error);
        throw error;
    }
};

// Get all orders (admin only)
export const getAllOrders = async () => {
    try {
        const q = query(
            collection(db, ORDERS_COLLECTION),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting all orders:', error);
        throw error;
    }
};

// Get orders by status
export const getOrdersByStatus = async (status) => {
    try {
        const q = query(
            collection(db, ORDERS_COLLECTION),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error getting orders by status:', error);
        throw error;
    }
};

// Update order status
export const updateOrderStatus = async (orderId, status, additionalData = {}) => {
    try {
        const docRef = doc(db, ORDERS_COLLECTION, orderId);
        const updateData = {
            status,
            updatedAt: serverTimestamp(),
            ...additionalData
        };

        // Add timestamp for specific status changes
        if (status === 'paid') {
            updateData.paidAt = serverTimestamp();
        } else if (status === 'shipped') {
            updateData.shippedAt = serverTimestamp();
        } else if (status === 'delivered') {
            updateData.deliveredAt = serverTimestamp();
        }

        await updateDoc(docRef, updateData);
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
};

// Update payment information
export const updateOrderPayment = async (orderId, paymentData) => {
    try {
        const docRef = doc(db, ORDERS_COLLECTION, orderId);
        await updateDoc(docRef, {
            payment: paymentData,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating order payment:', error);
        throw error;
    }
};

// Get order statistics (for admin dashboard)
export const getOrderStats = async () => {
    try {
        const allOrders = await getAllOrders();

        const stats = {
            total: allOrders.length,
            pending: allOrders.filter(o => o.status === 'pending').length,
            paid: allOrders.filter(o => o.status === 'paid').length,
            processing: allOrders.filter(o => o.status === 'processing').length,
            shipped: allOrders.filter(o => o.status === 'shipped').length,
            delivered: allOrders.filter(o => o.status === 'delivered').length,
            cancelled: allOrders.filter(o => o.status === 'cancelled').length,
            totalRevenue: allOrders
                .filter(o => o.status !== 'cancelled')
                .reduce((sum, o) => sum + (o.total || 0), 0)
        };

        return stats;
    } catch (error) {
        console.error('Error getting order stats:', error);
        throw error;
    }
};
