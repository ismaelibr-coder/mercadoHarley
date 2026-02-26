import { initializeFirebase, getFirestore } from './services/firebaseService.js';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase first
initializeFirebase();

const MELHOR_ENVIO_API_URL = process.env.MELHOR_ENVIO_SANDBOX === 'true'
    ? 'https://sandbox.melhorenvio.com.br/api/v2/me'
    : 'https://melhorenvio.com.br/api/v2/me';

const MELHOR_ENVIO_TOKEN = process.env.MELHOR_ENVIO_API_TOKEN;

async function updateTrackingCode() {
    try {
        const orderId = 'DlFU2U1QfWlzR6z2lDK3';
        const melhorEnvioId = 'd4a3e9c5-5f9f-4e7e-b8f5-6c8d7e9f0hCFpBs';
        const db = getFirestore();

        console.log('🔍 Fetching shipment details from Melhor Envio...');
        console.log('   Melhor Envio ID:', melhorEnvioId);

        // Get shipment details from Melhor Envio API
        const response = await axios.get(
            `${MELHOR_ENVIO_API_URL}/orders/${melhorEnvioId}`,
            {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${MELHOR_ENVIO_TOKEN}`,
                    'User-Agent': 'Aplicação (sickgrip.br@gmail.com)'
                }
            }
        );

        const shipmentDetails = response.data;

        console.log('\n📦 Shipment Details from Melhor Envio:');
        console.log('   ID:', shipmentDetails.id);
        console.log('   Protocol:', shipmentDetails.protocol);
        console.log('   Tracking:', shipmentDetails.tracking);
        console.log('   Status:', shipmentDetails.status);
        console.log('   Service:', shipmentDetails.service_name);
        console.log('   Delivery Min:', shipmentDetails.delivery_min);
        console.log('   Delivery Max:', shipmentDetails.delivery_max);

        // Helper to validate Correios tracking code format (2 letters + 9 digits + BR)
        const isCorreiosCode = (code) => {
            return code && /^[A-Z]{2}\d{9}BR$/.test(code);
        };

        const hasCorreiosCode = isCorreiosCode(shipmentDetails.tracking);
        const correiosTracking = hasCorreiosCode ? shipmentDetails.tracking : null;
        const trackingCode = correiosTracking || shipmentDetails.protocol;

        console.log('\n📋 Tracking Analysis:');
        console.log('   Tracking Code:', trackingCode);
        console.log('   Correios Tracking:', correiosTracking || 'Not assigned yet');
        console.log('   Has Correios Code:', hasCorreiosCode);
        console.log('   Is Correios Format:', hasCorreiosCode ? '✅ Yes' : '❌ No');

        // Calculate estimated delivery date
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + (shipmentDetails.delivery_max || 7));

        console.log('   Estimated Delivery:', deliveryDate.toLocaleDateString('pt-BR'));

        // Prepare update data
        const updateData = {
            'shipping.trackingCode': trackingCode,
            'shipping.correiosTracking': correiosTracking,
            'shipping.melhorEnvioProtocol': shipmentDetails.protocol,
            'shipping.hasCorreiosCode': hasCorreiosCode,
            'shipping.estimatedDelivery': deliveryDate,
            'shipping.deliveryMin': shipmentDetails.delivery_min,
            'shipping.deliveryMax': shipmentDetails.delivery_max
        };

        console.log('\n💾 Updating order in database...');
        await db.collection('orders').doc(orderId).update(updateData);
        console.log('✅ Order updated successfully!');

        if (hasCorreiosCode) {
            console.log('\n✅ Código dos Correios encontrado!');
            console.log('   Código:', correiosTracking);
            console.log('\n📧 Agora você pode enviar o email manualmente ou aguardar o próximo pedido.');
            console.log('   O sistema enviará emails automaticamente para novos pedidos.');
        } else {
            console.log('\n⚠️ Código dos Correios ainda não foi atribuído.');
            console.log('   Código atual (Melhor Envio):', shipmentDetails.protocol);
            console.log('   Status do envio:', shipmentDetails.status);
            console.log('\n💡 Dica: Os Correios podem levar até 24 horas para atribuir o código.');
            console.log('   Execute este script novamente mais tarde.');
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

updateTrackingCode();
