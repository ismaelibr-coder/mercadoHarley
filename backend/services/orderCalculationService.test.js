import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/index.js', () => ({
    Product: {
        findByPk: vi.fn()
    }
}));

vi.mock('./melhorEnvioService.js', () => ({
    calculateMelhorEnvioShipping: vi.fn()
}));

import { Product } from '../models/index.js';
import { calculateMelhorEnvioShipping } from './melhorEnvioService.js';
import { calculateOrderTotal } from './orderCalculationService.js';

// In-store pickup skips the Melhor Envio re-quote entirely — the simplest shipping
// shape for tests that don't care about shipping cost itself.
const PICKUP = { method: 'Retirar na Loja' };

describe('calculateOrderTotal', () => {
    beforeEach(() => {
        Product.findByPk.mockReset();
        calculateMelhorEnvioShipping.mockReset();
    });

    it('recalculates subtotal/total from the real product price, ignoring any price sent by the client', async () => {
        Product.findByPk.mockImplementation(async (id) => {
            if (id === 'prod-1') return { name: 'Guidão', price: 100, images: [] };
            return null;
        });

        const result = await calculateOrderTotal(
            [{ id: 'prod-1', quantity: 2, price: 0.01 }], // attacker-controlled price, must be ignored
            { shipping: PICKUP, paymentMethod: 'boleto' }
        );

        expect(result.subtotal).toBe(200);
        expect(result.discount).toBe(0);
        expect(result.total).toBe(200);
        expect(result.items[0].price).toBe(100);
    });

    it('applies the 5% PIX discount on subtotal only, not on shipping', async () => {
        Product.findByPk.mockResolvedValue({ name: 'Capacete', price: 100, images: [] });
        calculateMelhorEnvioShipping.mockResolvedValue([
            { id: 'me_1', name: 'PAC', price: 30 }
        ]);

        const result = await calculateOrderTotal(
            [{ id: 'prod-1', quantity: 1 }],
            { shipping: { cep: '91030-170', serviceId: 'me_1' }, paymentMethod: 'pix' }
        );

        expect(result.subtotal).toBe(100);
        expect(result.discount).toBe(5);
        expect(result.shipping).toBe(30);
        expect(result.total).toBe(125); // 100 - 5 + 30
    });

    it('applies no discount for boleto/credit_card', async () => {
        Product.findByPk.mockResolvedValue({ name: 'Jaqueta', price: 200, images: [] });

        const result = await calculateOrderTotal(
            [{ id: 'prod-1', quantity: 1 }],
            { shipping: PICKUP, paymentMethod: 'credit_card' }
        );

        expect(result.discount).toBe(0);
        expect(result.total).toBe(200);
    });

    it('sums multiple line items correctly', async () => {
        Product.findByPk.mockImplementation(async (id) => ({
            'a': { name: 'A', price: 10, images: [] },
            'b': { name: 'B', price: 25, images: [] }
        }[id]));

        const result = await calculateOrderTotal(
            [{ id: 'a', quantity: 3 }, { id: 'b', quantity: 2 }],
            { shipping: PICKUP, paymentMethod: 'boleto' }
        );

        expect(result.subtotal).toBe(80); // 3*10 + 2*25
    });

    it('rejects an order referencing a product that does not exist', async () => {
        Product.findByPk.mockResolvedValue(null);

        await expect(
            calculateOrderTotal([{ id: 'ghost', quantity: 1 }], { shipping: PICKUP, paymentMethod: 'pix' })
        ).rejects.toThrow(/não encontrado/);
    });

    it('rejects a non-positive quantity', async () => {
        Product.findByPk.mockResolvedValue({ name: 'Luva', price: 50, images: [] });

        await expect(
            calculateOrderTotal([{ id: 'prod-1', quantity: 0 }], { shipping: PICKUP, paymentMethod: 'pix' })
        ).rejects.toThrow(/[Qq]uantidade inválida/);
    });

    it('rejects an empty item list', async () => {
        await expect(calculateOrderTotal([], {})).rejects.toThrow(/sem itens/);
    });

    describe('shipping price — never trusts the client', () => {
        beforeEach(() => {
            Product.findByPk.mockResolvedValue({ name: 'Pneu', price: 100, images: [], weight: 2 });
        });

        it('treats in-store pickup as always free, regardless of any price the client sends', async () => {
            const result = await calculateOrderTotal(
                [{ id: 'prod-1', quantity: 1 }],
                { shipping: { method: 'Retirar na Loja', price: 999 }, paymentMethod: 'pix' }
            );

            expect(calculateMelhorEnvioShipping).not.toHaveBeenCalled();
            expect(result.shipping).toBe(0);
        });

        it('ignores the price the client sent and uses the fresh quote for the matched service', async () => {
            calculateMelhorEnvioShipping.mockResolvedValue([
                { id: 'me_1', name: 'PAC', price: 42.5 },
                { id: 'me_2', name: 'SEDEX', price: 80 }
            ]);

            const result = await calculateOrderTotal(
                [{ id: 'prod-1', quantity: 1 }],
                { shipping: { cep: '91030170', serviceId: 'me_1', price: 0.01 }, paymentMethod: 'boleto' }
            );

            expect(result.shipping).toBe(42.5);
            expect(result.total).toBe(142.5);
        });

        it('rejects a serviceId that does not match any current Melhor Envio quote (forged/stale)', async () => {
            calculateMelhorEnvioShipping.mockResolvedValue([
                { id: 'me_1', name: 'PAC', price: 42.5 }
            ]);

            await expect(
                calculateOrderTotal(
                    [{ id: 'prod-1', quantity: 1 }],
                    { shipping: { cep: '91030170', serviceId: 'me_forged', price: 0 }, paymentMethod: 'boleto' }
                )
            ).rejects.toThrow(/frete/i);
        });

        it('rejects a malformed CEP instead of silently defaulting shipping to zero', async () => {
            await expect(
                calculateOrderTotal(
                    [{ id: 'prod-1', quantity: 1 }],
                    { shipping: { cep: '123', serviceId: 'me_1' }, paymentMethod: 'boleto' }
                )
            ).rejects.toThrow(/CEP/i);

            expect(calculateMelhorEnvioShipping).not.toHaveBeenCalled();
        });

        it('rejects when Melhor Envio is unavailable instead of falling back to a free/unverified shipment', async () => {
            calculateMelhorEnvioShipping.mockResolvedValue(null);

            await expect(
                calculateOrderTotal(
                    [{ id: 'prod-1', quantity: 1 }],
                    { shipping: { cep: '91030170', serviceId: 'me_1' }, paymentMethod: 'boleto' }
                )
            ).rejects.toThrow(/frete/i);
        });
    });
});
