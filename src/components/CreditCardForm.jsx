import React, { useState, useEffect } from 'react';
import { CreditCard, Lock } from 'lucide-react';

const CreditCardForm = ({ total, onPaymentSuccess, onError }) => {
    const [mp, setMp] = useState(null);
    const [cardNumber, setCardNumber] = useState('');
    const [cardholderName, setCardholderName] = useState('');
    const [expirationDate, setExpirationDate] = useState('');
    const [securityCode, setSecurityCode] = useState('');
    const [installments, setInstallments] = useState(1);
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initialize Mercado Pago SDK
        const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
        if (window.MercadoPago && publicKey) {
            const mercadopago = new window.MercadoPago(publicKey);
            setMp(mercadopago);
        }
    }, []);

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        return parts.length ? parts.join(' ') : value;
    };

    const formatExpirationDate = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.slice(0, 2) + '/' + v.slice(2, 4);
        }
        return v;
    };

    const getPaymentMethod = async (bin) => {
        if (!mp || bin.length < 6) return;

        try {
            const paymentMethods = await mp.getPaymentMethods({ bin });
            if (paymentMethods.results.length > 0) {
                setPaymentMethodId(paymentMethods.results[0].id);
            }
        } catch (error) {
            console.error('Error getting payment method:', error);
        }
    };

    const handleCardNumberChange = (e) => {
        const formatted = formatCardNumber(e.target.value);
        setCardNumber(formatted);

        const bin = formatted.replace(/\s/g, '').slice(0, 6);
        if (bin.length === 6) {
            getPaymentMethod(bin);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!mp) {
                throw new Error('Mercado Pago não inicializado');
            }

            // Create card token
            const cardData = {
                cardNumber: cardNumber.replace(/\s/g, ''),
                cardholderName,
                cardExpirationMonth: expirationDate.split('/')[0],
                cardExpirationYear: '20' + expirationDate.split('/')[1],
                securityCode,
                identificationType: 'CPF',
                identificationNumber: '00000000000' // This should come from customer data
            };

            const token = await mp.createCardToken(cardData);

            // Call parent callback with token and installments
            await onPaymentSuccess({
                token: token.id,
                installments: parseInt(installments),
                paymentMethodId
            });

        } catch (error) {
            console.error('Error creating card token:', error);
            onError(error.message || 'Erro ao processar cartão');
        } finally {
            setLoading(false);
        }
    };

    const installmentOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const installmentValue = total / installments;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="text-sick-red" size={24} />
                    <h3 className="text-white font-bold">Dados do Cartão</h3>
                </div>

                {/* Card Number */}
                <div className="mb-4">
                    <label className="block text-gray-400 text-sm mb-2">Número do Cartão</label>
                    <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="0000 0000 0000 0000"
                        maxLength="19"
                        required
                        className="w-full bg-gray-800 text-white px-4 py-3 rounded border border-gray-700 focus:border-sick-red focus:outline-none"
                    />
                </div>

                {/* Cardholder Name */}
                <div className="mb-4">
                    <label className="block text-gray-400 text-sm mb-2">Nome no Cartão</label>
                    <input
                        type="text"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                        placeholder="NOME COMO NO CARTÃO"
                        required
                        className="w-full bg-gray-800 text-white px-4 py-3 rounded border border-gray-700 focus:border-sick-red focus:outline-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Expiration Date */}
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">Validade</label>
                        <input
                            type="text"
                            value={expirationDate}
                            onChange={(e) => setExpirationDate(formatExpirationDate(e.target.value))}
                            placeholder="MM/AA"
                            maxLength="5"
                            required
                            className="w-full bg-gray-800 text-white px-4 py-3 rounded border border-gray-700 focus:border-sick-red focus:outline-none"
                        />
                    </div>

                    {/* CVV */}
                    <div>
                        <label className="block text-gray-400 text-sm mb-2">CVV</label>
                        <input
                            type="text"
                            value={securityCode}
                            onChange={(e) => setSecurityCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="000"
                            maxLength="4"
                            required
                            className="w-full bg-gray-800 text-white px-4 py-3 rounded border border-gray-700 focus:border-sick-red focus:outline-none"
                        />
                    </div>
                </div>

                {/* Installments */}
                <div className="mb-4">
                    <label className="block text-gray-400 text-sm mb-2">Parcelas</label>
                    <select
                        value={installments}
                        onChange={(e) => setInstallments(e.target.value)}
                        className="w-full bg-gray-800 text-white px-4 py-3 rounded border border-gray-700 focus:border-sick-red focus:outline-none"
                    >
                        {installmentOptions.map(num => (
                            <option key={num} value={num}>
                                {num}x de R$ {installmentValue.toFixed(2)}
                                {num === 1 ? ' à vista' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Security Notice */}
                <div className="flex items-center gap-2 text-green-500 text-sm">
                    <Lock size={16} />
                    <span>Pagamento seguro via Mercado Pago</span>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || !paymentMethodId}
                className="w-full bg-sick-red text-white py-4 rounded font-bold uppercase hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Processando...' : `Pagar R$ ${total.toFixed(2)}`}
            </button>
        </form>
    );
};

export default CreditCardForm;
