import axios from 'axios';
import { API_URL } from '../config/api.js';

const authHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * @param {string} productId
 * @returns {Promise<{reviews: Array, average: number, count: number}>}
 */
export const getProductReviews = async (productId) => {
    const response = await axios.get(`${API_URL}/api/products/${productId}/reviews`);
    return response.data;
};

/**
 * Whether the current logged-in user can review this product. Returns false
 * (not an error) for a logged-out visitor — there's simply nothing to check.
 * @param {string} productId
 * @returns {Promise<boolean>}
 */
export const canReviewProduct = async (productId) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return false;
    try {
        const response = await axios.get(`${API_URL}/api/products/${productId}/reviews/eligibility`, {
            headers: authHeaders()
        });
        return Boolean(response.data.eligible);
    } catch (error) {
        console.error('Error checking review eligibility:', error);
        return false;
    }
};

/**
 * @param {string} productId
 * @param {{ rating: number, comment: string }} data
 */
export const createReview = async (productId, data) => {
    const response = await axios.post(`${API_URL}/api/reviews`, { productId, ...data }, {
        headers: authHeaders()
    });
    return response.data;
};
