import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const SANDBOX_URL = 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate';
const PRODUCTION_URL = 'https://melhorenvio.com.br/api/v2/me/shipment/calculate';

const normalizeCep = (cep) => cep.replace(/\D/g, '');

export const calculateMelhorEnvioShipping = async (toCep, weightKg, dimensions) => {
    const token = process.env.MELHOR_ENVIO_TOKEN;
    const fromCep = process.env.MELHOR_ENVIO_FROM_CEP || '91030170'; // Default from user request
    const isSandbox = process.env.MELHOR_ENVIO_SANDBOX === 'true';

    if (!token) {
        console.warn('Melhor Envio Token not found. Skipping external calculation.');
        return null; // Return null to fallback to manual rules
    }

    const apiUrl = isSandbox ? SANDBOX_URL : PRODUCTION_URL;

    // Default dimensions if not provided
    const height = dimensions?.height || 20;
    const width = dimensions?.width || 20;
    const length = dimensions?.length || 20;

    try {
        const payload = {
            from: {
                postal_code: normalizeCep(fromCep)
            },
            to: {
                postal_code: normalizeCep(toCep)
            },
            products: [
                {
                    id: 'x',
                    width: width,
                    height: height,
                    length: length,
                    weight: weightKg || 1,
                    insurance_value: 0,
                    quantity: 1
                }
            ],
            options: {
                receipt: false,
                own_hand: false
            },
            services: '1,2,3,4' // SEDEX, PAC, etc. (Simplifying to generic calculation)
        };

        const response = await axios.post(apiUrl, payload, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'SICK GRIP/1.0 (contato@sickgrip.com.br)'
            },
            timeout: 10000
        });

        // Filter valid options and format
        const validOptions = response.data
            .filter(opt => !opt.error)
            .map(opt => ({
                id: `me_${opt.id}`,
                name: `${opt.company.name} ${opt.name}`,
                price: parseFloat(opt.price),
                deliveryTime: opt.delivery_time,
                serviceId: opt.id
            }));

        return validOptions;

    } catch (error) {
        console.error('Error calculating Melhor Envio shipping:', error?.response?.data || error.message);
        return null; // Fallback on error
    }
};
