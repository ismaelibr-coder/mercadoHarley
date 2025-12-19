// Payment Service - Backend API Integration
// This service now calls the backend API instead of Mercado Pago directly

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const MP_PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;

// Initialize Mercado Pago SDK (client-side for card tokenization)
let mercadoPago = null;

export const initMercadoPago = () => {
    if (typeof window !== 'undefined' && window.MercadoPago) {
        try {
            mercadoPago = new window.MercadoPago(MP_PUBLIC_KEY);
            console.log('Mercado Pago SDK initialized');
            return mercadoPago;
        } catch (error) {
            console.error('Error initializing Mercado Pago:', error);
            return null;
        }
    }
    return null;
};

// Get auth token from Firebase
const getAuthToken = async () => {
    try {
        const auth = window.firebase?.auth();
        const user = auth?.currentUser;
        if (user) {
            return await user.getIdToken();
        }
        return null;
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
};

// Create PIX payment via backend
export const createPixPayment = async (orderData) => {
    try {
        console.log('Creating PIX payment via backend:', orderData.orderNumber);

        const token = await getAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/api/payments/pix`, {
            method: 'POST',
            headers,
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao criar pagamento PIX');
        }

        const data = await response.json();

        return {
            success: true,
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            paymentId: data.payment.paymentId,
            status: data.payment.status,
            qrCode: data.payment.qrCode,
            qrCodeBase64: data.payment.qrCodeBase64,
            ticketUrl: data.payment.ticketUrl,
            message: 'Pagamento PIX criado com sucesso!'
        };
    } catch (error) {
        console.error('Error creating PIX payment:', error);
        throw error;
    }
};

// Create Boleto payment via backend
export const createBoletoPayment = async (orderData) => {
    try {
        console.log('Creating Boleto payment via backend:', orderData.orderNumber);

        const token = await getAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/api/payments/boleto`, {
            method: 'POST',
            headers,
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Erro ao criar boleto');
        }

        const data = await response.json();

        return {
            success: true,
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            paymentId: data.payment.paymentId,
            status: data.payment.status,
            boletoUrl: data.payment.boletoUrl,
            barcode: data.payment.barcode,
            expirationDate: data.payment.expirationDate,
            message: 'Boleto criado com sucesso!'
        };
    } catch (error) {
        console.error('Error creating Boleto payment:', error);
        throw error;
    }
};

// Process credit card payment via backend
export const processCreditCardPayment = async (orderData, { token, installments, paymentMethodId }) => {
    try {
        console.log('Processing credit card payment via backend:', {
            orderNumber: orderData.orderNumber,
            installments,
            paymentMethod: paymentMethodId
        });

        if (!token) {
            throw new Error('Token do cartão é obrigatório');
        }

        if (!paymentMethodId) {
            throw new Error('Método de pagamento é obrigatório');
        }

        // Send token to backend
        const authToken = await getAuthToken();
        const headers = {
            'Content-Type': 'application/json'
        };

        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_URL}/api/payments/credit-card`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                orderData,
                cardToken: token,
                installments: installments || 1,
                paymentMethodId
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erro ao processar cartão');
        }

        const data = await response.json();

        return {
            success: data.payment.status === 'approved' || data.payment.status === 'pending',
            orderId: data.orderId,
            orderNumber: data.orderNumber,
            paymentId: data.payment.paymentId,
            status: data.payment.status,
            statusDetail: data.payment.statusDetail,
            message: data.payment.status === 'approved' ? 'Pagamento aprovado!' : 'Pagamento em análise'
        };
    } catch (error) {
        console.error('Error processing credit card:', error);
        throw error;
    }
};

// Check payment status
export const checkPaymentStatus = async (paymentId) => {
    try {
        const response = await fetch(`${API_URL}/api/payments/${paymentId}/status`);

        if (!response.ok) {
            throw new Error('Erro ao consultar status do pagamento');
        }

        return await response.json();
    } catch (error) {
        console.error('Error checking payment status:', error);
        throw error;
    }
};

// Get payment methods (simulated)
export const getPaymentMethods = async () => {
    try {
        return [
            { id: 'pix', name: 'PIX', type: 'bank_transfer' },
            { id: 'bolbradesco', name: 'Boleto', type: 'ticket' },
            { id: 'visa', name: 'Visa', type: 'credit_card' },
            { id: 'master', name: 'Mastercard', type: 'credit_card' }
        ];
    } catch (error) {
        console.error('Error getting payment methods:', error);
        throw error;
    }
};
