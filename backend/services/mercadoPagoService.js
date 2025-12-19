import { MercadoPagoConfig, Payment } from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();

// Configure Mercado Pago with new SDK v2
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN,
    options: { timeout: 5000 }
});

const payment = new Payment(client);

console.log('✅ Mercado Pago configured');

// Helper to check if mock mode is enabled
const isMockMode = () => process.env.MOCK_PAYMENTS === 'true';

// Create PIX payment
export const createPixPayment = async (orderData) => {
    try {
        if (isMockMode()) {
            console.log('⚠️ MOCK MODE: Creating simulated PIX payment');
            return {
                success: true,
                paymentId: `mock_pix_${Date.now()}`,
                status: 'pending',
                qrCode: `00020126580014br.gov.bcb.pix0136${orderData.orderNumber}52040000530398654${orderData.total.toFixed(2)}5802BR5925MERCADO HARLEY6009SAO PAULO62070503***6304`,
                qrCodeBase64: null,
                ticketUrl: null
            };
        }

        const paymentData = {
            transaction_amount: parseFloat(Number(orderData.total).toFixed(2)),
            description: `Pedido ${orderData.orderNumber} - Sick Grip`,
            payment_method_id: 'pix',
            payer: {
                email: orderData.customer.email,
                first_name: orderData.customer.name.split(' ')[0],
                last_name: orderData.customer.name.split(' ').slice(1).join(' ') || 'Silva',
                identification: {
                    type: 'CPF',
                    number: orderData.customer.cpf.replace(/\D/g, '')
                }
            },
            notification_url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/webhooks/mercadopago`,
            metadata: {
                order_id: orderData.id,
                order_number: orderData.orderNumber
            }
        };

        const response = await payment.create({ body: paymentData });

        return {
            success: true,
            paymentId: response.id,
            status: response.status,
            qrCode: response.point_of_interaction?.transaction_data?.qr_code,
            qrCodeBase64: response.point_of_interaction?.transaction_data?.qr_code_base64,
            ticketUrl: response.point_of_interaction?.transaction_data?.ticket_url
        };
    } catch (error) {
        console.error('Error creating PIX payment:', error);
        if (error.cause) {
            console.error('Mercado Pago Error Cause:', JSON.stringify(error.cause, null, 2));
        }
        throw new Error(error.message || 'Erro ao criar pagamento PIX');
    }
};

// Create Boleto payment
export const createBoletoPayment = async (orderData) => {
    try {
        if (isMockMode()) {
            console.log('⚠️ MOCK MODE: Creating simulated Boleto payment');
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 3);
            return {
                success: true,
                paymentId: `mock_boleto_${Date.now()}`,
                status: 'pending',
                boletoUrl: '#',
                barcode: '34191.79001 01043.510047 91020.150008 1 84340000014500',
                expirationDate: expirationDate.toISOString()
            };
        }

        const paymentData = {
            transaction_amount: orderData.total,
            description: `Pedido ${orderData.orderNumber} - Mercado Harley`,
            payment_method_id: 'bolbradesco',
            payer: {
                email: orderData.customer.email,
                first_name: orderData.customer.name.split(' ')[0],
                last_name: orderData.customer.name.split(' ').slice(1).join(' ') || 'Silva',
                identification: {
                    type: 'CPF',
                    number: orderData.customer.cpf.replace(/\D/g, '')
                },
                address: {
                    zip_code: orderData.shipping.cep.replace(/\D/g, ''),
                    street_name: orderData.shipping.address,
                    street_number: parseInt(orderData.shipping.number) || 0,
                    neighborhood: orderData.shipping.city,
                    city: orderData.shipping.city,
                    federal_unit: orderData.shipping.state || 'SP'
                }
            },
            notification_url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/webhooks/mercadopago`,
            metadata: {
                order_id: orderData.id,
                order_number: orderData.orderNumber
            }
        };

        const response = await payment.create({ body: paymentData });

        return {
            success: true,
            paymentId: response.id,
            status: response.status,
            boletoUrl: response.transaction_details?.external_resource_url,
            barcode: response.barcode?.content,
            expirationDate: response.date_of_expiration
        };
    } catch (error) {
        console.error('Error creating Boleto payment:', error);
        throw new Error(error.message || 'Erro ao criar boleto');
    }
};

// Process credit card payment with installments
export const processCreditCardPayment = async (orderData, cardToken, installments = 1, paymentMethodId) => {
    try {
        if (isMockMode()) {
            console.log('⚠️ MOCK MODE: Processing simulated Credit Card payment');
            return {
                success: true,
                paymentId: `mock_card_${Date.now()}`,
                status: 'approved',
                statusDetail: 'accredited',
                installments: installments
            };
        }

        console.log('💳 Processing card payment:', {
            amount: orderData.total,
            installments,
            paymentMethod: paymentMethodId
        });

        const paymentData = {
            transaction_amount: parseFloat(Number(orderData.total).toFixed(2)),
            token: cardToken,
            description: `Pedido ${orderData.orderNumber} - Sick Grip`,
            installments: parseInt(installments),
            payment_method_id: paymentMethodId,
            payer: {
                email: orderData.customer.email,
                first_name: orderData.customer.name.split(' ')[0],
                last_name: orderData.customer.name.split(' ').slice(1).join(' ') || 'Silva',
                identification: {
                    type: 'CPF',
                    number: orderData.customer.cpf.replace(/\D/g, '')
                }
            },
            notification_url: `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/webhooks/mercadopago`,
            metadata: {
                order_id: orderData.id,
                order_number: orderData.orderNumber
            }
        };

        const response = await payment.create({ body: paymentData });

        console.log('✅ Card payment created:', {
            id: response.id,
            status: response.status,
            installments: response.installments
        });

        return {
            success: response.status === 'approved' || response.status === 'pending',
            paymentId: response.id,
            status: response.status,
            statusDetail: response.status_detail,
            installments: response.installments
        };
    } catch (error) {
        console.error('❌ Error processing credit card:', error);
        if (error.cause) {
            console.error('Mercado Pago Error Cause:', JSON.stringify(error.cause, null, 2));
        }
        throw new Error(error.message || 'Erro ao processar cartão de crédito');
    }
};

// Get payment status
export const getPaymentStatus = async (paymentId) => {
    try {
        if (isMockMode() && paymentId.startsWith('mock_')) {
            return {
                status: 'approved',
                statusDetail: 'accredited'
            };
        }

        const response = await payment.get({ id: paymentId });

        return {
            status: response.status,
            statusDetail: response.status_detail
        };
    } catch (error) {
        console.error('Error getting payment status:', error);
        throw new Error('Erro ao consultar status do pagamento');
    }
};
