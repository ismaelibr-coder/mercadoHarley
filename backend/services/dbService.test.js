import { describe, it, expect, vi, beforeEach } from 'vitest';

// A fake transaction object exposing the same LOCK.UPDATE shape Sequelize provides,
// so we can assert the real lock constant is what gets passed to findByPk — not a
// stand-in string that would pass even if the code stopped using a real row lock.
const LOCK_UPDATE = Symbol('LOCK.UPDATE');
const makeFakeTransaction = () => ({ LOCK: { UPDATE: LOCK_UPDATE }, commit: vi.fn(), rollback: vi.fn() });

vi.mock('../config/database.js', () => ({
    testDatabaseConnection: vi.fn()
}));

vi.mock('../models/index.js', () => ({
    sequelize: { transaction: vi.fn(), query: vi.fn() },
    User: {},
    Product: { findByPk: vi.fn() },
    Order: { findByPk: vi.fn() },
    Banner: {},
    AuditLog: {}
}));

import { sequelize, Product, Order } from '../models/index.js';
import { updateOrderStatus, findOrderByPaymentId } from './dbService.js';

const makeProduct = (stock) => ({
    stock,
    update: vi.fn(function (data) { this.stock = data.stock; return Promise.resolve(this); })
});

const makeOrder = (status, items) => ({
    id: 'ord-1',
    status,
    items,
    update: vi.fn(function (data) { Object.assign(this, data); return Promise.resolve(this); }),
    toJSON: function () { return { id: this.id, status: this.status, items: this.items }; }
});

describe('updateOrderStatus — locking and idempotency', () => {
    let transaction;

    beforeEach(() => {
        transaction = makeFakeTransaction();
        sequelize.transaction.mockResolvedValue(transaction);
        Order.findByPk.mockReset();
        Product.findByPk.mockReset();
    });

    it('locks the order row with SELECT ... FOR UPDATE (LOCK.UPDATE), not a plain read', async () => {
        const order = makeOrder('pending', [{ id: 'p1', quantity: 1 }]);
        Order.findByPk.mockResolvedValue(order);
        Product.findByPk.mockResolvedValue(makeProduct(5));

        await updateOrderStatus('ord-1', 'paid');

        expect(Order.findByPk).toHaveBeenCalledWith('ord-1', expect.objectContaining({
            lock: LOCK_UPDATE
        }));
    });

    it('locks each product row with SELECT ... FOR UPDATE while adjusting stock', async () => {
        const order = makeOrder('pending', [{ id: 'p1', quantity: 2 }]);
        Order.findByPk.mockResolvedValue(order);
        Product.findByPk.mockResolvedValue(makeProduct(5));

        await updateOrderStatus('ord-1', 'paid');

        expect(Product.findByPk).toHaveBeenCalledWith('p1', expect.objectContaining({
            lock: LOCK_UPDATE
        }));
    });

    it('decrements stock on a genuine pending -> paid transition', async () => {
        const order = makeOrder('pending', [{ id: 'p1', quantity: 2 }]);
        Order.findByPk.mockResolvedValue(order);
        const product = makeProduct(5);
        Product.findByPk.mockResolvedValue(product);

        await updateOrderStatus('ord-1', 'paid');

        expect(product.update).toHaveBeenCalledWith({ stock: 3 }, expect.anything());
    });

    it('never decrements stock twice for the same order (duplicate webhook: paid -> paid)', async () => {
        // previousStatus is already 'paid' — this simulates the exact scenario where
        // Mercado Pago redelivers the same webhook event and updateOrderStatus runs
        // again for an order that already transitioned.
        const order = makeOrder('paid', [{ id: 'p1', quantity: 2 }]);
        Order.findByPk.mockResolvedValue(order);
        const product = makeProduct(3);
        Product.findByPk.mockResolvedValue(product);

        await updateOrderStatus('ord-1', 'paid');

        expect(product.update).not.toHaveBeenCalled();
    });

    it('restores stock on paid -> cancelled', async () => {
        const order = makeOrder('paid', [{ id: 'p1', quantity: 2 }]);
        Order.findByPk.mockResolvedValue(order);
        const product = makeProduct(3);
        Product.findByPk.mockResolvedValue(product);

        await updateOrderStatus('ord-1', 'cancelled');

        expect(product.update).toHaveBeenCalledWith({ stock: 5 }, expect.anything());
    });

    it('rolls back the transaction and rethrows if the order does not exist', async () => {
        Order.findByPk.mockResolvedValue(null);

        await expect(updateOrderStatus('ghost', 'paid')).rejects.toThrow(/not found/i);
        expect(transaction.rollback).toHaveBeenCalled();
        expect(transaction.commit).not.toHaveBeenCalled();
    });

    it('sets err.status = 404 on "not found" so the central errorHandler responds 404, not 500', async () => {
        Order.findByPk.mockResolvedValue(null);

        try {
            await updateOrderStatus('ghost', 'paid');
            expect.unreachable('should have thrown');
        } catch (err) {
            expect(err.status).toBe(404);
        }
    });
});

describe('findOrderByPaymentId — single query, both id shapes', () => {
    beforeEach(() => {
        sequelize.query.mockReset();
    });

    it('queries with a null numeric replacement (not NaN) for a non-numeric payment id', async () => {
        sequelize.query.mockResolvedValue([]);

        await findOrderByPaymentId('mock_pix_1730000000000');

        const [, options] = sequelize.query.mock.calls[0];
        // NaN would serialize to the bare SQL token `NaN`, a syntax error — must be null.
        expect(options.replacements).toEqual(['mock_pix_1730000000000', null]);
    });

    it('queries with both string and numeric forms for a numeric payment id', async () => {
        sequelize.query.mockResolvedValue([]);

        await findOrderByPaymentId('123456789');

        const [, options] = sequelize.query.mock.calls[0];
        expect(options.replacements).toEqual(['123456789', 123456789]);
    });

    it('parses JSON string columns on the matched row', async () => {
        sequelize.query.mockResolvedValue([{
            id: 'ord-1',
            items: '[{"id":"p1"}]',
            payment: '{"paymentId":"123"}',
            shipping: '{"city":"Porto Alegre"}'
        }]);

        const result = await findOrderByPaymentId('123');

        expect(result.items).toEqual([{ id: 'p1' }]);
        expect(result.payment).toEqual({ paymentId: '123' });
        expect(result.shipping).toEqual({ city: 'Porto Alegre' });
    });

    it('returns null when nothing matches', async () => {
        sequelize.query.mockResolvedValue([]);

        expect(await findOrderByPaymentId('nope')).toBeNull();
    });
});
