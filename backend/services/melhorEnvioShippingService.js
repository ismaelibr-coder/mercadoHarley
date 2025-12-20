import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MELHOR_ENVIO_API_URL = process.env.MELHOR_ENVIO_SANDBOX === 'true'
    ? 'https://sandbox.melhorenvio.com.br/api/v2/me'
    : 'https://melhorenvio.com.br/api/v2/me';

const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_API_TOKEN;

// Log token status on startup
console.log('🔑 Melhor Envio Configuration:');
console.log('   API URL:', MELHOR_ENVIO_API_URL);
console.log('   Token exists:', !!MELHOR_ENVIO_TOKEN);
console.log('   Token length:', MELHOR_ENVIO_TOKEN?.length || 0);
console.log('   Token preview:', MELHOR_ENVIO_TOKEN?.substring(0, 50) + '...');

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
        console.error('Melhor Envio API Error:', error.response?.data || error.message);
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
        console.log('📦 Creating shipping label for order:', orderData.id);
        console.log('📋 Order data:', JSON.stringify(orderData, null, 2));

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
                document: '00000000000', // CPF/CNPJ
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

        console.log('📤 Sending to Melhor Envio:', JSON.stringify(shippingData, null, 2));

        const result = await melhorEnvioRequest('POST', '/cart', shippingData);

        console.log('✅ Shipping label created:', result);
        return result;
    } catch (error) {
        console.error('❌ Error creating shipping label:', error);
        console.error('❌ Error details:', error.response?.data || error.message);
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
        console.log('💳 Purchasing shipping label:', orderId);

        const result = await melhorEnvioRequest('POST', '/shipment/checkout', {
            orders: [orderId]
        });

        console.log('✅ Label purchased:', result);
        return result;
    } catch (error) {
        console.error('❌ Error purchasing label:', error);
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
        console.log('📄 Generating label PDF:', orderId);

        const result = await melhorEnvioRequest('POST', '/shipment/generate', {
            orders: [orderId]
        });

        console.log('✅ Label PDF generated:', result);
        return result;
    } catch (error) {
        console.error('❌ Error generating PDF:', error);
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
        console.log('🖨️ Getting label print URL:', orderId);

        const result = await melhorEnvioRequest('POST', '/shipment/print', {
            mode: 'private',
            orders: [orderId]
        });

        console.log('✅ Label print URL:', result);
        return result.url;
    } catch (error) {
        console.error('❌ Error getting print URL:', error);
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
        console.log('🚚 Requesting pickup for orders:', orderIds);

        const result = await melhorEnvioRequest('POST', '/shipment/request-pickup', {
            orders: orderIds
        });

        console.log('✅ Pickup requested:', result);
        return result;
    } catch (error) {
        console.error('❌ Error requesting pickup:', error);
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
        console.log('📍 Getting tracking info:', trackingCode);

        const result = await melhorEnvioRequest('GET', `/shipment/tracking?code=${trackingCode}`);

        console.log('✅ Tracking info:', result);
        return result;
    } catch (error) {
        console.error('❌ Error getting tracking info:', error);
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
        console.log('📦 Getting shipment details:', orderId);

        const result = await melhorEnvioRequest('GET', `/orders/${orderId}`);

        console.log('✅ Shipment details:', result);
        return result;
    } catch (error) {
        console.error('❌ Error getting shipment details:', error);
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
