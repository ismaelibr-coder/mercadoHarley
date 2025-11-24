const API_URL = import.meta.env.VITE_API_URL;

/**
 * Calculate shipping options based on CEP and weight
 * @param {string} cep - Destination CEP
 * @param {number} weight - Total weight in kg
 * @returns {Promise<Array>} Array of shipping options
 */
export const calculateShipping = async (cep, weight) => {
    const response = await fetch(`${API_URL}/api/shipping/calculate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cep, weight })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao calcular frete');
    }

    return response.json();
};

/**
 * Get all shipping rules (admin only)
 */
export const getShippingRules = async (token) => {
    const response = await fetch(`${API_URL}/api/shipping/rules`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar regras de frete');
    }

    return response.json();
};

/**
 * Create shipping rule (admin only)
 */
export const createShippingRule = async (token, ruleData) => {
    const response = await fetch(`${API_URL}/api/shipping/rules`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ruleData)
    });

    if (!response.ok) {
        throw new Error('Erro ao criar regra de frete');
    }

    return response.json();
};

/**
 * Update shipping rule (admin only)
 */
export const updateShippingRule = async (token, id, ruleData) => {
    const response = await fetch(`${API_URL}/api/shipping/rules/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ruleData)
    });

    if (!response.ok) {
        throw new Error('Erro ao atualizar regra de frete');
    }

    return response.json();
};

/**
 * Delete shipping rule (admin only)
 */
export const deleteShippingRule = async (token, id) => {
    const response = await fetch(`${API_URL}/api/shipping/rules/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        throw new Error('Erro ao deletar regra de frete');
    }

    return response.json();
};
