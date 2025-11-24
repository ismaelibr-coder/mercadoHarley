import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricCard = ({ icon: Icon, label, value, trend, format = 'number' }) => {
    const formatValue = (val) => {
        if (format === 'currency') {
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(val);
        }
        return val.toLocaleString('pt-BR');
    };

    const getTrendIcon = () => {
        if (!trend || trend === 0) return <Minus className="w-4 h-4" />;
        return trend > 0
            ? <TrendingUp className="w-4 h-4" />
            : <TrendingDown className="w-4 h-4" />;
    };

    const getTrendColor = () => {
        if (!trend || trend === 0) return 'text-gray-400';
        return trend > 0 ? 'text-green-500' : 'text-red-500';
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-harley-orange transition-colors">
            <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-harley-orange/10 rounded-lg">
                    <Icon className="w-6 h-6 text-harley-orange" />
                </div>
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 ${getTrendColor()}`}>
                        {getTrendIcon()}
                        <span className="text-sm font-bold">
                            {Math.abs(trend).toFixed(1)}%
                        </span>
                    </div>
                )}
            </div>
            <div>
                <p className="text-gray-400 text-sm uppercase tracking-wide mb-1">
                    {label}
                </p>
                <p className="text-white text-3xl font-bold font-display">
                    {formatValue(value)}
                </p>
            </div>
        </div>
    );
};

export default MetricCard;
