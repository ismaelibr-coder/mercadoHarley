import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../models/index.js', () => ({
    Product: {
        findByPk: vi.fn()
    }
}));

import { Product } from '../models/index.js';
import { calculateOrderTotal } from './orderCalculationService.js';

describe('calculateOrderTotal', () => {
    beforeEach(() => {
        Product.findByPk.mockReset();
    });

    it('recalculates subtotal/total from the real product price, ignoring any price sent by the client', async () => {
        Product.findByPk.mockImplementation(async (id) => {
            if (id === 'prod-1') return { name: 'Guidão', price: 100, images: [] };
            return null;
        });

        const result = await calculateOrderTotal(
            [{ id: 'prod-1', quantity: 2, price: 0.01 }], // attacker-controlled price, must be ignored
            { shippingPrice: 20, paymentMethod: 'boleto' }
        );

        expect(result.subtotal).toBe(200);
        expect(result.discount).toBe(0);
        expect(result.total).toBe(220);
        expect(result.items[0].price).toBe(100);
    });

    it('applies the 5% PIX discount on subtotal only, not on shipping', async () => {
        Product.findByPk.mockResolvedValue({ name: 'Capacete', price: 100, images: [] });

        const result = await calculateOrderTotal(
            [{ id: 'prod-1', quantity: 1 }],
            { shippingPrice: 30, paymentMethod: 'pix' }
        );

        expect(result.subtotal).toBe(100);
        expect(result.discount).toBe(5);
        expect(result.total).toBe(125); // 100 - 5 + 30
    });

    it('applies no discount for boleto/credit_card', async () => {
        Product.findByPk.mockResolvedValue({ name: 'Jaqueta', price: 200, images: [] });

        const result = await calculateOrderTotal(
            [{ id: 'prod-1', quantity: 1 }],
            { paymentMethod: 'credit_card' }
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
            { paymentMethod: 'boleto' }
        );

        expect(result.subtotal).toBe(80); // 3*10 + 2*25
    });

    it('rejects an order referencing a product that does not exist', async () => {
        Product.findByPk.mockResolvedValue(null);

        await expect(
            calculateOrderTotal([{ id: 'ghost', quantity: 1 }], { paymentMethod: 'pix' })
        ).rejects.toThrow(/não encontrado/);
    });

    it('rejects a non-positive quantity', async () => {
        Product.findByPk.mockResolvedValue({ name: 'Luva', price: 50, images: [] });

        await expect(
            calculateOrderTotal([{ id: 'prod-1', quantity: 0 }], { paymentMethod: 'pix' })
        ).rejects.toThrow(/[Qq]uantidade inválida/);
    });

    it('rejects an empty item list', async () => {
        await expect(calculateOrderTotal([], {})).rejects.toThrow(/sem itens/);
    });
});
