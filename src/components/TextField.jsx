import { forwardRef } from 'react';

const TextField = forwardRef(function TextField(
  {
    id,
    label,
    type = 'text',
    value,
    onChange,
    onBlur,
    placeholder,
    error,
    helpText,
    min,
    max,
    required = false,
    className = ''
  },
  ref
) {
  const errorId = error ? `${id}-error` : undefined;
  const helpId = helpText ? `${id}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--color-ink)]">
        {label}
        {required && <span className="text-[var(--color-danger-ink)] ml-0.5">*</span>}
      </label>

      <input
        ref={ref}
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        min={min}
        max={max}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`w-full min-h-[44px] px-3 border rounded-[var(--radius-control)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] ${
          error ? 'border-[var(--color-danger-ink)]' : 'border-[var(--color-line)]'
        }`}
      />

      {helpText && !error && (
        <p id={helpId} className="text-xs text-[var(--color-muted)]">
          {helpText}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-xs text-[var(--color-danger-ink)] font-medium">
          {error}
        </p>
      )}
    </div>
  );
});

export default TextField;
