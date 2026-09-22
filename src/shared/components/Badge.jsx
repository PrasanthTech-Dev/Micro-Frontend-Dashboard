import React from 'react';

export function Badge({
  children,
  variant = 'default', // 'admin', 'manager', 'viewer', 'active', 'inactive', 'suspended', 'info', 'success', 'warning', 'error', 'default'
  size = 'sm',
  className = '',
  dot = false,
}) {
  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 font-medium tracking-wide rounded-full',
    md: 'text-xs px-3 py-1 font-semibold tracking-wide rounded-full',
  }[size] || 'text-[11px] px-2.5 py-0.5 font-medium tracking-wide rounded-full';

  const variantStyles = {
    // Roles
    admin: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    manager: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
    viewer: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
    // Statuses
    active: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    inactive: 'bg-slate-500/15 text-slate-400 border border-slate-600/30',
    suspended: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    pending: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    // Severities
    info: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    error: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    default: 'bg-slate-800 text-slate-300 border border-slate-700',
  }[variant.toLowerCase()] || 'bg-slate-800 text-slate-300 border border-slate-700';

  const dotColors = {
    admin: 'bg-indigo-400',
    manager: 'bg-cyan-400',
    viewer: 'bg-slate-400',
    active: 'bg-emerald-400',
    inactive: 'bg-slate-400',
    suspended: 'bg-rose-400',
    pending: 'bg-amber-400',
    info: 'bg-sky-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    error: 'bg-rose-400',
    default: 'bg-slate-400',
  }[variant.toLowerCase()] || 'bg-slate-400';

  return (
    <span className={`inline-flex items-center gap-1.5 ${sizeStyles} ${variantStyles} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors} animate-pulse`} />}
      {children}
    </span>
  );
}

export default Badge;
