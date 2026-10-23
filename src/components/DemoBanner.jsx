import { AlertTriangle } from 'lucide-react';

export default function DemoBanner() {
  return (
    <div
      role="region"
      aria-label="Demo notice"
      className="bg-[var(--color-warn-bg)] text-[var(--color-warn-ink)] border-b border-[var(--color-line)] py-2 px-4 text-sm font-medium"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-center">
        <AlertTriangle size={16} aria-hidden="true" />
        <span>You are viewing demo listings. They are examples and not real events.</span>
      </div>
    </div>
  );
}
