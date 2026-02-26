import { initializeFirebase, getFirestore } from './services/firebaseService.js';
import { sendShippingNotification } from './services/emailService.js';
import axios from 'axios';

// Initialize Firebase first
initializeFirebase();

// NEW TOKEN PROVIDED BY USER
const MELHOR_ENVIO_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NTYiLCJqdGkiOiI1MTdmNjY5YjBiZDg0ZTY3M2E4ZmFlODBiMzQzM2FlMDM5NWFkZWJiZTNkMjEzOTA4NTA4MDNkNmExYzg4OGE5MmViNzM1MTQ1M2IzOGU3OSIsImlhdCI6MTc2NjcwNDI2NS4xMzkyLCJuYmYiOjE3NjY3MDQyNjUuMTM5MjAyLCJleHAiOjE3OTgyNDAyNjUuMTMwNjQxLCJzdWIiOiJhMGEzNWY2Mi1jYzBmLTQ1ODktYThiYS02MzZkYjhjY2VlNzciLCJzY29wZXMiOlsiY2FydC1yZWFkIiwiY2FydC13cml0ZSIsImNvbXBhbmllcy1yZWFkIiwiY29tcGFuaWVzLXdyaXRlIiwiY291cG9ucy1yZWFkIiwiY291cG9ucy13cml0ZSIsIm5vdGlmaWNhdGlvbnMtcmVhZCIsIm9yZGVycy1yZWFkIiwicHJvZHVjdHMtcmVhZCIsInByb2R1Y3RzLWRlc3Ryb3kiLCJwcm9kdWN0cy13cml0ZSIsInB1cmNoYXNlcy1yZWFkIiwic2hpcHBpbmctY2FsY3VsYXRlIiwic2hpcHBpbmctY2FuY2VsIiwic2hpcHBpbmctY2hlY2tvdXQiLCJzaGlwcGluZy1jb21wYW5pZXMiLCJzaGlwcGluZy1nZW5lcmF0ZSIsInNoaXBwaW5nLXByZXZpZXciLCJzaGlwcGluZy1wcmludCIsInNoaXBwaW5nLXNoYXJlIiwic2hpcHBpbmctdHJhY2tpbmciLCJlY29tbWVyY2Utc2hpcHBpbmciLCJ0cmFuc2FjdGlvbnMtcmVhZCIsInVzZXJzLXJlYWQiLCJ1c2Vycy13cml0ZSIsIndlYmhvb2tzLXJlYWQiLCJ3ZWJob29rcy13cml0ZSIsIndlYmhvb2tzLWRlbGV0ZSIsInRkZWFsZXItd2ViaG9vayJdfQ.ksVt_m5tW1dAeoA2MTX8BVepk42I7KIezS5Fr6yIZBHnH-g-a42N9MDZupJ2gM8cbwV5GDFSmo7OY3BNXy35Cczd23b5B3Ui6XtLR_fo65x-kYiPxl9KM9o3hRyoUk5GktSeFSud8HSQzNtA1kthenLN4l4VTBFx42QfbF1UMJ_o7nXPgNnklYF2QTSuZvKCFQ-WsMVM4g5MGxAGdE2bCbYKGBdN79Lp3WJVXQdt6Md1LFbbcj_--ai7ofRxRTNU_twmAfbVxVMl8gJ0leDcahYIUtoKvGEb_zVh35dQ-tqc9N2UYPIUTebzKysA-_7JmnQW513k7nUSa1eU_dZPsNx-t0z36qozdpS_rwK-gsNoQNEGm8yjt4QtXEmV2DuS9pRlh6v705cdzU3nHA-zJIj9t82ofrfm0M-LbPqZQYiDSNdO1QAqy2FafrubsSrdt5CDdcOfbZhzboqZS8d8Sh_nFmhTyWC109kHbCo3NGGUwwL_4D4w_M7Gc5_yCv8VzOKUHGq7FBbMLMMqBy1DTUSYqKnQWF68G0URZQXBw-FMEEDPM8H7gksXDp_XUKnEMzalDCFjVK6cAR4INYqWSzS-XEtHvu4nhWjLUczWj9Kkb4M6sOk_DeuqXVcJd5aPXxQXItC5OvN7eCGlY3UB8-ueZAcalYH1E6PX5iyt98U';

const MELHOR_ENVIO_API_URL = 'https://melhorenvio.com.br/api/v2/me';

async function updateAllOrdersTracking() {
    try {
        const db = getFirestore();

        console.log('🔍 Searching for orders with shipping labels...\n');

        // Get all orders that have a Melhor Envio ID but no Correios tracking code
        const ordersSnapshot = await db.collection('orders')
            .where('shipping.melhorEnvioId', '!=', null)
            .get();

        console.log(`📦 Found ${ordersSnapshot.size} orders with shipping labels\n`);

        const isCorreiosCode = (code) => {
            return code && /^[A-Z]{2}\d{9}BR$/.test(code);
        };

        let updatedCount = 0;
        let emailsSent = 0;

        for (const orderDoc of ordersSnapshot.docs) {
            const order = { id: orderDoc.id, ...orderDoc.data() };
            const melhorEnvioId = order.shipping?.melhorEnvioId;

            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`📦 Order: ${order.orderNumber}`);
            console.log(`   ID: ${order.id}`);
            console.log(`   Melhor Envio ID: ${melhorEnvioId}`);
            console.log(`   Current Tracking: ${order.shipping?.trackingCode || 'None'}`);
            console.log(`   Has Correios Code: ${order.shipping?.hasCorreiosCode || false}`);

            try {
                // Fetch shipment details from Melhor Envio
                console.log(`   🔄 Fetching from Melhor Envio...`);

                const response = await axios.get(
                    `${MELHOR_ENVIO_API_URL}/shipments/${melhorEnvioId}`,
                    {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${MELHOR_ENVIO_TOKEN}`,
                            'User-Agent': 'Aplicação (sickgrip.br@gmail.com)'
                        }
                    }
                );

                const shipmentDetails = response.data;
                const hasCorreiosCode = isCorreiosCode(shipmentDetails.tracking);
                const correiosTracking = hasCorreiosCode ? shipmentDetails.tracking : null;
                const trackingCode = correiosTracking || shipmentDetails.protocol;

                console.log(`   📋 Melhor Envio Response:`);
                console.log(`      Protocol: ${shipmentDetails.protocol}`);
                console.log(`      Tracking: ${shipmentDetails.tracking || 'Not assigned'}`);
                console.log(`      Status: ${shipmentDetails.status}`);
                console.log(`      Has Correios Code: ${hasCorreiosCode ? '✅ Yes' : '❌ No'}`);

                // Calculate estimated delivery date
                const deliveryDate = new Date();
                deliveryDate.setDate(deliveryDate.getDate() + (shipmentDetails.delivery_max || 7));

                // Update order in database
                const updateData = {
                    'shipping.trackingCode': trackingCode,
                    'shipping.correiosTracking': correiosTracking,
                    'shipping.melhorEnvioProtocol': shipmentDetails.protocol,
                    'shipping.hasCorreiosCode': hasCorreiosCode,
                    'shipping.estimatedDelivery': deliveryDate,
                    'shipping.deliveryMin': shipmentDetails.delivery_min,
                    'shipping.deliveryMax': shipmentDetails.delivery_max
                };

                // Remove undefined values (Firestore doesn't accept them)
                Object.keys(updateData).forEach(key => {
                    if (updateData[key] === undefined || updateData[key] === null) {
                        delete updateData[key];
                    }
                });

                await db.collection('orders').doc(order.id).update(updateData);
                console.log(`   ✅ Database updated`);
                updatedCount++;

                // Send email if we have Correios code and haven't sent email yet
                if (hasCorreiosCode && !order.shipping?.emailSent) {
                    try {
                        console.log(`   📧 Sending email to ${order.customer?.email}...`);
                        await sendShippingNotification(order, correiosTracking, deliveryDate);

                        // Mark email as sent
                        await db.collection('orders').doc(order.id).update({
                            'shipping.emailSent': true,
                            'shipping.emailSentAt': new Date()
                        });

                        console.log(`   ✅ Email sent successfully!`);
                        emailsSent++;
                    } catch (emailError) {
                        console.error(`   ❌ Error sending email:`, emailError.message);
                    }
                } else if (order.shipping?.emailSent) {
                    console.log(`   ℹ️ Email already sent previously`);
                } else {
                    console.log(`   ⚠️ No Correios code yet, skipping email`);
                }

            } catch (error) {
                console.error(`   ❌ Error processing order:`, error.message);
                if (error.response) {
                    console.error(`      Status: ${error.response.status}`);
                    console.error(`      Data:`, error.response.data);
                }
            }
        }

        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`\n✅ SUMMARY:`);
        console.log(`   Orders processed: ${ordersSnapshot.size}`);
        console.log(`   Orders updated: ${updatedCount}`);
        console.log(`   Emails sent: ${emailsSent}`);
        console.log(`\n✨ Done!`);

    } catch (error) {
        console.error('\n❌ Fatal Error:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

updateAllOrdersTracking();
