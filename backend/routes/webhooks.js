import express from 'express';
import crypto from 'crypto';
import { updateOrderStatus, findOrderByPaymentId } from '../services/dbService.js';
import { getPaymentStatus } from '../services/mercadoPagoService.js';
import { sendOrderStatusUpdate } from '../services/emailService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Verifies the Mercado Pago webhook signature (HMAC-SHA256 over id/request-id/ts),
// per https://www.mercadopago.com.br/developers/en/docs/checkout-api/webhooks#editor_5
// Without this, anyone could POST a forged "payment approved" event for any order.
// Exported for unit testing (backend/routes/webhooks.test.js).
export const isValidSignature = (req, paymentId) => {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) {
        logger.error('❌ MP_WEBHOOK_SECRET não configurado — rejeitando webhook por segurança');
        return false;
    }

    const signatureHeader = req.headers['x-signature'];
    const requestId = req.headers['x-request-id'];
    if (!signatureHeader || !requestId || !paymentId) return false;

    const parts = {};
    for (const part of signatureHeader.split(',')) {
        const [key, value] = part.split('=').map(s => s && s.trim());
        if (key && value) parts[key] = value;
    }
    const { ts, v1 } = parts;
    if (!ts || !v1) return false;

    const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
    const expectedHex = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

    const expectedBuf = Buffer.from(expectedHex, 'hex');
    const receivedBuf = Buffer.from(v1, 'hex');
    if (expectedBuf.length !== receivedBuf.length) return false;
    // Constant-time comparison — avoids leaking the correct signature via timing.
    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
};

// Mercado Pago webhook
router.post('/mercadopago', async (req, res) => {
    try {
        const { type, data } = req.body || {};
        const paymentId = data?.id;

        if (type === 'payment') {
            if (!isValidSignature(req, paymentId)) {
                logger.warn('⚠️ Webhook do Mercado Pago rejeitado: assinatura ausente ou inválida');
                return res.sendStatus(401);
            }

            // Get payment details from Mercado Pago (never trust the status from the body)
            const paymentStatus = await getPaymentStatus(paymentId);

            // Find order by payment ID
            const order = await findOrderByPaymentId(paymentId);

            if (!order) {
                logger.info('⚠️ Order not found for payment ID:', paymentId);
                return res.sendStatus(200);
            }

            // Idempotency: Mercado Pago retries webhooks by design. If the order already
            // reflects this outcome, skip reprocessing (avoids duplicate emails/side-effects).
            const alreadyProcessed =
                (paymentStatus.status === 'approved' && order.status === 'paid') ||
                (paymentStatus.status === 'rejected' && order.status === 'cancelled');

            if (alreadyProcessed) {
                return res.sendStatus(200);
            }

            if (paymentStatus.status === 'approved') {
                await updateOrderStatus(order.id, 'paid');
                try {
                    await sendOrderStatusUpdate(order, 'processing');
                } catch (emailError) {
                    logger.error('❌ Error sending status email:', emailError);
                }
            } else if (paymentStatus.status === 'rejected') {
                await updateOrderStatus(order.id, 'cancelled');
                try {
                    await sendOrderStatusUpdate(order, 'cancelled');
                } catch (emailError) {
                    logger.error('❌ Error sending cancellation email:', emailError);
                }
            }
            // 'pending' and other statuses: no state change needed.
        }

        // Always respond 200 to acknowledge receipt (for valid, recognized events)
        res.sendStatus(200);
    } catch (error) {
        logger.error('❌ Webhook error:', error);
        // Still respond 200 to prevent Mercado Pago from retrying an event we can't process
        res.sendStatus(200);
    }
});

export default router;
