import { db } from './firebase';
import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';

const productsCollection = collection(db, 'products');

// Get all products
export const getAllProducts = async () => {
    try {
        const snapshot = await getDocs(productsCollection);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

// Get products by category
export const getProductsByCategory = async (category) => {
    try {
        const q = query(productsCollection, where('category', '==', category));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error fetching products by category:', error);
        throw error;
    }
};

// Get single product by ID
export const getProductById = async (id) => {
    try {
        const docRef = doc(db, 'products', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return {
                id: docSnap.id,
                ...docSnap.data()
            };
        } else {
            throw new Error('Product not found');
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
};

// Create new product
export const createProduct = async (productData) => {
    try {
        const docRef = await addDoc(productsCollection, {
            ...productData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
};

// Update existing product
export const updateProduct = async (id, productData) => {
    try {
        const docRef = doc(db, 'products', id);
        await updateDoc(docRef, {
            ...productData,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
};

// Delete product
export const deleteProduct = async (id) => {
    try {
        const docRef = doc(db, 'products', id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};
