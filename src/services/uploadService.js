import axios from 'axios';
import { API_URL } from '../config/api.js';

/**
 * Upload image to Cloudinary via backend
 * @param {File} file - Image file
 * @param {Object} [options]
 * @param {'product'|'banner'} [options.purpose] - 'product' normalizes onto a white
 *   square canvas server-side; anything else keeps the image as uploaded.
 * @returns {Promise<Object>} - Upload result with URL
 */
export const uploadImage = async (file, options = {}) => {
    try {
        const token = localStorage.getItem('auth_token');

        if (!token) {
            throw new Error('User not authenticated');
        }

        const formData = new FormData();
        formData.append('image', file);
        if (options.purpose) {
            formData.append('purpose', options.purpose);
        }

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
 * Upload a video file (hero background, etc.) — same shape as uploadImage
 * but hits the video endpoint (bigger size limit, video/* filter server-side).
 * @param {File} file - Video file
 * @returns {Promise<Object>} - Upload result with URL
 */
export const uploadVideo = async (file) => {
    try {
        const token = localStorage.getItem('auth_token');

        if (!token) {
            throw new Error('User not authenticated');
        }

        const formData = new FormData();
        formData.append('video', file);

        const response = await axios.post(`${API_URL}/api/upload/video`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Video upload error:', error);
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
        const token = localStorage.getItem('auth_token');

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
