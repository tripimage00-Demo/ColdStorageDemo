import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg shadow-sm';

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs space-x-1.5',
    md: 'px-4 py-2 text-sm space-x-2',
    lg: 'px-5 py-2.5 text-base space-x-2.5',
  };

  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500 shadow-emerald-500/20',
    brand: 'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 shadow-indigo-500/20',
    secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 focus:ring-slate-400 border border-slate-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-red-500/20',
    warning: 'bg-amber-600 hover:bg-amber-700 text-white focus:ring-amber-500 shadow-amber-500/20',
    outline: 'border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 focus:ring-emerald-500',
    ghost: 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 shadow-none',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        Icon && <Icon className="w-4 h-4 flex-shrink-0" />
      )}
      <span>{children}</span>
    </button>
  );
};
