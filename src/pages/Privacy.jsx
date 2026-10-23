import { usePageMeta } from '../hooks/usePageMeta.js';
import {
  OWNER_NAME,
  CONTACT_EMAIL,
  LEGAL_LAST_UPDATED
} from '../config/site.js';

export default function Privacy() {
  usePageMeta({
    title: 'Privacy policy | CampusPlus',
    description: 'What data CampusPlus collects, why we collect it, where it is stored and how to delete it.',
    path: '/privacy',
    noindex: false
  });

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <div className="max-w-prose">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)] mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--color-muted)] mb-8">
          Last updated: {LEGAL_LAST_UPDATED}
        </p>

        <div className="space-y-6 text-base text-[var(--color-ink)] leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              1. Who is responsible
            </h2>
            <p>
              {OWNER_NAME} runs CampusPlus and decides how your personal data is used. Contact: <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-brand)] underline hover:text-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]">{CONTACT_EMAIL}</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              2. What we collect
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                Without an account: your profile, saved listings and notes are stored in your browser&apos;s local storage on your device. They are not sent to us.
              </li>
              <li>
                With Google sign in: your name, email address and account identifier, provided through Firebase Authentication.
              </li>
              <li>
                Profile details you enter: education level, city, skills, interests, preferred format, travel distance and fee limit. If you choose &quot;Use my location for distance&quot;, your approximate coordinates.
              </li>
              <li>
                Saved listings, application status, checklist items and notes.
              </li>
              <li>
                Opportunities you suggest, with your account identifier.
              </li>
              <li>
                Technical logs kept by our hosting and database providers, such as IP address, browser type and pages requested.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              3. What we do not do
            </h2>
            <p>
              We do not sell your data. We do not use advertising cookies or third party analytics. We do not use your data to train AI models.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              4. Why we use it
            </h2>
            <p>
              To show listings, calculate fit scores, save your progress, review suggested listings, and keep the service secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              5. Consent
            </h2>
            <p>
              We process your data with your consent, which you give when you create a profile or sign in. You can withdraw consent at any time by deleting your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              6. Where it is stored and who processes it
            </h2>
            <p>
              Account data and saved items are stored in Google Firebase (Cloud Firestore and Authentication). The website is hosted on Vercel. These providers process data on our behalf and may process it outside India.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              7. How long we keep it
            </h2>
            <p>
              Account data is kept until you ask us to delete it. Data in your browser stays until you clear it. Provider logs follow the retention periods of those providers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              8. Your rights
            </h2>
            <p>
              You can ask us to show you the data we hold, correct it, or delete it, and you can withdraw consent or make a complaint, as provided in the Digital Personal Data Protection Act, 2023. Email <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-brand)] underline hover:text-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]">{CONTACT_EMAIL}</a> from the address linked to your account. You can also clear local data in your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              9. Children
            </h2>
            <p>
              CampusPlus is intended for people aged 18 and over. If you believe a younger person has given us data, contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              10. Security
            </h2>
            <p>
              Private data is protected by sign in and database access rules that let each user read only their own profile and saved items. No online service is completely secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              11. Complaints
            </h2>
            <p>
              Contact {OWNER_NAME} at <a href={`mailto:${CONTACT_EMAIL}`} className="text-[var(--color-brand)] underline hover:text-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]">{CONTACT_EMAIL}</a>. We aim to reply within a reasonable time and will state the period here once the owner has confirmed it with their lawyer.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-2">
              12. Changes
            </h2>
            <p>
              We will update the date at the top of this page when this policy changes.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
