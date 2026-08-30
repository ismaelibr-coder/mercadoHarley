import axios from 'axios';
import { API_URL } from '../config/api.js';

const authHeaders = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('User not authenticated');
    return { Authorization: `Bearer ${token}` };
};

/**
 * Get all gallery items, ordered — public, used by the Home grid too.
 * @returns {Promise<Array>}
 */
export const getGalleryItems = async () => {
    try {
        const response = await axios.get(`${API_URL}/api/customer-gallery`);
        return response.data.items;
    } catch (error) {
        console.error('Error fetching gallery items:', error);
        return []; // Non-fatal — the Home section hides itself on an empty/failed list.
    }
};

export const getGalleryItemById = async (id) => {
    const response = await axios.get(`${API_URL}/api/customer-gallery/${id}`, { headers: authHeaders() });
    return response.data;
};

export const createGalleryItem = async (data) => {
    const response = await axios.post(`${API_URL}/api/customer-gallery`, data, { headers: authHeaders() });
    return response.data;
};

export const updateGalleryItem = async (id, data) => {
    const response = await axios.put(`${API_URL}/api/customer-gallery/${id}`, data, { headers: authHeaders() });
    return response.data;
};

export const deleteGalleryItem = async (id) => {
    await axios.delete(`${API_URL}/api/customer-gallery/${id}`, { headers: authHeaders() });
};
