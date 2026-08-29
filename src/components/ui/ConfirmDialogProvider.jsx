import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext(null);
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Replaces native window.confirm() with a non-blocking, accessible modal —
 * same yes/no decision, without freezing the page behind a browser-native
 * dialog. Dialog semantics (focus trap, Escape to cancel, focus return)
 * mirror CartSidebar's pattern.
 *
 * Usage: const confirm = useConfirm();
 *        if (!(await confirm('Excluir este item?'))) return;
 */
export const ConfirmDialogProvider = ({ children }) => {
    const [request, setRequest] = useState(null);
    const dialogRef = useRef(null);
    const cancelButtonRef = useRef(null);
    const previouslyFocusedRef = useRef(null);

    const confirm = useCallback((message, options = {}) => {
        return new Promise((resolve) => {
            setRequest({ message, options, resolve });
        });
    }, []);

    const settle = useCallback((result) => {
        setRequest((current) => {
            current?.resolve(result);
            return null;
        });
    }, []);

    useEffect(() => {
        if (!request) return undefined;

        previouslyFocusedRef.current = document.activeElement;
        cancelButtonRef.current?.focus();

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                settle(false);
                return;
            }
            if (e.key === 'Tab' && dialogRef.current) {
                const focusable = dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR);
                if (focusable.length === 0) return;
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            if (previouslyFocusedRef.current && typeof previouslyFocusedRef.current.focus === 'function') {
                previouslyFocusedRef.current.focus();
            }
        };
    }, [request, settle]);

    const { message, options } = request || {};
    const {
        confirmText = 'Confirmar',
        cancelText = 'Cancelar',
        variant = 'danger'
    } = options || {};

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {request && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => settle(false)}
                        aria-hidden="true"
                    ></div>
                    <div
                        ref={dialogRef}
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="confirm-dialog-message"
                        className="relative bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-sm p-6"
                    >
                        <div className="flex items-start gap-3 mb-6">
                            <AlertTriangle className={`w-6 h-6 flex-none mt-0.5 ${variant === 'danger' ? 'text-red-500' : 'text-yellow-500'}`} aria-hidden="true" />
                            <p id="confirm-dialog-message" className="text-white text-sm leading-relaxed">{message}</p>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                ref={cancelButtonRef}
                                type="button"
                                onClick={() => settle(false)}
                                className="px-4 py-2 rounded font-bold text-sm uppercase text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                type="button"
                                onClick={() => settle(true)}
                                className={`px-4 py-2 rounded font-bold text-sm uppercase text-white transition-colors ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-sick-red hover:bg-red-800'}`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};

export const useConfirm = () => {
    const ctx = useContext(ConfirmContext);
    if (!ctx) {
        throw new Error('useConfirm must be used within a ConfirmDialogProvider');
    }
    return ctx;
};

export default ConfirmDialogProvider;
