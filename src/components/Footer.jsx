import { Link } from 'react-router-dom';
import { OWNER_NAME, CONTACT_EMAIL } from '../config/site.js';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-surface)] border-t border-[var(--color-line)] mt-auto py-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <p className="text-sm text-[var(--color-muted)] mb-4">
          Listings link to their original sources. Check the organizer&apos;s site before you register or pay.
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[var(--color-line)] text-sm">
          <div className="flex items-center gap-6">
            <Link
              to="/terms"
              className="text-[var(--color-ink)] hover:text-[var(--color-brand)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
            >
              Terms
            </Link>
            <Link
              to="/privacy"
              className="text-[var(--color-ink)] hover:text-[var(--color-brand)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
            >
              Privacy
            </Link>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-[var(--color-ink)] hover:text-[var(--color-brand)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
            >
              Contact
            </a>
          </div>

          <p className="text-[var(--color-muted)]">
            &copy; {currentYear} {OWNER_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
}
