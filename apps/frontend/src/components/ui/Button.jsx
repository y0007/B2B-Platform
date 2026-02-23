import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseClass = "px-6 py-3 rounded-xl font-semibold tracking-wide flex items-center justify-center gap-2";
    const variantClass = variant === 'primary' ? 'btn-primary' : 'btn-secondary';

    return (
        <button className={`${baseClass} ${variantClass} ${className}`} {...props}>
            {children}
        </button>
    );
};
