import axios from 'axios';
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Get all banners (admin only)
 * @returns {Promise<Array>} - Array of banners
 */
export const getAllBanners = async () => {
    try {
        const token = await auth.currentUser?.getIdToken();

        if (!token) {
            throw new Error('User not authenticated');
        }

        const response = await axios.get(`${API_URL}/api/banners`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data.banners;
    } catch (error) {
        console.error('Error fetching banners:', error);
        throw error;
    }
};

/**
 * Get active banners for public display
 * @returns {Promise<Array>} - Array of active banners
 */
export const getActiveBanners = async () => {
    try {
        const response = await axios.get(`${API_URL}/api/banners/active`);
        return response.data.banners;
    } catch (error) {
        console.error('Error fetching active banners:', error);
        throw error;
    }
};

/**
 * Get single banner by ID (admin only)
 * @param {string} id - Banner ID
 * @returns {Promise<Object>} - Banner data
 */
export const getBannerById = async (id) => {
    try {
        const token = await auth.currentUser?.getIdToken();

        if (!token) {
            throw new Error('User not authenticated');
        }

        const response = await axios.get(`${API_URL}/api/banners/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching banner:', error);
        throw error;
    }
};

/**
 * Create new banner (admin only)
 * @param {Object} data - Banner data
 * @returns {Promise<Object>} - Created banner
 */
export const createBanner = async (data) => {
    try {
        const token = await auth.currentUser?.getIdToken();

        if (!token) {
            throw new Error('User not authenticated');
        }

        const response = await axios.post(`${API_URL}/api/banners`, data, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error creating banner:', error);
        throw error;
    }
};

/**
 * Update banner (admin only)
 * @param {string} id - Banner ID
 * @param {Object} data - Updated banner data
 * @returns {Promise<Object>} - Updated banner
 */
export const updateBanner = async (id, data) => {
    try {
        const token = await auth.currentUser?.getIdToken();

        if (!token) {
            throw new Error('User not authenticated');
        }

        const response = await axios.put(`${API_URL}/api/banners/${id}`, data, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error updating banner:', error);
        throw error;
    }
};

/**
 * Delete banner (admin only)
 * @param {string} id - Banner ID
 * @returns {Promise<void>}
 */
export const deleteBanner = async (id) => {
    try {
        const token = await auth.currentUser?.getIdToken();

        if (!token) {
            throw new Error('User not authenticated');
        }

        await axios.delete(`${API_URL}/api/banners/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    } catch (error) {
        console.error('Error deleting banner:', error);
        throw error;
    }
};
