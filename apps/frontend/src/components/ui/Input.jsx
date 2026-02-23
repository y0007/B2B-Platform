import React from 'react';

export const Input = React.forwardRef(({ label, className = '', ...props }, ref) => {
    return (
        <div className="w-full">
            {label && <label className="block text-sm font-medium text-slate-600 mb-2 uppercase tracking-wider">{label}</label>}
            <input
                ref={ref}
                className={`w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all ${className}`}
                {...props}
            />
        </div>
    );
});
