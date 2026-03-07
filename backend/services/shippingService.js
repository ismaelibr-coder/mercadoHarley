import axios from 'axios';
import { ShippingRule } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';

/**
 * Calculate shipping options based on CEP and total weight
 * @param {string} cep - Destination CEP
 * @param {number} totalWeight - Total weight in kg
 * @returns {Promise<Array>} Array of shipping options
 */
export const calculateShipping = async (cep, totalWeight) => {
    // Get state from CEP
    const state = await getStateFromCEP(cep);

    if (!state) {
        throw new Error('CEP inválido');
    }

    // Find matching shipping rules using JSON_CONTAINS for MySQL JSON column
    const rules = await ShippingRule.findAll({
        where: sequelize.where(
            sequelize.fn('JSON_CONTAINS', sequelize.col('states'), sequelize.literal(`'"${state}"'`)),
            1
        )
    });

    // Filter by weight range
    const options = rules.filter(rule => 
        parseFloat(rule.minWeight) <= totalWeight && parseFloat(rule.maxWeight) >= totalWeight
    );

    // Sort by price (cheapest first)
    options.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

    return options.map(rule => {
        const data = rule.toJSON();
        return {
            id: data.id,
            name: data.name,
            price: parseFloat(data.price), // Ensure price is number
            deliveryTime: data.deliveryDays, // Frontend expects deliveryTime
            minWeight: parseFloat(data.minWeight),
            maxWeight: parseFloat(data.maxWeight)
        };
    });
};

/**
 * Get Brazilian state from CEP
 * Based on CEP prefix ranges
 */
const getStateFromCEP = async (cep) => {
    const cleanCEP = cep.replace(/\D/g, '');

    if (cleanCEP.length !== 8) {
        return null;
    }

    // Try ViaCEP first for accurate UF
    try {
        const response = await axios.get(`https://viacep.com.br/ws/${cleanCEP}/json/`, {
            timeout: 4000
        });

        if (response.data?.uf) {
            return response.data.uf.toUpperCase();
        }

        if (response.data?.erro) {
            return null;
        }
    } catch (error) {
        console.warn('ViaCEP lookup failed, falling back to CEP prefix mapping:', error.message);
    }

    const prefix = parseInt(cleanCEP.substring(0, 2), 10);
    const prefix3 = parseInt(cleanCEP.substring(0, 3), 10);

    // More precise 3-digit mappings for overlapping ranges
    if (prefix3 === 689) return 'AP';
    if (prefix3 >= 690 && prefix3 <= 692) return 'AM';
    if (prefix3 === 693) return 'RR';
    if (prefix3 >= 694 && prefix3 <= 698) return 'AM';
    if (prefix3 === 699) return 'AC';
    if (prefix3 >= 660 && prefix3 <= 688) return 'PA';
    if (prefix3 >= 768 && prefix3 <= 769) return 'RO';
    if (prefix3 >= 770 && prefix3 <= 779) return 'TO';
    if (prefix3 >= 790 && prefix3 <= 799) return 'MS';

    // CEP to State mapping (official Correios ranges)
    if (prefix >= 1 && prefix <= 19) return 'SP';
    if (prefix >= 20 && prefix <= 28) return 'RJ';
    if (prefix >= 29 && prefix <= 29) return 'ES';
    if (prefix >= 30 && prefix <= 39) return 'MG';
    if (prefix >= 40 && prefix <= 48) return 'BA';
    if (prefix >= 49 && prefix <= 49) return 'SE';
    if (prefix >= 50 && prefix <= 56) return 'PE';
    if (prefix >= 57 && prefix <= 57) return 'AL';
    if (prefix >= 58 && prefix <= 58) return 'PB';
    if (prefix >= 59 && prefix <= 59) return 'RN';
    if (prefix >= 60 && prefix <= 63) return 'CE';
    if (prefix >= 64 && prefix <= 64) return 'PI';
    if (prefix >= 65 && prefix <= 65) return 'MA';
    if (prefix >= 66 && prefix <= 68) return 'PA';
    if (prefix >= 69 && prefix <= 69) return 'AM';
    if (prefix >= 70 && prefix <= 72) return 'DF';
    if (prefix >= 73 && prefix <= 73) return 'GO';
    if (prefix >= 74 && prefix <= 76) return 'GO';
    if (prefix >= 77 && prefix <= 77) return 'TO';
    if (prefix >= 78 && prefix <= 79) return 'MT';
    if (prefix >= 80 && prefix <= 87) return 'PR';
    if (prefix >= 88 && prefix <= 89) return 'SC';
    if (prefix >= 90 && prefix <= 99) return 'RS';
    if (prefix >= 79 && prefix <= 79) return 'MS';

    return null;
};

/**
 * Create a new shipping rule
 */
export const createShippingRule = async (ruleData) => {
    const rule = await ShippingRule.create(ruleData);
    return rule.id;
};

/**
 * Get all shipping rules
 */
export const getAllShippingRules = async () => {
    const rules = await ShippingRule.findAll();
    return rules.map(rule => rule.toJSON());
};

/**
 * Update a shipping rule
 */
export const updateShippingRule = async (id, ruleData) => {
    const rule = await ShippingRule.findByPk(id);
    if (!rule) {
        throw new Error('Shipping rule not found');
    }
    await rule.update(ruleData);
};

/**
 * Delete a shipping rule
 */
export const deleteShippingRule = async (id) => {
    const rule = await ShippingRule.findByPk(id);
    if (!rule) {
        throw new Error('Shipping rule not found');
    }
    await rule.destroy();
};
