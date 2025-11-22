import { MercadoPagoConfig, PaymentMethod } from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();

// Use the token provided by the user
const ACCESS_TOKEN = 'APP_USR-7777235640024565-112114-f17305a4f75c3c1c184e0743253e404d-3007735450';

const client = new MercadoPagoConfig({
    accessToken: ACCESS_TOKEN,
    options: { timeout: 5000 }
});

const checkToken = async () => {
    try {
        console.log('Checking token validity...');
        const paymentMethod = new PaymentMethod(client);
        const methods = await paymentMethod.get();

        console.log('✅ Token is valid! Retrieved payment methods:', methods.length);
        console.log('First method:', methods[0].name);

        return true;
    } catch (error) {
        console.error('❌ Token check failed:', error.message);
        if (error.cause) {
            console.error('Cause:', JSON.stringify(error.cause, null, 2));
        }
        return false;
    }
};

checkToken();
