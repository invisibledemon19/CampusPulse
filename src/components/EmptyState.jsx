export default function EmptyState({
  message = 'No opportunities match these filters. Clear the filters or raise your fee limit.',
  actionText,
  onAction
}) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-8 text-center max-w-xl mx-auto my-8">
      <p className="text-[var(--color-muted)] text-base mb-4">{message}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
