import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://www.sickgrip.com.br';

// Generate unique order number
export const generateOrderNumber = () => {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `HD-${year}-${random}`;
};

// Create new order (via API - backend handles this)
export const createOrder = async (orderData) => {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.post(`${API_URL}/api/orders`, orderData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

// Get order by ID
export const getOrderById = async (orderId) => {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_URL}/api/orders/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data.order || response.data;
    } catch (error) {
        console.error('Error getting order:', error);
        throw error;
    }
};

// Get all orders for a specific user
export const getUserOrders = async (userId, userEmail) => {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_URL}/api/orders?userId=${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data.orders || response.data || [];
    } catch (error) {
        console.error('Error getting user orders:', error);
        throw error;
    }
};

// Get all orders (admin only)
export const getAllOrders = async () => {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_URL}/api/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data.orders || response.data || [];
    } catch (error) {
        console.error('Error getting all orders:', error);
        throw error;
    }
};

// Get orders by status
export const getOrdersByStatus = async (status) => {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_URL}/api/orders?status=${status}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data.orders || response.data || [];
    } catch (error) {
        console.error('Error getting orders by status:', error);
        throw error;
    }
};

// Update order status
export const updateOrderStatus = async (orderId, status, additionalData = {}) => {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.put(`${API_URL}/api/orders/${orderId}`, {
            status,
            ...additionalData
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
};

// Update payment information
export const updateOrderPayment = async (orderId, paymentData) => {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.put(`${API_URL}/api/orders/${orderId}`, {
            payment: paymentData
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error updating order payment:', error);
        throw error;
    }
};

// Get order statistics (for admin dashboard)
export const getOrderStats = async () => {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.get(`${API_URL}/api/analytics/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error getting order stats:', error);
        throw error;
    }
};
