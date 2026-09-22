/**
 * Format a number with commas: 12847 → "12,847"
 */
export function formatNumber(num) {
  if (num == null) return '0';
  return num.toLocaleString('en-US');
}

/**
 * Format currency: 284750 → "$284,750"
 */
export function formatCurrency(amount) {
  if (amount == null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage: 12.5 → "+12.5%"
 */
export function formatPercentage(value, showSign = true) {
  if (value == null) return '0%';
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Get initials from a name: "Sarah Chen" → "SC"
 */
export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Generate a consistent color based on a string (for avatars).
 */
export function stringToColor(str) {
  const colors = [
    'from-primary-500 to-accent-500',
    'from-info-500 to-primary-500',
    'from-success-500 to-info-500',
    'from-warning-500 to-danger-500',
    'from-accent-500 to-danger-500',
    'from-primary-500 to-success-500',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

/**
 * Debounce a function
 */
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/**
 * Classnames helper: cn('foo', condition && 'bar', 'baz')
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
