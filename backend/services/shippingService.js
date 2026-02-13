import axios from 'axios';
import { getFirestore } from './firebaseService.js';

/**
 * Calculate shipping options based on CEP and total weight
 * @param {string} cep - Destination CEP
 * @param {number} totalWeight - Total weight in kg
 * @returns {Promise<Array>} Array of shipping options
 */
export const calculateShipping = async (cep, totalWeight) => {
    const db = getFirestore();

    // Get state from CEP
    const state = await getStateFromCEP(cep);

    if (!state) {
        throw new Error('CEP inválido');
    }

    // Find matching shipping rules
    // Note: Firestore requires an index for array-contains + inequality.
    // We'll query by state and filter weights in memory.
    const rulesSnapshot = await db.collection('shippingRules')
        .where('states', 'array-contains', state)
        .get();

    const options = rulesSnapshot.docs
        .map(doc => ({
            id: doc.id,
            ...doc.data()
        }))
        .filter(rule => rule.minWeight <= totalWeight && rule.maxWeight >= totalWeight);

    // Sort by price (cheapest first)
    options.sort((a, b) => a.price - b.price);

    return options;
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
    const db = getFirestore();
    const docRef = await db.collection('shippingRules').add({
        ...ruleData,
        createdAt: new Date(),
        updatedAt: new Date()
    });
    return docRef.id;
};

/**
 * Get all shipping rules
 */
export const getAllShippingRules = async () => {
    const db = getFirestore();
    const snapshot = await db.collection('shippingRules').get();
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

/**
 * Update a shipping rule
 */
export const updateShippingRule = async (id, ruleData) => {
    const db = getFirestore();
    await db.collection('shippingRules').doc(id).update({
        ...ruleData,
        updatedAt: new Date()
    });
};

/**
 * Delete a shipping rule
 */
export const deleteShippingRule = async (id) => {
    const db = getFirestore();
    await db.collection('shippingRules').doc(id).delete();
};
