import axios from 'axios';
import { API_URL } from '../config/api.js';

const authHeaders = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('User not authenticated');
    return { Authorization: `Bearer ${token}` };
};

/**
 * Get all testimonials, ordered — public, used by the Home section too.
 * @returns {Promise<Array>}
 */
export const getTestimonials = async () => {
    try {
        const response = await axios.get(`${API_URL}/api/testimonials`);
        return response.data.items;
    } catch (error) {
        console.error('Error fetching testimonials:', error);
        return []; // Non-fatal — the Home section hides itself on an empty/failed list.
    }
};

export const getTestimonialById = async (id) => {
    const response = await axios.get(`${API_URL}/api/testimonials/${id}`, { headers: authHeaders() });
    return response.data;
};

export const createTestimonial = async (data) => {
    const response = await axios.post(`${API_URL}/api/testimonials`, data, { headers: authHeaders() });
    return response.data;
};

export const updateTestimonial = async (id, data) => {
    const response = await axios.put(`${API_URL}/api/testimonials/${id}`, data, { headers: authHeaders() });
    return response.data;
};

export const deleteTestimonial = async (id) => {
    await axios.delete(`${API_URL}/api/testimonials/${id}`, { headers: authHeaders() });
};
