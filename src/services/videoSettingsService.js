import axios from 'axios';
import { API_URL } from '../config/api.js';

const authHeaders = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) throw new Error('User not authenticated');
    return { Authorization: `Bearer ${token}` };
};

/**
 * Get the Hero's current video/poster/title — public, used by FeaturedCarousel.jsx.
 * @returns {Promise<{videoUrl: string, posterUrl: string, title: string}|null>}
 */
export const getVideoSettings = async () => {
    try {
        const response = await axios.get(`${API_URL}/api/video-settings`);
        return response.data;
    } catch (error) {
        console.error('Error fetching video settings:', error);
        return null; // Non-fatal — caller falls back to its own hardcoded default.
    }
};

export const updateVideoSettings = async (data) => {
    const response = await axios.put(`${API_URL}/api/video-settings`, data, { headers: authHeaders() });
    return response.data;
};
