import React from 'react';

const BestSellersTable = ({ products, loading }) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    if (loading) {
        return (
            <div className="text-center py-8 text-gray-400">
                Carregando...
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                Nenhum produto vendido ainda
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-gray-800">
                        <th className="text-left p-4 text-gray-400 font-bold uppercase text-sm">#</th>
                        <th className="text-left p-4 text-gray-400 font-bold uppercase text-sm">Produto</th>
                        <th className="text-right p-4 text-gray-400 font-bold uppercase text-sm">Qtd Vendida</th>
                        <th className="text-right p-4 text-gray-400 font-bold uppercase text-sm">Receita</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product, index) => (
                        <tr key={product.id || index} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                            <td className="p-4">
                                <span className="text-harley-orange font-bold text-lg">
                                    {index + 1}
                                </span>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    {product.image && (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                    )}
                                    <span className="text-white font-medium">
                                        {product.name}
                                    </span>
                                </div>
                            </td>
                            <td className="p-4 text-right">
                                <span className="text-white font-bold">
                                    {product.quantitySold}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <span className="text-green-500 font-bold">
                                    {formatCurrency(product.revenue)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default BestSellersTable;
