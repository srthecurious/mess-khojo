/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside ToastProvider');
    return ctx;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const toast = useCallback((message, type = 'info', duration = 3500) => {
        const id = Date.now() + Math.random();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }, []);

    const success = useCallback((msg, dur) => toast(msg, 'success', dur), [toast]);
    const error   = useCallback((msg, dur) => toast(msg, 'error',   dur), [toast]);
    const info    = useCallback((msg, dur) => toast(msg, 'info',    dur), [toast]);
    const warning = useCallback((msg, dur) => toast(msg, 'warning', dur), [toast]);
    const dismiss = useCallback((id) => setToasts(prev => prev.filter(t => t.id !== id)), []);

    const iconMap  = { success: CheckCircle, error: XCircle, info: Info, warning: AlertTriangle };
    const styleMap = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error:   'bg-red-50 border-red-200 text-red-800',
        info:    'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
    };
    const iconStyleMap = {
        success: 'text-green-500',
        error:   'text-red-500',
        info:    'text-blue-500',
        warning: 'text-amber-500',
    };

    return (
        <ToastContext.Provider value={{ toast, success, error, info, warning }}>
            {children}
            {/* Toast container — fixed top-right */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
                {toasts.map(t => {
                    const Icon = iconMap[t.type] || Info;
                    return (
                        <div
                            key={t.id}
                            className={`flex items-start gap-3 p-4 rounded-2xl border shadow-xl pointer-events-auto ${styleMap[t.type]}`}
                            style={{ animation: 'slideInRight 0.25s ease-out' }}
                        >
                            <Icon size={18} className={`shrink-0 mt-0.5 ${iconStyleMap[t.type]}`} />
                            <p className="text-sm font-medium flex-1 leading-snug">{t.message}</p>
                            <button
                                onClick={() => dismiss(t.id)}
                                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                                aria-label="Dismiss notification"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};
