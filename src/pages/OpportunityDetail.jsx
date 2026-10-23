import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, Bookmark, ArrowLeft, Calendar, MapPin, IndianRupee, ShieldCheck } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { getOpportunity, getProfile, listSaved, saveOpportunity, unsaveOpportunity } from '../services/index.js';
import { rankOpportunities } from '../utils/scoring.js';
import { isSafeHttpUrl } from '../utils/url.js';
import { formatDate } from '../utils/dates.js';
import Badge from '../components/Badge.jsx';
import MatchScore from '../components/MatchScore.jsx';
import DeadlineLabel from '../components/DeadlineLabel.jsx';
import DemoBanner from '../components/DemoBanner.jsx';

export default function OpportunityDetail() {
  const { id } = useParams();

  const [opportunity, setOpportunity] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      setNotFound(false);
      try {
        const [opp, userProfile, savedList] = await Promise.all([
          getOpportunity(id),
          getProfile(),
          listSaved()
        ]);

        if (!isMounted) return;

        if (!opp) {
          setNotFound(true);
        } else {
          setOpportunity(opp);
          setProfile(userProfile);
          setIsSaved(savedList.some((s) => s.opportunityId === opp.id));
        }
      } catch {
        if (isMounted) setNotFound(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Compute title and description for page meta
  const pageMetaTitle = (() => {
    if (notFound) return 'Opportunity not found | CampusPlus';
    if (!opportunity) return 'Opportunity detail | CampusPlus';

    const suffix = ' | CampusPlus';
    const maxTitleLen = 60 - suffix.length;
    let titleStr = opportunity.title || 'Opportunity';
    if (titleStr.length > maxTitleLen) {
      titleStr = titleStr.slice(0, maxTitleLen - 3) + '...';
    }
    return `${titleStr}${suffix}`;
  })();

  const pageMetaDesc = (() => {
    if (notFound) return 'The opportunity you requested was not found.';
    if (!opportunity) return 'Opportunity detail on CampusPlus.';

    const category = opportunity.category
      ? opportunity.category.charAt(0).toUpperCase() + opportunity.category.slice(1)
      : 'Opportunity';
    const feeStr = opportunity.registrationFee === 0
      ? 'Free'
      : opportunity.registrationFee
      ? `₹${opportunity.registrationFee}`
      : 'Not provided';
    const deadlineStr = opportunity.deadline ? formatDate(opportunity.deadline) : 'Not provided';

    const desc = `${category} by ${opportunity.organizer}. Fee: ${feeStr}. Deadline: ${deadlineStr}.`;
    return desc.length > 155 ? desc.slice(0, 152) + '...' : desc;
  })();

  usePageMeta({
    title: pageMetaTitle,
    description: pageMetaDesc,
    path: `/opportunity/${id || ''}`,
    noindex: notFound ? true : (opportunity ? opportunity.isSample : true)
  });

  const handleSaveToggle = async () => {
    if (!opportunity) return;
    if (isSaved) {
      try {
        await unsaveOpportunity(opportunity.id);
        setIsSaved(false);
        setStatusMessage(`Removed ${opportunity.title} from saved.`);
      } catch (err) {
        setStatusMessage(err.message || 'Unable to update saved item.');
      }
    } else {
      try {
        await saveOpportunity(opportunity.id);
        setIsSaved(true);
        setStatusMessage(`Saved ${opportunity.title}.`);
      } catch (err) {
        setStatusMessage(err.message || 'Unable to save item.');
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8" role="status" aria-label="Loading opportunity details">
        <div className="w-32 h-6 bg-[var(--color-line)] rounded-[var(--radius-control)] mb-6" />
        <div className="w-full max-w-xl h-10 bg-[var(--color-line)] rounded-[var(--radius-control)] mb-4" />
        <div className="w-64 h-6 bg-[var(--color-line)] rounded-[var(--radius-control)] mb-8" />
        <div className="h-64 bg-[var(--color-line)] rounded-[var(--radius-card)]" />
      </div>
    );
  }

  if (notFound || !opportunity) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-6 md:p-8 max-w-xl mx-auto">
          <h1 className="text-2xl font-semibold text-[var(--color-ink)] mb-4">
            Opportunity not found
          </h1>
          <p className="text-[var(--color-muted)] mb-6">
            The opportunity you asked for does not exist or has been removed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
          >
            Go to Discover
          </Link>
        </div>
      </div>
    );
  }

  // Calculate score & reasons for this specific opportunity
  const scoredData = rankOpportunities([opportunity], profile);
  const scoredItem = scoredData.ranked[0] || scoredData.excluded[0] || {
    opportunity,
    score: null,
    components: null,
    reasons: [],
    warnings: [],
    urgency: null,
    excluded: null
  };

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

  const hasSafeRegUrl = isSafeHttpUrl(opportunity.registrationUrl);
  const hasSafeSourceUrl = isSafeHttpUrl(opportunity.sourceUrl);

  const verificationText = !opportunity.isSample && opportunity.verificationStatus === 'verified'
    ? 'Verified by CampusPlus'
    : 'Not yet verified';

  return (
    <div className="pb-12">
      {/* Demo banner if demo listing */}
      {opportunity.isSample && <DemoBanner />}

      {/* Live announcement region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-muted)] hover:text-[var(--color-ink)] mb-6 font-medium focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back to Discover</span>
        </Link>

        {/* Header Block */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-6 md:p-8 mb-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
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
            {opportunity.status === 'closed' && (
              <Badge variant="danger">Closed</Badge>
            )}
            {opportunity.status === 'cancelled' && (
              <Badge variant="danger">Cancelled</Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)] mb-2">
            {opportunity.title}
          </h1>

          <p className="text-base text-[var(--color-muted)] mb-6">
            Organized by <span className="font-semibold text-[var(--color-ink)]">{opportunity.organizer}</span>
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[var(--color-line)]">
            <DeadlineLabel urgency={scoredItem.urgency} />

            {/* Action buttons */}
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={handleSaveToggle}
                className={`inline-flex items-center gap-2 min-h-[44px] px-4 rounded-[var(--radius-control)] text-sm font-medium border ${
                  isSaved
                    ? 'bg-[var(--color-brand-soft)] border-[var(--color-brand)] text-[var(--color-brand)]'
                    : 'bg-[var(--color-surface)] border-[var(--color-line)] text-[var(--color-ink)] hover:bg-[var(--color-canvas)]'
                } focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]`}
              >
                <Bookmark size={16} aria-hidden="true" />
                <span>{isSaved ? 'Saved' : 'Save'}</span>
              </button>

              {hasSafeRegUrl ? (
                <a
                  href={opportunity.registrationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-[var(--radius-control)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
                >
                  <span>Open registration page</span>
                  <ExternalLink size={16} aria-hidden="true" />
                </a>
              ) : (
                <span className="text-sm text-[var(--color-muted)] italic py-2">
                  Registration link not provided
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details sections */}
        <div className="space-y-6">
          {/* Why it fits you */}
          <section className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-4">
              Why it fits you
            </h2>

            {scoredItem.excluded ? (
              <div className="bg-[var(--color-danger-bg)] text-[var(--color-danger-ink)] text-sm font-medium p-3 rounded-[var(--radius-badge)] mb-4">
                {scoredItem.excluded.message}
              </div>
            ) : profile ? (
              <div className="space-y-4">
                <div className="max-w-md">
                  <MatchScore score={scoredItem.score} />
                </div>

                {scoredItem.reasons && scoredItem.reasons.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {scoredItem.reasons.map((reason, idx) => (
                      <p key={idx} className="text-sm text-[var(--color-ink)] flex items-start gap-2">
                        <span className="text-[var(--color-brand)] font-bold">•</span>
                        <span>{reason}</span>
                      </p>
                    ))}
                  </div>
                )}

                {scoredItem.warnings && scoredItem.warnings.length > 0 && (
                  <div className="space-y-1 pt-2 border-t border-[var(--color-line)]">
                    {scoredItem.warnings.map((warn, idx) => (
                      <p key={idx} className="text-xs text-[var(--color-muted)]">
                        Note: {warn}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-[var(--color-muted)]">
                  Add your skills, city and fee limit to see fit scores.
                </p>
                <Link
                  to="/profile"
                  className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
                >
                  Set up profile
                </Link>
              </div>
            )}
          </section>

          {/* About this opportunity */}
          <section className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-3">
              About this opportunity
            </h2>
            <p className="text-base text-[var(--color-ink)] leading-relaxed whitespace-pre-line mb-4">
              {opportunity.description || 'Not provided'}
            </p>

            {opportunity.tags && opportunity.tags.length > 0 && (
              <div className="pt-3 border-t border-[var(--color-line)]">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)] mb-2">
                  Skills and topics
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {opportunity.tags.map((tag) => (
                    <Badge key={tag} variant="default">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Eligibility */}
          <section className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-3">
              Eligibility
            </h2>
            {opportunity.eligibilityLevels && opportunity.eligibilityLevels.length > 0 ? (
              <p className="text-sm text-[var(--color-ink)]">
                {opportunity.eligibilityLevels.includes('any')
                  ? 'Open to all education levels'
                  : `Open to ${opportunity.eligibilityLevels.join(', ')} students`}
              </p>
            ) : (
              <p className="text-sm text-[var(--color-muted)]">Not provided</p>
            )}
          </section>

          {/* Cost */}
          <section className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-3">
              Cost
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-[var(--color-ink)]">
                <span className="text-[var(--color-muted)]">Registration fee: </span>
                <span className="font-semibold">
                  {opportunity.registrationFee === 0
                    ? 'Free'
                    : opportunity.registrationFee !== null && opportunity.registrationFee !== undefined
                    ? `₹${opportunity.registrationFee}`
                    : 'Not provided'}
                </span>
              </p>

              {opportunity.estimatedTravelCost !== null && opportunity.estimatedTravelCost !== undefined && (
                <p className="text-[var(--color-muted)]">
                  Estimated travel (estimate): ₹{opportunity.estimatedTravelCost}
                </p>
              )}
            </div>
          </section>

          {/* Dates and place */}
          <section className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-3">
              Dates and place
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[var(--color-muted)] mb-1">Event date</p>
                <p className="font-medium text-[var(--color-ink)]">
                  {formatDate(opportunity.startDate)}
                </p>
              </div>
              <div>
                <p className="text-[var(--color-muted)] mb-1">Application deadline</p>
                <p className="font-medium text-[var(--color-ink)]">
                  {formatDate(opportunity.deadline)}
                </p>
              </div>
              <div>
                <p className="text-[var(--color-muted)] mb-1">Format</p>
                <p className="font-medium text-[var(--color-ink)]">
                  {formatLabel}
                </p>
              </div>
              <div>
                <p className="text-[var(--color-muted)] mb-1">Location</p>
                <p className="font-medium text-[var(--color-ink)]">
                  {opportunity.city
                    ? opportunity.venue
                      ? `${opportunity.city}, ${opportunity.venue}`
                      : opportunity.city
                    : opportunity.format === 'online'
                    ? 'Held online, no travel needed'
                    : 'Not provided'}
                </p>
              </div>
            </div>
          </section>

          {/* Source and checks */}
          <section className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-6">
            <h2 className="text-lg font-semibold text-[var(--color-ink)] mb-3">
              Source and checks
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-[var(--color-ink)]">
                <span className="text-[var(--color-muted)]">Source: </span>
                {hasSafeSourceUrl ? (
                  <a
                    href={opportunity.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-brand)] underline hover:text-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
                  >
                    {opportunity.sourceUrl}
                  </a>
                ) : (
                  <span>{opportunity.sourceUrl || 'Not provided'}</span>
                )}
              </p>

              <p className="text-[var(--color-ink)]">
                <span className="text-[var(--color-muted)]">Last checked: </span>
                <span>
                  {opportunity.lastCheckedAt
                    ? formatDate(opportunity.lastCheckedAt.slice(0, 10))
                    : 'Not provided'}
                </span>
              </p>

              <p className="text-[var(--color-ink)] font-medium">
                {verificationText}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
