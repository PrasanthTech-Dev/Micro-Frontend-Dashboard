import React from 'react';

export function Card({
  title,
  subtitle,
  children,
  action,
  className = '',
  bodyClassName = '',
  hover = true,
  padding = true,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl shadow-md dark:shadow-xl overflow-hidden transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      } ${hover ? 'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg' : ''} ${className}`}
    >
      {(title || action) && (
        <div className="px-6 py-4 sm:py-5 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between">
          <div>
            {title && <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`${padding ? 'p-5 sm:p-6' : ''} ${bodyClassName}`}>{children}</div>
    </div>
  );
}

export default Card;
