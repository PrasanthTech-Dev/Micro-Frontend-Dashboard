import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] select-none';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 shadow-sm',
    md: 'text-sm px-4 py-2 gap-2 shadow',
    lg: 'text-base px-6 py-2.5 gap-2.5 shadow-md',
  }[size] || 'text-sm px-4 py-2 gap-2 shadow';

  const variantStyles = {
    primary: 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-600/25 focus:ring-indigo-500 border border-indigo-500/30',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 focus:ring-slate-500 shadow-slate-900/30',
    outline: 'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white border border-slate-700 focus:ring-indigo-500',
    danger: 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-600/25 focus:ring-rose-500 border border-rose-500/30',
    ghost: 'bg-transparent hover:bg-white/5 text-slate-300 hover:text-white focus:ring-indigo-500 border-transparent',
    accent: 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/25 focus:ring-cyan-400 border border-cyan-400/30',
  }[variant] || 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-indigo-600/25 focus:ring-indigo-500 border border-indigo-500/30';

  const renderIcon = (IconComponent) => {
    if (!IconComponent) return null;
    if (React.isValidElement(IconComponent)) return IconComponent;
    const Component = IconComponent;
    return <Component className="w-4 h-4 shrink-0" />;
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {LeftIcon && renderIcon(LeftIcon)}
          {children && <span>{children}</span>}
          {RightIcon && renderIcon(RightIcon)}
        </>
      )}
    </button>
  );
}

export default Button;
