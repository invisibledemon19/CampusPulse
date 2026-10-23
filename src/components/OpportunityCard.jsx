import { Link } from 'react-router-dom';
import Badge from './Badge.jsx';
import MatchScore from './MatchScore.jsx';
import DeadlineLabel from './DeadlineLabel.jsx';
import { Bookmark, ExternalLink } from 'lucide-react';

export default function OpportunityCard({
  item,
  isSaved = false,
  onSaveToggle,
  isExcluded = false
}) {
  const { opportunity, score, reasons = [], urgency, excluded } = item;

  const categoryLabel = opportunity.category
    ? opportunity.category.charAt(0).toUpperCase() + opportunity.category.slice(1)
    : 'Opportunity';

  const formatLabel = opportunity.format
    ? opportunity.format.charAt(0).toUpperCase() + opportunity.format.slice(1)
    : 'Format';

  const costLabel = opportunity.registrationFee === 0
    ? 'Free'
    : opportunity.registrationFee !== null && opportunity.registrationFee !== undefined
    ? `₹${opportunity.registrationFee}`
    : 'Fee not provided';

  const locationDisplay = opportunity.city
    ? opportunity.venue
      ? `${opportunity.city}, ${opportunity.venue}`
      : opportunity.city
    : opportunity.format === 'online'
    ? 'Online'
    : 'Location not provided';

  return (
    <article className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-4 md:p-5 flex flex-col justify-between h-full">
      <div>
        {/* 1. Badges row */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <Badge variant="brand">{categoryLabel}</Badge>
          <Badge variant={opportunity.registrationFee === 0 ? 'success' : 'default'}>
            {costLabel}
          </Badge>
          <Badge variant="default">{formatLabel}</Badge>
          {opportunity.isSample && (
            <Badge variant="warn">Demo listing</Badge>
          )}
          {!opportunity.isSample && opportunity.verificationStatus === 'verified' && (
            <Badge variant="success">Verified</Badge>
          )}
          {!opportunity.isSample && opportunity.verificationStatus === 'unverified' && (
            <Badge variant="default">Unverified</Badge>
          )}
        </div>

        {/* 2. Title */}
        <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-1 leading-snug">
          <Link
            to={`/opportunity/${opportunity.id}`}
            className="hover:text-[var(--color-brand)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
          >
            {opportunity.title}
          </Link>
        </h2>

        {/* 3. Organizer and location */}
        <p className="text-sm text-[var(--color-muted)] mb-4">
          <span className="font-medium text-[var(--color-ink)]">{opportunity.organizer}</span>
          <span className="mx-1.5">•</span>
          <span>{locationDisplay}</span>
        </p>

        {/* Exclusion note or MatchScore + Reasons */}
        {isExcluded ? (
          <div className="bg-[var(--color-danger-bg)] text-[var(--color-danger-ink)] text-xs font-medium p-2.5 rounded-[var(--radius-badge)] mb-4">
            {excluded?.message || 'This listing does not match your criteria.'}
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            <MatchScore score={score} />

            {reasons && reasons.length > 0 && (
              <div className="space-y-1">
                {reasons.slice(0, 2).map((reason, idx) => (
                  <p key={idx} className="text-xs text-[var(--color-muted)]">
                    • {reason}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        {/* Deadline urgency */}
        <div className="pt-3 border-t border-[var(--color-line)] mb-4 flex items-center justify-between">
          <DeadlineLabel urgency={urgency} />
        </div>

        {/* 7. Actions */}
        <div className="flex items-center gap-2">
          {onSaveToggle && (
            <button
              type="button"
              onClick={() => onSaveToggle(opportunity.id)}
              aria-label={isSaved ? `Remove ${opportunity.title} from saved` : `Save ${opportunity.title}`}
              className={`flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] px-3 rounded-[var(--radius-control)] text-sm font-medium border ${
                isSaved
                  ? 'bg-[var(--color-brand-soft)] border-[var(--color-brand)] text-[var(--color-brand)]'
                  : 'bg-[var(--color-surface)] border-[var(--color-line)] text-[var(--color-ink)] hover:bg-[var(--color-canvas)]'
              } focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]`}
            >
              <Bookmark size={16} aria-hidden="true" />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          )}

          <Link
            to={`/opportunity/${opportunity.id}`}
            className="flex-1 inline-flex items-center justify-center min-h-[44px] px-3 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-ink)] text-sm font-medium hover:bg-[var(--color-canvas)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
          >
            <span>View details</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
