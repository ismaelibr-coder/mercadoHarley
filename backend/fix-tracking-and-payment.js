import { initializeFirebase, getFirestore, getOrderById } from './services/firebaseService.js';
import { getShipmentDetails } from './services/melhorEnvioShippingService.js';
import { sendShippingNotification } from './services/emailService.js';

// Initialize Firebase first
initializeFirebase();

async function fixOrderTracking() {
    try {
        const orderId = 'DlFU2U1QfWlzR6z2lDK3'; // Order ID from screenshot
        const db = getFirestore();

        console.log('🔍 Fetching order:', orderId);

        const order = await getOrderById(orderId);

        if (!order) {
            console.log('❌ Order not found');
            return;
        }

        console.log('📦 Order found:', {
            orderNumber: order.orderNumber,
            status: order.status,
            paymentStatus: order.payment?.status,
            melhorEnvioId: order.shipping?.melhorEnvioId,
            currentTracking: order.shipping?.trackingCode,
            hasCorreiosCode: order.shipping?.hasCorreiosCode
        });

        // Check if we have Melhor Envio ID
        const melhorEnvioId = order.shipping?.melhorEnvioId;

        if (!melhorEnvioId) {
            console.log('❌ No Melhor Envio ID found. Label may not have been generated.');
            return;
        }

        console.log('🔄 Fetching shipment details from Melhor Envio...');

        // Get latest shipment details
        const shipmentDetails = await getShipmentDetails(melhorEnvioId);

        console.log('📋 Shipment details:', {
            tracking: shipmentDetails.tracking,
            protocol: shipmentDetails.protocol,
            status: shipmentDetails.status
        });

        // Helper to validate Correios tracking code format (2 letters + 9 digits + BR)
        const isCorreiosCode = (code) => {
            return code && /^[A-Z]{2}\d{9}BR$/.test(code);
        };

        const hasCorreiosCode = isCorreiosCode(shipmentDetails.tracking);
        const correiosTracking = hasCorreiosCode ? shipmentDetails.tracking : null;
        const trackingCode = correiosTracking || shipmentDetails.protocol;

        console.log('📦 Tracking info:', {
            trackingCode,
            correiosTracking,
            hasCorreiosCode,
            isCorreiosFormat: hasCorreiosCode
        });

        // Calculate estimated delivery date
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + (shipmentDetails.delivery_max || 7));

        // Prepare update data
        const updateData = {
            'shipping.trackingCode': trackingCode,
            'shipping.correiosTracking': correiosTracking,
            'shipping.melhorEnvioProtocol': shipmentDetails.protocol,
            'shipping.hasCorreiosCode': hasCorreiosCode,
            'shipping.estimatedDelivery': deliveryDate
        };

        // Update payment status if needed
        if (order.payment?.status === 'pending' || order.status === 'pending') {
            console.log('🔄 Updating payment status to approved...');
            updateData['payment.status'] = 'approved';
            updateData['status'] = 'paid';
        }

        console.log('💾 Updating order with:', updateData);

        await db.collection('orders').doc(orderId).update(updateData);

        console.log('✅ Order updated successfully!');

        // Send email if we have Correios tracking code
        if (hasCorreiosCode && !order.shipping?.emailSent) {
            try {
                console.log('📧 Sending shipping notification email...');
                await sendShippingNotification(order, correiosTracking, deliveryDate);

                // Mark email as sent
                await db.collection('orders').doc(orderId).update({
                    'shipping.emailSent': true,
                    'shipping.emailSentAt': new Date()
                });

                console.log('✅ Email sent successfully!');
            } catch (emailError) {
                console.error('❌ Error sending email:', emailError);
            }
        } else if (!hasCorreiosCode) {
            console.log('⚠️ No Correios tracking code yet. Email will not be sent.');
            console.log('   The tracking code may take up to 1 hour to be assigned by Correios.');
        } else {
            console.log('ℹ️ Email already sent previously.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

fixOrderTracking();
