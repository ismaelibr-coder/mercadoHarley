import React from 'react';
import { CheckCircle2, Circle, XCircle } from 'lucide-react';

const STEPS = [
    { key: 'paid', label: 'Pago' },
    { key: 'processing', label: 'Processando' },
    { key: 'shipped', label: 'Enviado' },
    { key: 'delivered', label: 'Entregue' }
];

// 'pending' hasn't reached the first real step yet — treated as "before paid".
const STEP_INDEX = { pending: -1, paid: 0, processing: 1, shipped: 2, delivered: 3 };

/**
 * Visual progress of an order, replacing a single status word with something
 * a customer can actually read at a glance — this is one of the top reasons
 * customers message support asking "where is my order".
 */
const OrderStatusTimeline = ({ status }) => {
    if (status === 'cancelled') {
        return (
            <div className="flex items-center gap-2 bg-red-900/30 border border-red-800 text-red-400 rounded p-4 font-bold">
                <XCircle className="w-5 h-5 flex-none" />
                Este pedido foi cancelado.
            </div>
        );
    }

    const currentIndex = STEP_INDEX[status] ?? -1;

    return (
        <ol className="flex items-start" aria-label="Progresso do pedido">
            {STEPS.map((step, index) => {
                const done = index <= currentIndex;
                const isCurrent = index === currentIndex;
                return (
                    <li key={step.key} className="flex-1 flex flex-col items-center relative">
                        {index > 0 && (
                            <div
                                className={`absolute top-3 right-1/2 w-full h-0.5 ${index <= currentIndex ? 'bg-harley-orange' : 'bg-gray-700'}`}
                                aria-hidden="true"
                            />
                        )}
                        {done ? (
                            <CheckCircle2 className="w-6 h-6 text-harley-orange relative z-10 bg-black rounded-full" aria-hidden="true" />
                        ) : (
                            <Circle className="w-6 h-6 text-gray-700 relative z-10 bg-black rounded-full" aria-hidden="true" />
                        )}
                        <span className={`mt-2 text-xs text-center uppercase tracking-wide font-bold ${done ? 'text-white' : 'text-gray-500'}`}>
                            {step.label}
                        </span>
                        {isCurrent && <span className="sr-only"> (etapa atual)</span>}
                    </li>
                );
            })}
        </ol>
    );
};

export default OrderStatusTimeline;
