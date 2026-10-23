import { forwardRef } from 'react';

const SelectField = forwardRef(function SelectField(
  {
    id,
    label,
    value,
    onChange,
    onBlur,
    options = [],
    error,
    helpText,
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

      <select
        ref={ref}
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`w-full min-h-[44px] px-3 border rounded-[var(--radius-control)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] ${
          error ? 'border-[var(--color-danger-ink)]' : 'border-[var(--color-line)]'
        }`}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

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

export default SelectField;
