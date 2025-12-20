import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MELHOR_ENVIO_API_URL = process.env.MELHOR_ENVIO_SANDBOX === 'true'
    ? 'https://sandbox.melhorenvio.com.br/api/v2/me'
    : 'https://melhorenvio.com.br/api/v2/me';

const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_API_TOKEN;

// Helper to make authenticated requests
const melhorEnvioRequest = async (method, endpoint, data = null) => {
    try {
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

        // Prepare shipping data
        const shippingData = {
            service: orderData.shipping.serviceId || 1, // Service ID from shipping calculation
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
                name: orderData.customer.name,
                phone: orderData.customer.phone,
                email: orderData.customer.email,
                document: orderData.customer.cpf || '00000000000',
                company_document: '',
                state_register: '',
                address: orderData.shipping.address,
                complement: orderData.shipping.complement || '',
                number: orderData.shipping.number,
                district: orderData.shipping.neighborhood,
                city: orderData.shipping.city,
                state_abbr: orderData.shipping.state,
                country_id: 'BR',
                postal_code: orderData.shipping.cep.replace(/\D/g, ''),
                note: ''
            },
            products: orderData.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                unitary_value: item.price
            })),
            volumes: [{
                height: orderData.shipping.height || 10,
                width: orderData.shipping.width || 20,
                length: orderData.shipping.length || 30,
                weight: orderData.shipping.weight || 1
            }],
            options: {
                insurance_value: orderData.total,
                receipt: false,
                own_hand: false,
                reverse: false,
                non_commercial: false,
                invoice: {
                    key: orderData.invoiceKey || '' // NFe key if available
                },
                platform: 'SICK GRIP',
                tags: [{
                    tag: orderData.orderNumber,
                    url: null
                }]
            }
        };

        const result = await melhorEnvioRequest('POST', '/cart', shippingData);

        console.log('✅ Shipping label created:', result);
        return result;
    } catch (error) {
        console.error('❌ Error creating shipping label:', error);
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
