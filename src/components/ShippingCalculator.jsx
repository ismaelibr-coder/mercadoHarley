import React, { useState } from 'react';
import { Truck, Loader2, AlertCircle } from 'lucide-react';
import { calculateShipping } from '../services/shippingService';

const ShippingCalculator = ({ productWeight = 1 }) => {
    const [cep, setCep] = useState('');
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const formatCEP = (value) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 5) {
            return numbers;
        }
        return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
    };

    const handleCEPChange = (e) => {
        const formatted = formatCEP(e.target.value);
        setCep(formatted);
        setError('');
    };

    const handleCalculate = async () => {
        if (cep.replace(/\D/g, '').length !== 8) {
            setError('CEP inválido');
            return;
        }

        setLoading(true);
        setError('');
        setOptions([]);

        try {
            const result = await calculateShipping(cep, productWeight);

            if (result.length === 0) {
                setError('Nenhuma opção de frete disponível para este CEP');
            } else {
                setOptions(result);
            }
        } catch (err) {
            setError(err.message || 'Erro ao calcular frete');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleCalculate();
        }
    };

    return (
        <div className="border border-gray-700 rounded-lg p-4 bg-gray-800">
            <div className="flex items-center gap-2 mb-3">
                <Truck className="text-harley-orange" size={20} />
                <h3 className="font-bold text-white">Calcular Frete</h3>
            </div>

            <div className="flex gap-2 mb-3">
                <input
                    type="text"
                    placeholder="00000-000"
                    value={cep}
                    onChange={handleCEPChange}
                    onKeyPress={handleKeyPress}
                    maxLength={9}
                    className="flex-1 border border-gray-600 rounded px-3 py-2 bg-gray-900 text-white focus:outline-none focus:border-harley-orange"
                />
                <button
                    onClick={handleCalculate}
                    disabled={loading || cep.replace(/\D/g, '').length !== 8}
                    className="bg-harley-orange text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin" size={16} />
                            Calculando...
                        </>
                    ) : (
                        'Calcular'
                    )}
                </button>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm mb-3">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            {options.length > 0 && (
                <div className="space-y-2">
                    {options.map((option) => (
                        <div
                            key={option.id}
                            className="border-t border-gray-700 pt-2 flex justify-between items-center"
                        >
                            <div>
                                <p className="font-semibold text-white">{option.name}</p>
                                <p className="text-sm text-gray-400">
                                    Entrega em {option.deliveryDays} dias úteis
                                </p>
                            </div>
                            <p className="text-harley-orange font-bold">
                                R$ {option.price.toFixed(2)}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {options.length === 0 && !loading && !error && (
                <p className="text-sm text-gray-400">
                    Digite seu CEP para calcular o frete
                </p>
            )}
        </div>
    );
};

export default ShippingCalculator;
