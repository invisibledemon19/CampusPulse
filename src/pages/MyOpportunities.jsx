import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Trash2, Bookmark } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { listSaved, listOpportunities, getProfile, updateSaved, unsaveOpportunity } from '../services/index.js';
import { isSafeHttpUrl } from '../utils/url.js';
import { formatDate } from '../utils/dates.js';
import Badge from '../components/Badge.jsx';
import StatusSelect from '../components/StatusSelect.jsx';
import Checklist from '../components/Checklist.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function MyOpportunities() {
  usePageMeta({
    title: 'Saved opportunities | CampusPlus',
    description: 'Track saved opportunities, deadlines and application status in one list.',
    path: '/my-opportunities',
    noindex: true
  });

  const [savedItems, setSavedItems] = useState([]);
  const [opportunitiesMap, setOpportunitiesMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [saved, opps] = await Promise.all([
        listSaved(),
        listOpportunities()
      ]);

      const map = new Map();
      opps.forEach((o) => map.set(o.id, o));

      setOpportunitiesMap(map);
      setSavedItems(saved);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (opportunityId, newStatus) => {
    try {
      const updated = await updateSaved(opportunityId, { applicationStatus: newStatus });
      setSavedItems((prev) =>
        prev.map((item) => (item.opportunityId === opportunityId ? updated : item))
      );
      setStatusMessage(`Updated status to ${newStatus}.`);
    } catch (err) {
      setStatusMessage(err.message || 'Unable to update status.');
    }
  };

  const handleUpdateSteps = async (opportunityId, steps) => {
    try {
      const updated = await updateSaved(opportunityId, { nextSteps: steps });
      setSavedItems((prev) =>
        prev.map((item) => (item.opportunityId === opportunityId ? updated : item))
      );
      setStatusMessage('Checklist updated.');
    } catch (err) {
      setStatusMessage(err.message || 'Unable to update steps.');
    }
  };

  const handleNotesChange = async (opportunityId, notes) => {
    try {
      const updated = await updateSaved(opportunityId, { notes });
      setSavedItems((prev) =>
        prev.map((item) => (item.opportunityId === opportunityId ? updated : item))
      );
    } catch (err) {
      setStatusMessage(err.message || 'Unable to save notes.');
    }
  };

  const handleRemove = async (opportunityId, title) => {
    try {
      await unsaveOpportunity(opportunityId);
      setSavedItems((prev) => prev.filter((item) => item.opportunityId !== opportunityId));
      setStatusMessage(`Removed ${title} from saved.`);
    } catch (err) {
      setStatusMessage(err.message || 'Unable to remove opportunity.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8" role="status" aria-label="Loading saved opportunities">
        <div className="w-64 h-8 bg-[var(--color-line)] rounded-[var(--radius-control)] mb-6" />
        <div className="h-64 bg-[var(--color-line)] rounded-[var(--radius-card)] mb-4" />
        <div className="h-64 bg-[var(--color-line)] rounded-[var(--radius-card)]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Live status announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)] mb-2">
          Your saved opportunities
        </h1>
        <p className="text-base text-[var(--color-muted)]">
          Track saved opportunities, deadlines and application status in one list.
        </p>
      </div>

      {savedItems.length === 0 ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-8 text-center max-w-xl mx-auto my-8">
          <p className="text-[var(--color-muted)] text-base mb-6">
            You have not saved anything yet. Save a listing from Discover and it will appear here.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
          >
            Go to Discover
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {savedItems.map((saved) => {
            const opp = opportunitiesMap.get(saved.opportunityId) || {
              id: saved.opportunityId,
              title: 'Opportunity',
              organizer: 'Organizer',
              category: 'event',
              deadline: null,
              registrationUrl: ''
            };

            const categoryLabel = opp.category
              ? opp.category.charAt(0).toUpperCase() + opp.category.slice(1)
              : 'Opportunity';

            const hasSafeRegUrl = isSafeHttpUrl(opp.registrationUrl);

            return (
              <article
                key={saved.opportunityId}
                className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-6 space-y-6"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-[var(--color-line)]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <Badge variant="brand">{categoryLabel}</Badge>
                      {opp.isSample && <Badge variant="warn">Demo listing</Badge>}
                      {opp.deadline && (
                        <Badge variant="default">
                          Deadline: {formatDate(opp.deadline)}
                        </Badge>
                      )}
                    </div>

                    <h2 className="text-xl font-semibold text-[var(--color-ink)] mb-1">
                      <Link
                        to={`/opportunity/${opp.id}`}
                        className="hover:text-[var(--color-brand)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
                      >
                        {opp.title}
                      </Link>
                    </h2>
                    <p className="text-sm text-[var(--color-muted)]">
                      {opp.organizer}
                    </p>
                  </div>

                  <div className="w-full sm:w-48 shrink-0">
                    <StatusSelect
                      id={`status-${saved.opportunityId}`}
                      value={saved.applicationStatus || 'interested'}
                      onChange={(newStatus) => handleStatusChange(saved.opportunityId, newStatus)}
                    />
                  </div>
                </div>

                {/* Checklist (Next steps) */}
                <Checklist
                  opportunityId={saved.opportunityId}
                  steps={saved.nextSteps || []}
                  onUpdateSteps={(steps) => handleUpdateSteps(saved.opportunityId, steps)}
                />

                {/* Notes */}
                <div className="space-y-1">
                  <label
                    htmlFor={`notes-${saved.opportunityId}`}
                    className="block text-sm font-semibold text-[var(--color-ink)]"
                  >
                    Notes
                  </label>
                  <textarea
                    id={`notes-${saved.opportunityId}`}
                    rows={3}
                    defaultValue={saved.notes || ''}
                    onBlur={(e) => handleNotesChange(saved.opportunityId, e.target.value)}
                    placeholder="Add personal notes, interview dates or reminders"
                    maxLength={1000}
                    className="w-full p-3 border border-[var(--color-line)] rounded-[var(--radius-control)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
                  />
                  <p className="text-xs text-[var(--color-muted)] text-right">
                    Maximum 1000 characters
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--color-line)]">
                  <button
                    type="button"
                    onClick={() => handleRemove(saved.opportunityId, opp.title)}
                    className="inline-flex items-center gap-2 min-h-[44px] px-3 rounded-[var(--radius-control)] text-sm font-medium text-[var(--color-danger-ink)] hover:bg-[var(--color-danger-bg)] border border-[var(--color-danger-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                    <span>Remove from saved</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <Link
                      to={`/opportunity/${opp.id}`}
                      className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-line)] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-canvas)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
                    >
                      View details
                    </Link>

                    {hasSafeRegUrl && (
                      <a
                        href={opp.registrationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
                      >
                        <span>Open registration page</span>
                        <ExternalLink size={16} aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
