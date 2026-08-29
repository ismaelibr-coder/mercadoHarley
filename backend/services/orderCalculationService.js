import { Product } from '../models/index.js';
import { calculateMelhorEnvioShipping } from './melhorEnvioService.js';
import logger from '../utils/logger.js';

// Same discount rule the frontend displays (CheckoutPage.jsx), enforced here so it
// can never be overridden by the client.
const PIX_DISCOUNT_RATE = 0.05;
const STORE_PICKUP_METHOD = 'Retirar na Loja';
const DEFAULT_ITEM_WEIGHT_KG = 1; // mirrors the frontend's `item.weight || 1` fallback

/**
 * Re-derives the shipping price server-side — never trusts shipping.price sent by
 * the client. In-store pickup is always free (not attacker-controlled: there's
 * nothing to manipulate, the price is hardcoded here, not read from the request).
 * Any other method must match a service id from a FRESH Melhor Envio quote —
 * computed now, from the verified items' own weight, not from whatever the client
 * echoed back — so a forged/stale price or serviceId is simply never used.
 */
const resolveShippingPrice = async (shipping, verifiedItems) => {
    if (!shipping || typeof shipping !== 'object') {
        return { price: 0, method: STORE_PICKUP_METHOD };
    }

    if (shipping.method === STORE_PICKUP_METHOD) {
        return { price: 0, method: STORE_PICKUP_METHOD };
    }

    const cep = String(shipping.cep || shipping.zipCode || '').replace(/\D/g, '');
    if (cep.length !== 8) {
        throw new Error('CEP de entrega inválido para calcular o frete');
    }

    const totalWeight = verifiedItems.reduce(
        (sum, item) => sum + (Number(item.weight) || DEFAULT_ITEM_WEIGHT_KG) * item.quantity,
        0
    );

    const options = await calculateMelhorEnvioShipping(cep, totalWeight || DEFAULT_ITEM_WEIGHT_KG);
    if (!options || options.length === 0) {
        logger.error('❌ Não foi possível revalidar o frete no servidor (Melhor Envio indisponível)');
        throw new Error('Não foi possível confirmar o frete. Tente recalcular o frete e finalizar o pedido novamente.');
    }

    const matched = shipping.serviceId
        ? options.find((opt) => opt.id === shipping.serviceId)
        : null;

    if (!matched) {
        logger.warn('⚠️ Cotação de frete enviada pelo cliente não confere com nenhuma opção válida — rejeitando');
        throw new Error('A opção de frete selecionada expirou ou é inválida. Recalcule o frete e tente novamente.');
    }

    // Always the server's own fresh price for that service — the client's number is
    // never used, even if it happened to match.
    return { price: matched.price, method: matched.name };
};

/**
 * Recomputes subtotal/discount/shipping/total for an order from trusted server-side
 * data. Never trusts item prices, totals, or shipping cost sent by the client —
 * every unit price is re-read from Product.price, and shipping is re-quoted fresh.
 *
 * @param {Array<{id: string, quantity: number}>} items - items as sent by the client (id/quantity only are trusted)
 * @param {{ shipping?: object, paymentMethod?: string }} options
 * @returns {Promise<{ subtotal: number, discount: number, shipping: number, total: number, items: Array }>}
 */
export const calculateOrderTotal = async (items, { shipping, paymentMethod } = {}) => {
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
            weight: product.weight,
            quantity,
            image: product.images?.[0] || item.image
        });
    }

    const { price: shippingPrice } = await resolveShippingPrice(shipping, verifiedItems);
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
