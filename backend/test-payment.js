import { MercadoPagoConfig, Payment } from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_TOKEN = 'APP_USR-7777235640024565-112114-f17305a4f75c3c1c184e0743253e404d-3007735450';

const client = new MercadoPagoConfig({
    accessToken: ACCESS_TOKEN,
    options: { timeout: 5000 }
});

const payment = new Payment(client);

const testPix = async () => {
    try {
        console.log('Testing PIX payment creation with valid token...');

        const paymentData = {
            transaction_amount: 1.00, // Small amount
            description: 'Teste de Pagamento - Mercado Harley',
            payment_method_id: 'pix',
            payer: {
                email: 'test_user_987654321@test.com', // Random test email
                first_name: 'Test',
                last_name: 'User',
                identification: {
                    type: 'CPF',
                    number: '06324993005' // Valid generated CPF
                }
            },
            notification_url: 'https://webhook.site/dummy-url'
        };

        const response = await payment.create({ body: paymentData });
        console.log('✅ Success! Payment created:', response.id);
        console.log('Status:', response.status);
        console.log('QR Code:', response.point_of_interaction?.transaction_data?.qr_code?.substring(0, 20) + '...');
    } catch (error) {
        console.error('❌ Error creating payment:', error.message);
        if (error.cause) {
            console.error('Cause:', JSON.stringify(error.cause, null, 2));
        }
    }
};

testPix();
