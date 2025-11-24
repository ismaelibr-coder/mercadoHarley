import axios from 'axios';
import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Upload image to Cloudinary via backend
 * @param {File} file - Image file
 * @returns {Promise<Object>} - Upload result with URL
 */
export const uploadImage = async (file) => {
    try {
        const token = await auth.currentUser?.getIdToken();

        if (!token) {
            throw new Error('User not authenticated');
        }

        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post(`${API_URL}/api/upload/image`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Upload error:', error);
        throw error.response?.data || error;
    }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Delete result
 */
export const deleteImage = async (publicId) => {
    try {
        const token = await auth.currentUser?.getIdToken();

        if (!token) {
            throw new Error('User not authenticated');
        }

        const response = await axios.delete(`${API_URL}/api/upload/image/${publicId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Delete error:', error);
        throw error.response?.data || error;
    }
};
