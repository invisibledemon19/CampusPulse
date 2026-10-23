export default function Button({
  children,
  variant = 'primary',
  type = 'button',
  onClick,
  disabled = false,
  className = '',
  'aria-label': ariaLabel
}) {
  let variantClasses = 'bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-hover)]';

  if (variant === 'secondary') {
    variantClasses = 'bg-[var(--color-surface)] text-[var(--color-ink)] border border-[var(--color-line)] hover:bg-[var(--color-canvas)]';
  } else if (variant === 'destructive') {
    variantClasses = 'bg-[var(--color-surface)] text-[var(--color-danger-ink)] border border-[var(--color-danger-ink)] hover:bg-[var(--color-danger-bg)]';
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`inline-flex items-center justify-center min-h-[44px] px-4 rounded-[var(--radius-control)] text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
}
