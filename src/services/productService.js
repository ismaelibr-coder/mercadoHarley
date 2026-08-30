import axios from 'axios';
import { API_URL } from '../config/api.js';

const normalizeProduct = (product) => ({
    ...product,
    image: product?.image || product?.images?.[0] || '/images/sickgrip-logo.png'
});

// getAllProducts() is called independently by several Home components
// (useCategoryCounts for the category cards/nav, ProductList for "Destaques
// da Loja", plus any category/search page mounted at the same time) — before
// this cache, each one fired its own GET /api/products, so a single page
// load could hit the same endpoint 2-3 times. A short in-memory cache
// (shared across callers, both for an in-flight request and its resolved
// result) collapses those into one real network call. TTL is deliberately
// short — long enough to cover "several components mounting within the same
// page load," not long enough to show stale data if a product changes.
const PRODUCTS_CACHE_TTL_MS = 10_000;
let productsCache = null; // { promise, timestamp }

export const getAllProducts = async () => {
    const now = Date.now();
    if (productsCache && now - productsCache.timestamp < PRODUCTS_CACHE_TTL_MS) {
        return productsCache.promise;
    }

    const promise = axios.get(`${API_URL}/api/products`)
        .then((response) => {
            const products = response.data.products || response.data || [];
            return products.map(normalizeProduct);
        })
        .catch((error) => {
            console.error('Error fetching products:', error);
            productsCache = null; // don't cache a failure — let the next caller retry
            throw error;
        });

    productsCache = { promise, timestamp: now };
    return promise;
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
