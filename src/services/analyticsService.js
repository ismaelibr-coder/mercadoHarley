import axios from 'axios';
import { auth } from './firebase';

const envUrl = import.meta.env.VITE_API_URL;
const API_URL = (envUrl && envUrl.startsWith('http')) ? envUrl : 'http://localhost:3001';

/**
 * Get dashboard metrics
 * @returns {Promise<Object>} - Dashboard metrics
 */
export const getMetrics = async () => {
    try {
        const token = await auth.currentUser?.getIdToken();

        if (!token) {
            throw new Error('User not authenticated');
        }

        const response = await axios.get(`${API_URL}/api/analytics/metrics`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching metrics:', error);
        throw error;
    }
};

/**
 * Get sales chart data
 * @param {string} period - 'day', 'week', or 'month'
 * @param {number} limit - Number of periods
 * @returns {Promise<Object>} - Chart data
 */
export const getSalesChart = async (period = 'day', limit = 30) => {
    try {
        const token = await auth.currentUser?.getIdToken();

        if (!token) {
            throw new Error('User not authenticated');
        }

        const response = await axios.get(`${API_URL}/api/analytics/sales-chart`, {
            params: { period, limit },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching sales chart:', error);
        throw error;
    }
};

/**
 * Get best-selling products
 * @param {number} limit - Number of products
 * @returns {Promise<Object>} - Best sellers data
 */
export const getBestSellers = async (limit = 10) => {
    try {
        const token = await auth.currentUser?.getIdToken();

        if (!token) {
            throw new Error('User not authenticated');
        }

        const response = await axios.get(`${API_URL}/api/analytics/best-sellers`, {
            params: { limit },
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error fetching best sellers:', error);
        throw error;
    }
};
