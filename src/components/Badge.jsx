export default function Badge({ children, variant = 'default', className = '' }) {
  let colorClasses = 'bg-[var(--color-canvas)] text-[var(--color-ink)] border border-[var(--color-line)]';

  if (variant === 'brand') {
    colorClasses = 'bg-[var(--color-brand-soft)] text-[var(--color-brand)] border border-transparent';
  } else if (variant === 'warn') {
    colorClasses = 'bg-[var(--color-warn-bg)] text-[var(--color-warn-ink)] border border-transparent';
  } else if (variant === 'danger') {
    colorClasses = 'bg-[var(--color-danger-bg)] text-[var(--color-danger-ink)] border border-transparent';
  } else if (variant === 'success') {
    colorClasses = 'bg-[var(--color-success-bg)] text-[var(--color-success-ink)] border border-transparent';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-badge)] text-xs font-medium leading-normal ${colorClasses} ${className}`}
    >
      {children}
    </span>
  );
}
