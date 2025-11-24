import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader } from 'lucide-react';

const SalesChart = ({ data, period, loading }) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0
        }).format(value);
    };

    const formatDate = (dateStr) => {
        if (period === 'month') {
            const [year, month] = dateStr.split('-');
            return `${month}/${year}`;
        }
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900 border border-gray-700 p-3 rounded shadow-lg">
                    <p className="text-gray-400 text-sm mb-1">
                        {formatDate(payload[0].payload.date)}
                    </p>
                    <p className="text-harley-orange font-bold">
                        {formatCurrency(payload[0].value)}
                    </p>
                    <p className="text-gray-300 text-sm">
                        {payload[0].payload.orders} pedidos
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-80">
                <Loader className="w-8 h-8 text-harley-orange animate-spin" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-80 text-gray-400">
                Nenhum dado disponível
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    tickFormatter={formatDate}
                />
                <YAxis
                    stroke="#9CA3AF"
                    tickFormatter={formatCurrency}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                    wrapperStyle={{ color: '#9CA3AF' }}
                    formatter={() => 'Vendas'}
                />
                <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#FF6B00"
                    strokeWidth={3}
                    dot={{ fill: '#FF6B00', r: 4 }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default SalesChart;
