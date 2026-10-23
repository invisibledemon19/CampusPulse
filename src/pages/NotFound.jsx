import { Link } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta.js';

export default function NotFound() {
  usePageMeta({
    title: 'Page not found | CampusPlus',
    description: 'The page you asked for does not exist or has moved.',
    path: window.location.pathname,
    noindex: true
  });

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
      <div className="max-w-xl mx-auto bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)] mb-4">
          Page not found
        </h1>
        <p className="text-[var(--color-muted)] mb-6 text-base">
          The page you asked for does not exist or has moved.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
          >
            Go to Discover
          </Link>
          <Link
            to="/nearby"
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-ink)] text-sm font-medium hover:bg-[var(--color-canvas)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
          >
            View Nearby
          </Link>
        </div>
      </div>
    </div>
  );
}
