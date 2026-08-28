import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';
import { isValidSignature } from './webhooks.js';

const SECRET = 'test-webhook-secret';

const buildSignedRequest = ({ secret = SECRET, paymentId = '123456789', requestId = 'req-abc', ts = String(Date.now()), tamperV1 = false } = {}) => {
    const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`;
    let v1 = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
    if (tamperV1) {
        v1 = v1.split('').reverse().join(''); // corrupt it, same length
    }
    return {
        req: {
            headers: {
                'x-signature': `ts=${ts},v1=${v1}`,
                'x-request-id': requestId
            }
        },
        paymentId
    };
};

describe('isValidSignature (Mercado Pago webhook)', () => {
    const originalSecret = process.env.MP_WEBHOOK_SECRET;

    beforeEach(() => {
        process.env.MP_WEBHOOK_SECRET = SECRET;
    });

    afterEach(() => {
        process.env.MP_WEBHOOK_SECRET = originalSecret;
    });

    it('accepts a correctly signed request', () => {
        const { req, paymentId } = buildSignedRequest();
        expect(isValidSignature(req, paymentId)).toBe(true);
    });

    it('rejects when MP_WEBHOOK_SECRET is not configured (fail closed)', () => {
        delete process.env.MP_WEBHOOK_SECRET;
        const { req, paymentId } = buildSignedRequest();
        expect(isValidSignature(req, paymentId)).toBe(false);
    });

    it('rejects a request with no x-signature header at all (the pre-fix behavior)', () => {
        const { paymentId } = buildSignedRequest();
        const req = { headers: { 'x-request-id': 'req-abc' } };
        expect(isValidSignature(req, paymentId)).toBe(false);
    });

    it('rejects a request missing x-request-id', () => {
        const { req, paymentId } = buildSignedRequest();
        delete req.headers['x-request-id'];
        expect(isValidSignature(req, paymentId)).toBe(false);
    });

    it('rejects a tampered signature', () => {
        const { req, paymentId } = buildSignedRequest({ tamperV1: true });
        expect(isValidSignature(req, paymentId)).toBe(false);
    });

    it('rejects a signature computed for a different paymentId (forged event)', () => {
        const { req } = buildSignedRequest({ paymentId: '123456789' });
        expect(isValidSignature(req, '999999999')).toBe(false);
    });

    it('rejects a signature signed with the wrong secret', () => {
        const { req, paymentId } = buildSignedRequest({ secret: 'someone-elses-secret' });
        expect(isValidSignature(req, paymentId)).toBe(false);
    });
});
