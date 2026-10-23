export default function ErrorState({
  message = 'Listings could not be loaded. Check your connection and try again.',
  onRetry
}) {
  return (
    <div
      role="alert"
      className="bg-[var(--color-surface)] border border-[var(--color-danger-ink)] rounded-[var(--radius-card)] p-8 text-center max-w-xl mx-auto my-8"
    >
      <p className="text-[var(--color-danger-ink)] text-base font-medium mb-4">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        >
          Try again
        </button>
      )}
    </div>
  );
}
