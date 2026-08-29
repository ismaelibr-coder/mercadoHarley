import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const MELHOR_ENVIO_API_URL = process.env.MELHOR_ENVIO_SANDBOX === 'true'
    ? 'https://sandbox.melhorenvio.com.br/api/v2/me'
    : 'https://melhorenvio.com.br/api/v2/me';

const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_TOKEN;

// Log token status on startup — never log any part of the token itself (even a
// "preview" substring leaks most of a short API token into server logs).
logger.info('🔑 Melhor Envio Configuration:');
logger.info('   API URL:', MELHOR_ENVIO_API_URL);
logger.info('   Token exists:', !!MELHOR_ENVIO_TOKEN);
logger.info('   Token length:', MELHOR_ENVIO_TOKEN?.length || 0);

// Helper to make authenticated requests
const melhorEnvioRequest = async (method, endpoint, data = null) => {
    try {
        if (!MELHOR_ENVIO_TOKEN) {
            throw new Error('MELHOR_ENVIO_API_TOKEN não configurado');
        }

        const config = {
            method,
            url: `${MELHOR_ENVIO_API_URL}${endpoint}`,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MELHOR_ENVIO_TOKEN}`,
                'User-Agent': 'Aplicação (email@example.com)'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return response.data;
    } catch (error) {
        logger.error('Melhor Envio API Error:', error.response?.data || error.message);
        throw new Error(error.response?.data?.message || 'Erro ao comunicar com Melhor Envio');
    }
};

/**
 * Create shipping label in Melhor Envio cart
 * @param {Object} orderData - Order data with shipping info
 * @returns {Promise<Object>} Cart item with ID
 */
export const createShippingLabel = async (orderData) => {
    try {
        logger.info('📦 Creating shipping label for order:', orderData.id);
        logger.info('📋 Order data:', JSON.stringify(orderData, null, 2));

        // Handle both shipping and shippingAddress structures
        const shipping = orderData.shipping || orderData.shippingAddress || {};
        const customer = orderData.customer || {};

        // Validate required fields
        if (!customer.name || !customer.email) {
            throw new Error('Dados do cliente incompletos (nome/email)');
        }

        if (!shipping.address && !shipping.street) {
            throw new Error('Endereço de entrega não encontrado');
        }

        // Prepare shipping data
        const shippingData = {
            service: shipping.serviceId || 1, // Service ID from shipping calculation
            agency: null, // Optional: agency for pickup
            from: {
                name: 'SICK GRIP',
                phone: '51984442294',
                email: 'sickgrip.br@gmail.com',
                document: '123.456.789-09', // CPF do responsável pela loja (diferente do cliente)
                company_document: '', // CNPJ if company
                state_register: '',
                address: 'R. Júlio Verne',
                complement: 'Pavilhão Oficina',
                number: '788',
                district: 'Santa Maria Goretti',
                city: 'Porto Alegre',
                country_id: 'BR',
                postal_code: '91030170',
                note: ''
            },
            to: {
                name: customer.name,
                phone: customer.phone || '00000000000',
                email: customer.email,
                document: customer.cpf || '00000000000',
                company_document: '',
                state_register: '',
                address: shipping.address || shipping.street || 'Rua não informada',
                complement: shipping.complement || '',
                number: shipping.number || 'S/N',
                district: shipping.neighborhood || shipping.district || 'Bairro',
                city: shipping.city || 'Cidade',
                state_abbr: shipping.state || 'RS',
                country_id: 'BR',
                postal_code: (shipping.cep || shipping.zipCode || '00000000').replace(/\D/g, ''),
                note: ''
            },
            products: orderData.items.map(item => ({
                name: item.name || 'Produto',
                quantity: item.quantity || 1,
                unitary_value: item.price || 0.01
            })),
            volumes: [{
                height: shipping.height || 10,
                width: shipping.width || 20,
                length: shipping.length || 30,
                weight: shipping.weight || 1
            }],
            options: {
                insurance_value: orderData.total || 0.01,
                receipt: false,
                own_hand: false,
                reverse: false,
                non_commercial: false,
                invoice: {
                    key: orderData.invoiceKey || '' // NFe key if available
                },
                platform: 'SICK GRIP',
                tags: [{
                    tag: orderData.orderNumber || orderData.id,
                    url: null
                }]
            }
        };

        logger.info('📤 Sending to Melhor Envio:', JSON.stringify(shippingData, null, 2));

        const result = await melhorEnvioRequest('POST', '/cart', shippingData);

        logger.info('✅ Shipping label created:', result);
        return result;
    } catch (error) {
        logger.error('❌ Error creating shipping label:', error);
        logger.error('❌ Error details:', error.response?.data || error.message);
        throw error;
    }
};

/**
 * Purchase shipping label (checkout cart)
 * @param {string} orderId - Melhor Envio order ID
 * @returns {Promise<Object>} Purchase result
 */
export const purchaseShippingLabel = async (orderId) => {
    try {
        logger.info('💳 Purchasing shipping label:', orderId);

        const result = await melhorEnvioRequest('POST', '/shipment/checkout', {
            orders: [orderId]
        });

        logger.info('✅ Label purchased:', result);
        return result;
    } catch (error) {
        logger.error('❌ Error purchasing label:', error);
        throw error;
    }
};

/**
 * Generate shipping label PDF
 * @param {string} orderId - Melhor Envio order ID
 * @returns {Promise<Object>} Label URL
 */
export const generateShippingLabelPDF = async (orderId) => {
    try {
        logger.info('📄 Generating label PDF:', orderId);

        const result = await melhorEnvioRequest('POST', '/shipment/generate', {
            orders: [orderId]
        });

        logger.info('✅ Label PDF generated:', result);
        return result;
    } catch (error) {
        logger.error('❌ Error generating PDF:', error);
        throw error;
    }
};

/**
 * Print shipping label (get PDF URL)
 * @param {string} orderId - Melhor Envio order ID
 * @returns {Promise<string>} PDF URL
 */
export const printShippingLabel = async (orderId) => {
    try {
        logger.info('🖨️ Getting label print URL:', orderId);

        const result = await melhorEnvioRequest('POST', '/shipment/print', {
            mode: 'private',
            orders: [orderId]
        });

        logger.info('✅ Label print URL:', result);
        return result.url;
    } catch (error) {
        logger.error('❌ Error getting print URL:', error);
        throw error;
    }
};

/**
 * Request pickup for shipments
 * @param {Array<string>} orderIds - Array of Melhor Envio order IDs
 * @returns {Promise<Object>} Pickup request result
 */
export const requestPickup = async (orderIds) => {
    try {
        logger.info('🚚 Requesting pickup for orders:', orderIds);

        const result = await melhorEnvioRequest('POST', '/shipment/request-pickup', {
            orders: orderIds
        });

        logger.info('✅ Pickup requested:', result);
        return result;
    } catch (error) {
        logger.error('❌ Error requesting pickup:', error);
        throw error;
    }
};

/**
 * Get tracking information
 * @param {string} trackingCode - Tracking code
 * @returns {Promise<Object>} Tracking info
 */
export const getTrackingInfo = async (trackingCode) => {
    try {
        logger.info('📍 Getting tracking info:', trackingCode);

        const result = await melhorEnvioRequest('GET', `/shipment/tracking?code=${trackingCode}`);

        logger.info('✅ Tracking info:', result);
        return result;
    } catch (error) {
        logger.error('❌ Error getting tracking info:', error);
        throw error;
    }
};

/**
 * Get shipment details
 * @param {string} orderId - Melhor Envio order ID
 * @returns {Promise<Object>} Shipment details
 */
export const getShipmentDetails = async (orderId) => {
    try {
        logger.info('📦 Getting shipment details:', orderId);

        const result = await melhorEnvioRequest('GET', `/orders/${orderId}`);

        logger.info('✅ Shipment details:', result);
        return result;
    } catch (error) {
        logger.error('❌ Error getting shipment details:', error);
        throw error;
    }
};

export default {
    createShippingLabel,
    purchaseShippingLabel,
    generateShippingLabelPDF,
    printShippingLabel,
    requestPickup,
    getTrackingInfo,
    getShipmentDetails
};
