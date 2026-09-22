import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button.jsx';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No items found',
  description = 'There is no data to display matching your criteria.',
  actionLabel,
  actionText,
  action,
  onAction,
  className = '',
}) {
  const handleAction = onAction || action;
  const label = actionLabel || actionText;

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 ${className}`}
    >
      <div className="p-4 rounded-2xl bg-slate-800/60 text-slate-400 mb-4 border border-slate-700/50 shadow-inner">
        <Icon className="w-8 h-8 text-indigo-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-200">{title}</h3>
      <p className="mt-1.5 text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
        {description}
      </p>
      {label && handleAction && (
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={handleAction}>
            {label}
          </Button>
        </div>
      )}
    </div>
  );
}

export default EmptyState;
