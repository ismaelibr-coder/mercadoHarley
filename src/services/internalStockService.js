import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return token
        ? { Authorization: `Bearer ${token}` }
        : {};
};

export const getSuppliers = async (includeInactive = false) => {
    const response = await axios.get(`${API_URL}/api/internal-stock/suppliers`, {
        params: { includeInactive },
        headers: getAuthHeaders()
    });
    return response.data || [];
};

export const createSupplier = async (name) => {
    const response = await axios.post(
        `${API_URL}/api/internal-stock/suppliers`,
        { name },
        { headers: getAuthHeaders() }
    );
    return response.data?.supplier;
};

export const updateSupplier = async (id, payload) => {
    const response = await axios.put(
        `${API_URL}/api/internal-stock/suppliers/${id}`,
        payload,
        { headers: getAuthHeaders() }
    );
    return response.data?.supplier;
};

export const deleteSupplier = async (id) => {
    const response = await axios.delete(`${API_URL}/api/internal-stock/suppliers/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const importSuppliersFromPartners = async () => {
    const response = await axios.post(
        `${API_URL}/api/internal-stock/suppliers/import-from-partners`,
        {},
        { headers: getAuthHeaders() }
    );
    return response.data;
};

export const getPricingConfig = async () => {
    const response = await axios.get(`${API_URL}/api/internal-stock/pricing-config`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const updatePricingConfig = async (payload) => {
    const response = await axios.put(`${API_URL}/api/internal-stock/pricing-config`, payload, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const getInternalStockItems = async () => {
    const response = await axios.get(`${API_URL}/api/internal-stock/items`, {
        headers: getAuthHeaders()
    });
    return response.data || [];
};

export const createInternalStockItem = async (payload) => {
    const response = await axios.post(`${API_URL}/api/internal-stock/items`, payload, {
        headers: getAuthHeaders()
    });
    return response.data?.item;
};

export const updateInternalStockItem = async (id, payload) => {
    const response = await axios.put(`${API_URL}/api/internal-stock/items/${id}`, payload, {
        headers: getAuthHeaders()
    });
    return response.data?.item;
};

export const deleteInternalStockItem = async (id) => {
    const response = await axios.delete(`${API_URL}/api/internal-stock/items/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};
