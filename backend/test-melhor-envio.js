import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const SANDBOX_URL = 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate';
const PRODUCTION_URL = 'https://melhorenvio.com.br/api/v2/me/shipment/calculate';

const normalizeCep = (cep) => cep.replace(/\D/g, '');

const testEnvironment = async (envName, url, token) => {
    console.log(`\n--- Testing ${envName} Environment ---`);
    const fromCep = process.env.MELHOR_ENVIO_FROM_CEP || '91030170';
    const toCep = '91540315';

    const payload = {
        from: { postal_code: normalizeCep(fromCep) },
        to: { postal_code: normalizeCep(toCep) },
        products: [{
            id: 'x', width: 20, height: 20, length: 20, weight: 1, insurance_value: 10, quantity: 1
        }],
        options: { receipt: false, own_hand: false },
        services: '1,2,3,4'
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'MercadoHarley/1.0 (contato@mercadoharley.com.br)'
            },
            timeout: 10000
        });
        console.log(`✅ SUCCESS in ${envName}!`);
        console.log('Result Count:', response.data.length);
        return true;
    } catch (error) {
        console.log(`❌ FAILED in ${envName}`);
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('Error:', error.message);
        }
        return false;
    }
};

const run = async () => {
    const token = process.env.MELHOR_ENVIO_TOKEN;
    if (!token) {
        console.error('❌ No token found in .env');
        return;
    }

    // Try Production
    await testEnvironment('PRODUCTION', PRODUCTION_URL, token);

    // Try Sandbox
    await testEnvironment('SANDBOX', SANDBOX_URL, token);
};

run();
