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
    const apiUrl = isSandbox ? SANDBOX_URL : PRODUCTION_URL;

    // Default dimensions if not provided (in cm)
    const height = dimensions?.height || 20;
    const width = dimensions?.width || 20;
    const length = dimensions?.length || 20;

    // Melhor Envio API expects weight in KG (decimal), not grams!
    const weightInKg = weightKg || 1;

    if (!token) {
        console.warn('Melhor Envio Token not found. Skipping external calculation.');
        return null; // Return null to fallback to manual rules
    }

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
                    weight: weightInKg, // Weight in KG
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

        console.log('📦 Calculating Melhor Envio shipping:', {
            from: normalizeCep(fromCep),
            to: normalizeCep(toCep),
            weight: `${weightInKg}kg`,
            dimensions: `${height}x${width}x${length}cm`,
            sandbox: isSandbox
        });

        console.log('📤 Full payload:', JSON.stringify(payload, null, 2));

        const response = await axios.post(apiUrl, payload, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'User-Agent': 'SICK GRIP/1.0 (contato@sickgrip.com.br)'
            },
            timeout: 10000
        });

        console.log(`📥 API Response: ${response.data.length} services returned`);

        // Log any services with errors
        const servicesWithErrors = response.data.filter(opt => opt.error);
        if (servicesWithErrors.length > 0) {
            console.log('⚠️ Services with errors:', servicesWithErrors.map(s => ({
                company: s.company?.name,
                service: s.name,
                error: s.error
            })));
        }

        // Filter valid options and format
        const validOptions = response.data
            .filter(opt => !opt.error)
            .map(opt => ({
                id: `me_${opt.id}`,
                name: `${opt.company.name} ${opt.name}`,
                price: parseFloat(opt.price),
                deliveryDays: opt.delivery_time,
                serviceId: opt.id
            }));

        console.log(`✅ Melhor Envio returned ${validOptions.length} valid options`);

        if (validOptions.length > 0) {
            console.log('💰 Prices:', validOptions.map(o => `${o.name}: R$ ${o.price.toFixed(2)}`));
        }

        // If no valid options, check if all services had errors
        if (validOptions.length === 0 && servicesWithErrors.length > 0) {
            // Analyze errors to provide helpful message
            const errorMessages = servicesWithErrors.map(s => s.error);

            // Check for weight limit errors
            if (errorMessages.some(e => e.includes('Peso ultrapassa'))) {
                throw new Error(`Produto muito pesado para envio (${weightInKg}kg). Os Correios aceitam até 30kg e transportadoras até 120kg. Entre em contato para frete personalizado.`);
            }

            // Check for dimension errors
            if (errorMessages.some(e => e.includes('dimensão') || e.includes('tamanho'))) {
                throw new Error(`Dimensões do produto (${height}x${width}x${length}cm) excedem os limites das transportadoras. Entre em contato para frete personalizado.`);
            }

            // Check for CEP errors
            if (errorMessages.some(e => e.includes('CEP') || e.includes('postal'))) {
                throw new Error('CEP inválido ou não atendido pelas transportadoras. Verifique o CEP digitado.');
            }

            // Generic error
            throw new Error('Nenhuma transportadora disponível para este envio. Entre em contato para consultar opções de frete.');
        }

        return validOptions;

    } catch (error) {
        // Detailed error logging
        if (error.response?.data) {
            const apiError = error.response.data;
            console.error('❌ Melhor Envio API Error:', {
                status: error.response.status,
                errors: apiError.errors,
                message: apiError.message
            });

            // Check for specific errors
            if (apiError.errors?.['to.postal_code']) {
                console.error('CEP de destino inválido:', normalizeCep(toCep));
                console.warn('⚠️ Melhor Envio: CEP inválido, fazendo fallback para regras internas');
                return null;
            }
            if (apiError.errors?.['from.postal_code']) {
                console.error('CEP de origem inválido:', normalizeCep(fromCep));
                            return null;
            }
        } else if (error.message && error.message.includes('muito pesado')) {
            // Re-throw our custom errors
            console.error('❌ Shipping Error:', error.message);
            console.warn('⚠️ Melhor Envio: Erro de peso/dimensões, fazendo fallback para regras internas');
            return null;
        } else {
            console.error('❌ Melhor Envio Error:', error);
        }

        return null; // Fallback on error
    }
};
