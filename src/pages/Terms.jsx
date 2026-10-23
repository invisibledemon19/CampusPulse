import { usePageMeta } from '../hooks/usePageMeta.js';
import {
  OWNER_NAME,
  CONTACT_EMAIL,
  GOVERNING_CITY,
  GOVERNING_STATE,
  LEGAL_LAST_UPDATED
} from '../config/site.js';

export default function Terms() {
  usePageMeta({
    title: 'Terms and conditions | CampusPlus',
    description: 'The rules for using CampusPlus, including how listings, fit scores and submissions work.',
    path: '/terms',
    noindex: false
  });

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="max-w-prose">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)] mb-2">
          Terms and Conditions
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-8">
          Last updated: {LEGAL_LAST_UPDATED}
        </p>

        <div className="space-y-6 text-base text-[var(--color-ink)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              1. About CampusPlus
            </h2>
            <p>
              CampusPlus is a website that helps students find and keep track of hackathons, internships, workshops and events. We do not organize these opportunities. We are not a party to any registration, application or payment between you and an organizer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              2. Who can use CampusPlus
            </h2>
            <p>
              You must be at least 18 years old, or have the permission of a parent or guardian to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              3. Listings and accuracy
            </h2>
            <p>
              Listings come from the sources linked on each listing, from community submissions, and from our own checks. Fees, dates, deadlines and eligibility can change without notice. Where we have them, we show a source link, a last checked date and a verification status. Always confirm the details on the organizer&apos;s site before you register or pay. Listings marked &quot;Demo listing&quot; are examples and are not real events.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              4. Fit score
            </h2>
            <p>
              The fit score is calculated by fixed rules from the details you enter and the details in the listing. It is a guide only. It does not mean you are eligible, selected or accepted.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              5. Your account and information
            </h2>
            <p>
              You are responsible for the information you enter and for keeping your sign in secure. If you suggest an opportunity, you confirm that the information is accurate to the best of your knowledge. We may edit, reject or remove any submission. A submission is not marked verified until we have reviewed it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              6. Acceptable use
            </h2>
            <p>
              Do not submit false or misleading listings, post spam or unrelated links, try to access other users&apos; data, disrupt or overload the service, or copy listings in bulk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              7. Third party links and services
            </h2>
            <p>
              Registration pages, sources and sign in are provided by third parties. We do not control them and are not responsible for their content, fees, decisions or privacy practices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              8. Ownership
            </h2>
            <p>
              The CampusPlus name, design and code belong to {OWNER_NAME}. Listing details belong to their respective organizers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              9. Disclaimer and limit of liability
            </h2>
            <p>
              CampusPlus is provided &quot;as is&quot; and &quot;as available&quot;. To the extent allowed by law, {OWNER_NAME} is not liable for losses caused by missed deadlines, inaccurate or outdated listings, fees paid to third parties, or rejected applications. Nothing in these terms limits any liability that cannot be limited by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              10. Changes and ending use
            </h2>
            <p>
              We may update these terms. The date at the top shows the latest version. If you keep using CampusPlus after a change, you accept the new terms. We may suspend accounts that break these terms. You can stop using CampusPlus at any time and can ask us to delete your account data (see the Privacy Policy).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              11. Governing law
            </h2>
            <p>
              These terms are governed by the laws of India. Courts at {GOVERNING_CITY}, {GOVERNING_STATE} have jurisdiction, subject to any rights you have under applicable consumer law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              12. Contact
            </h2>
            <p>
              Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-brand)] underline hover:text-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]">{CONTACT_EMAIL}</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
