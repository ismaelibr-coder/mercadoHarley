/**
 * The one place that turns a price into "R$ 1.299,00" — every component
 * showing a monetary value should go through this instead of rolling its
 * own `.toFixed(2)` (which is US-locale-shaped: "1299.00", no thousand
 * separator, dot instead of comma, no currency symbol on its own).
 *
 * Accepts a number or a numeric string (prices coming straight off a
 * Sequelize DECIMAL column arrive as strings — see backend/models/Order.js)
 * and always returns a real "R$ X.XXX,XX" string, never NaN/undefined text.
 */
export const formatCurrency = (value) => {
    const number = typeof value === 'number' ? value : parseFloat(value);
    if (Number.isNaN(number)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(number);
};

export default formatCurrency;
