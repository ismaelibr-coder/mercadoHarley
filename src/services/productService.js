import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://www.sickgrip.com.br';

const normalizeProduct = (product) => ({
    ...product,
    image: product?.image || product?.images?.[0] || '/images/sickgrip-logo.png'
});

// Get all products
export const getAllProducts = async () => {
    try {
        const response = await axios.get(`${API_URL}/api/products`);
        const products = response.data.products || response.data || [];
        return products.map(normalizeProduct);
    } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
    }
};

// Get products by category
export const getProductsByCategory = async (category) => {
    try {
        const response = await axios.get(`${API_URL}/api/products?category=${category}`);
        const products = response.data.products || response.data || [];
        return products.map(normalizeProduct);
    } catch (error) {
        console.error('Error fetching products by category:', error);
        throw error;
    }
};

// Get single product by ID
export const getProductById = async (id) => {
    try {
        const response = await axios.get(`${API_URL}/api/products/${id}`);
        return normalizeProduct(response.data.product || response.data);
    } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
    }
};

// Create new product
export const createProduct = async (productData) => {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.post(`${API_URL}/api/products`, productData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data.id || response.data.product?.id;
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
};

// Update existing product
export const updateProduct = async (id, productData) => {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.put(`${API_URL}/api/products/${id}`, productData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating product:', error);
        throw error;
    }
};

// Delete product
export const deleteProduct = async (id) => {
    try {
        const token = localStorage.getItem('auth_token');
        const response = await axios.delete(`${API_URL}/api/products/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};
