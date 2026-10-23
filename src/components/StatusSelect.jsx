const STATUS_OPTIONS = [
  { value: 'interested', label: 'Interested' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'applied', label: 'Applied' },
  { value: 'registered', label: 'Registered' },
  { value: 'completed', label: 'Completed' }
];

export default function StatusSelect({ id, value, onChange }) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        Status
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-h-[44px] px-3 border border-[var(--color-line)] rounded-[var(--radius-control)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] font-medium focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
