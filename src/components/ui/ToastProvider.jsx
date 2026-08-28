import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const VARIANTS = {
    success: { icon: CheckCircle2, className: 'border-green-700 bg-green-900/90 text-green-100' },
    error: { icon: XCircle, className: 'border-red-700 bg-red-900/90 text-red-100' },
    warning: { icon: AlertTriangle, className: 'border-yellow-700 bg-yellow-900/90 text-yellow-100' },
    info: { icon: Info, className: 'border-gray-700 bg-gray-900/95 text-gray-100' }
};

const DEFAULT_DURATION = 5000;

/**
 * Replaces native alert()/confirm() feedback across the app with a
 * non-blocking, dismissible toast — the same information, without freezing
 * the page behind a browser-native dialog.
 *
 * Usage: const { showToast } = useToast(); showToast('Mensagem', { type: 'error' })
 */
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const idRef = useRef(0);

    const dismissToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message, { type = 'info', duration = DEFAULT_DURATION } = {}) => {
        const id = ++idRef.current;
        setToasts((prev) => [...prev, { id, message, type }]);
        if (duration > 0) {
            setTimeout(() => dismissToast(id), duration);
        }
        return id;
    }, [dismissToast]);

    return (
        <ToastContext.Provider value={{ showToast, dismissToast }}>
            {children}
            <div
                className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm"
                role="region"
                aria-label="Notificações"
            >
                {toasts.map((toast) => {
                    const variant = VARIANTS[toast.type] || VARIANTS.info;
                    const Icon = variant.icon;
                    return (
                        <div
                            key={toast.id}
                            role={toast.type === 'error' || toast.type === 'warning' ? 'alert' : 'status'}
                            aria-live={toast.type === 'error' || toast.type === 'warning' ? 'assertive' : 'polite'}
                            className={`flex items-start gap-3 border rounded-lg px-4 py-3 shadow-xl backdrop-blur-sm ${variant.className}`}
                        >
                            <Icon className="w-5 h-5 flex-none mt-0.5" aria-hidden="true" />
                            <p className="text-sm flex-1">{toast.message}</p>
                            <button
                                type="button"
                                onClick={() => dismissToast(toast.id)}
                                aria-label="Fechar notificação"
                                className="flex-none text-current opacity-70 hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return ctx;
};

export default ToastProvider;
