import { db } from './firebaseService.js';
import admin from 'firebase-admin';

/**
 * Get all banners ordered by priority
 * @returns {Promise<Array>} - Array of banners
 */
export const getAllBanners = async () => {
    try {
        const bannersSnapshot = await db.collection('banners')
            .orderBy('order', 'asc')
            .get();

        const banners = [];
        bannersSnapshot.forEach(doc => {
            banners.push({
                id: doc.id,
                ...doc.data()
            });
        });

        return banners;
    } catch (error) {
        console.error('Error getting all banners:', error);
        throw error;
    }
};

/**
 * Get only active banners for public display
 * @returns {Promise<Array>} - Array of active banners
 */
export const getActiveBanners = async () => {
    try {
        const bannersSnapshot = await db.collection('banners')
            .where('active', '==', true)
            .get();

        const banners = [];
        bannersSnapshot.forEach(doc => {
            banners.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by order in memory to avoid Firestore composite index requirement
        return banners.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
        console.error('Error getting active banners:', error);
        throw error;
    }
};

/**
 * Get active banners filtered by display type
 * @param {string} displayType - 'carousel' or 'hero'
 * @returns {Promise<Array>} - Array of active banners of specified type
 */
export const getActiveBannersByType = async (displayType) => {
    try {
        const bannersSnapshot = await db.collection('banners')
            .where('active', '==', true)
            .where('displayType', '==', displayType)
            .get();

        const banners = [];
        bannersSnapshot.forEach(doc => {
            banners.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Sort by order in memory
        return banners.sort((a, b) => (a.order || 0) - (b.order || 0));
    } catch (error) {
        console.error('Error getting active banners by type:', error);
        throw error;
    }
};

/**
 * Get single banner by ID
 * @param {string} id - Banner ID
 * @returns {Promise<Object>} - Banner data
 */
export const getBannerById = async (id) => {
    try {
        const bannerDoc = await db.collection('banners').doc(id).get();

        if (!bannerDoc.exists) {
            throw new Error('Banner not found');
        }

        return {
            id: bannerDoc.id,
            ...bannerDoc.data()
        };
    } catch (error) {
        console.error('Error getting banner:', error);
        throw error;
    }
};

/**
 * Create new banner
 * @param {Object} data - Banner data
 * @returns {Promise<Object>} - Created banner with ID
 */
export const createBanner = async (data) => {
    try {
        const bannerData = {
            title: data.title,
            image: data.image,
            link: {
                type: data.link.type, // 'category', 'product', 'external'
                value: data.link.value
            },
            displayType: data.displayType || 'carousel', // 'carousel' or 'hero'
            order: data.order || 0,
            active: data.active !== undefined ? data.active : true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const bannerRef = await db.collection('banners').add(bannerData);

        return {
            id: bannerRef.id,
            ...bannerData
        };
    } catch (error) {
        console.error('Error creating banner:', error);
        throw error;
    }
};

/**
 * Update existing banner
 * @param {string} id - Banner ID
 * @param {Object} data - Updated banner data
 * @returns {Promise<Object>} - Updated banner
 */
export const updateBanner = async (id, data) => {
    try {
        const bannerRef = db.collection('banners').doc(id);
        const bannerDoc = await bannerRef.get();

        if (!bannerDoc.exists) {
            throw new Error('Banner not found');
        }

        const updateData = {
            ...data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await bannerRef.update(updateData);

        return {
            id,
            ...bannerDoc.data(),
            ...updateData
        };
    } catch (error) {
        console.error('Error updating banner:', error);
        throw error;
    }
};

/**
 * Delete banner
 * @param {string} id - Banner ID
 * @returns {Promise<void>}
 */
export const deleteBanner = async (id) => {
    try {
        const bannerRef = db.collection('banners').doc(id);
        const bannerDoc = await bannerRef.get();

        if (!bannerDoc.exists) {
            throw new Error('Banner not found');
        }

        await bannerRef.delete();
    } catch (error) {
        console.error('Error deleting banner:', error);
        throw error;
    }
};
