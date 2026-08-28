import { Product } from '../models/index.js';

// Same discount rule the frontend displays (CheckoutPage.jsx), enforced here so it
// can never be overridden by the client.
const PIX_DISCOUNT_RATE = 0.05;

/**
 * Recomputes subtotal/discount/total for an order from trusted server-side data.
 * Never trusts item prices or totals sent by the client — every unit price is
 * re-read from Product.price in the database.
 *
 * @param {Array<{id: string, quantity: number}>} items - items as sent by the client (id/quantity only are trusted)
 * @param {{ shippingPrice?: number, paymentMethod?: string }} options
 * @returns {Promise<{ subtotal: number, discount: number, shipping: number, total: number, items: Array }>}
 */
export const calculateOrderTotal = async (items, { shippingPrice = 0, paymentMethod } = {}) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error('Pedido sem itens');
    }

    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
        const product = await Product.findByPk(item.id);
        if (!product) {
            throw new Error(`Produto ${item.name || item.id} não encontrado`);
        }

        const quantity = Number(item.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new Error(`Quantidade inválida para ${product.name}`);
        }

        const unitPrice = Number(product.price);
        subtotal += unitPrice * quantity;

        verifiedItems.push({
            ...item,
            name: product.name,
            price: unitPrice,
            quantity,
            image: product.images?.[0] || item.image
        });
    }

    const normalizedShipping = Number(shippingPrice) || 0;
    const discount = paymentMethod === 'pix' ? subtotal * PIX_DISCOUNT_RATE : 0;
    const total = subtotal - discount + normalizedShipping;

    return {
        subtotal: Number(subtotal.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        shipping: Number(normalizedShipping.toFixed(2)),
        total: Number(total.toFixed(2)),
        items: verifiedItems
    };
};

export default { calculateOrderTotal };
