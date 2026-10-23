import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, User } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { listOpportunities, getProfile, listSaved, saveOpportunity, unsaveOpportunity } from '../services/index.js';
import { rankOpportunities } from '../utils/scoring.js';
import { normalizeTag } from '../utils/tags.js';
import OpportunityCard from '../components/OpportunityCard.jsx';
import SearchFilters from '../components/SearchFilters.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';

export default function Discover() {
  usePageMeta({
    title: 'Find student opportunities | CampusPlus',
    description: 'Search hackathons, internships and workshops by skill, cost, city and deadline. See why each one fits you and what to do next.',
    path: '/',
    noindex: false
  });

  const [opportunities, setOpportunities] = useState([]);
  const [profile, setProfile] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    cost: 'any',
    format: 'any',
    city: 'all',
    sort: 'fit'
  });
  const [showHidden, setShowHidden] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Debounce search input by 200ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [opps, userProfile, savedList] = await Promise.all([
        listOpportunities(),
        getProfile(),
        listSaved()
      ]);
      setOpportunities(opps);
      setProfile(userProfile);
      setSavedIds(new Set(savedList.map((s) => s.opportunityId)));
    } catch (err) {
      setError(err.message || 'Listings could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute available cities from opportunities for filter dropdown
  const availableCities = useMemo(() => {
    const cities = new Set();
    for (const opp of opportunities) {
      if (opp.city && typeof opp.city === 'string' && opp.city.trim()) {
        cities.add(opp.city.trim());
      }
    }
    return Array.from(cities).sort((a, b) => a.localeCompare(b));
  }, [opportunities]);

  // Rank opportunities once per profile or data change
  const { ranked, excluded } = useMemo(() => {
    if (opportunities.length === 0) {
      return { ranked: [], excluded: [] };
    }
    return rankOpportunities(opportunities, profile);
  }, [opportunities, profile]);

  // Filter and search logic
  const matchesSearchAndFilters = (item) => {
    const opp = item.opportunity;

    // Search query match
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase();
      const normQ = normalizeTag(debouncedSearch);

      const titleMatch = (opp.title || '').toLowerCase().includes(q);
      const organizerMatch = (opp.organizer || '').toLowerCase().includes(q);
      const cityMatch = (opp.city || '').toLowerCase().includes(q);
      const tagMatch = (opp.tags || []).some((t) => {
        const normT = normalizeTag(t);
        return normT.includes(normQ) || (t || '').toLowerCase().includes(q);
      });

      if (!titleMatch && !organizerMatch && !cityMatch && !tagMatch) {
        return false;
      }
    }

    // Category filter
    if (filters.category !== 'all') {
      if ((opp.category || '').toLowerCase() !== filters.category.toLowerCase()) {
        return false;
      }
    }

    // Cost filter
    if (filters.cost === 'free') {
      if (opp.registrationFee !== 0) return false;
    } else if (filters.cost === 'paid') {
      if (!opp.registrationFee || opp.registrationFee <= 0) return false;
    }

    // Format filter
    if (filters.format !== 'any') {
      if ((opp.format || '').toLowerCase() !== filters.format.toLowerCase()) {
        return false;
      }
    }

    // City filter
    if (filters.city !== 'all') {
      if ((opp.city || '').toLowerCase() !== filters.city.toLowerCase()) {
        return false;
      }
    }

    return true;
  };

  // Process ranked and excluded lists
  const filteredRanked = useMemo(() => {
    const list = ranked.filter(matchesSearchAndFilters);

    if (filters.sort === 'deadline') {
      return [...list].sort((a, b) => {
        const dA = a.urgency.daysLeft;
        const dB = b.urgency.daysLeft;
        if (dA === null && dB !== null) return 1;
        if (dA !== null && dB === null) return -1;
        if (dA !== null && dB !== null && dA !== dB) return dA - dB;
        return (a.opportunity.title || '').localeCompare(b.opportunity.title || '');
      });
    }

    if (filters.sort === 'date') {
      return [...list].sort((a, b) => {
        const sA = a.opportunity.startDate;
        const sB = b.opportunity.startDate;
        if (!sA && sB) return 1;
        if (sA && !sB) return -1;
        if (sA && sB && sA !== sB) return sA.localeCompare(sB);
        return (a.opportunity.title || '').localeCompare(b.opportunity.title || '');
      });
    }

    return list;
  }, [ranked, debouncedSearch, filters]);

  const filteredExcluded = useMemo(() => {
    return excluded.filter(matchesSearchAndFilters);
  }, [excluded, debouncedSearch, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setFilters({
      category: 'all',
      cost: 'any',
      format: 'any',
      city: 'all',
      sort: 'fit'
    });
  };

  const handleSaveToggle = async (opportunityId) => {
    const opp = opportunities.find((o) => o.id === opportunityId);
    const title = opp?.title || 'Opportunity';

    if (savedIds.has(opportunityId)) {
      try {
        await unsaveOpportunity(opportunityId);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(opportunityId);
          return next;
        });
        setStatusMessage(`Removed ${title} from saved.`);
      } catch (err) {
        setStatusMessage(err.message || 'Unable to remove saved opportunity.');
      }
    } else {
      try {
        await saveOpportunity(opportunityId);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.add(opportunityId);
          return next;
        });
        setStatusMessage(`Saved ${title}.`);
      } catch (err) {
        setStatusMessage(err.message || 'Unable to save opportunity.');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Live announcement region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)] mb-2">
          Hackathons, internships and workshops that fit your skills and budget
        </h1>
        <p className="text-[var(--color-muted)] text-base">
          Set your skills, city and fee limit once. CampusPlus ranks each listing by fit and shows the reason.
        </p>
      </div>

      {/* No profile banner */}
      {!profile && !loading && !error && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-4 md:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <User size={20} className="text-[var(--color-brand)] shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium text-[var(--color-ink)]">
              Add your skills, city and fee limit to see fit scores.
            </p>
          </div>
          <Link
            to="/profile"
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] shrink-0"
          >
            Set up profile
          </Link>
        </div>
      )}

      {/* Mobile Filter Toggle Button */}
      <div className="lg:hidden mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsMobileFiltersOpen(true)}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-line)] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-canvas)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>Filters</span>
        </button>

        <span className="text-sm text-[var(--color-muted)]" aria-live="polite">
          Showing {filteredRanked.length} of {opportunities.length} opportunities
        </span>
      </div>

      {/* Main Grid Layout: Left Filter column, Right Results */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block sticky top-20">
          <SearchFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            cities={availableCities}
          />
        </aside>

        {/* Mobile Filter Modal Panel */}
        {isMobileFiltersOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filter opportunities"
            className="fixed inset-0 z-50 bg-black/40 flex justify-end"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsMobileFiltersOpen(false);
            }}
          >
            <div className="bg-[var(--color-surface)] w-full max-w-xs h-full p-4 overflow-y-auto">
              <SearchFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                cities={availableCities}
                isMobileOpen={isMobileFiltersOpen}
                onToggleMobile={() => setIsMobileFiltersOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Results column */}
        <section aria-label="Opportunities list">
          {/* Results count header (Desktop) */}
          <div className="hidden lg:flex items-center justify-between mb-4">
            <p className="text-sm text-[var(--color-muted)]" aria-live="polite">
              Showing {filteredRanked.length} of {opportunities.length} opportunities
            </p>
          </div>

          {/* Loading state: static skeleton blocks */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="status" aria-label="Loading opportunities">
              <div className="h-60 bg-[var(--color-line)] rounded-[var(--radius-card)]" />
              <div className="h-60 bg-[var(--color-line)] rounded-[var(--radius-card)]" />
              <div className="h-60 bg-[var(--color-line)] rounded-[var(--radius-card)]" />
              <div className="h-60 bg-[var(--color-line)] rounded-[var(--radius-card)]" />
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <ErrorState message={error} onRetry={loadData} />
          )}

          {/* Empty state */}
          {!loading && !error && filteredRanked.length === 0 && (
            <EmptyState
              message="No opportunities match these filters. Clear the filters or raise your fee limit."
              actionText="Clear filters"
              onAction={handleClearFilters}
            />
          )}

          {/* Opportunity cards grid */}
          {!loading && !error && filteredRanked.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {filteredRanked.map((item) => (
                <OpportunityCard
                  key={item.opportunity.id}
                  item={item}
                  isSaved={savedIds.has(item.opportunity.id)}
                  onSaveToggle={handleSaveToggle}
                  isExcluded={false}
                />
              ))}
            </div>
          )}

          {/* Hidden listings toggle and grid */}
          {!loading && !error && filteredExcluded.length > 0 && (
            <div className="mt-8 pt-6 border-t border-[var(--color-line)]">
              <button
                type="button"
                onClick={() => setShowHidden((prev) => !prev)}
                className="w-full min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-line)] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-canvas)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] mb-4"
              >
                {showHidden
                  ? `Hide ${filteredExcluded.length} hidden listings`
                  : `Show ${filteredExcluded.length} hidden listings`}
              </button>

              {showHidden && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredExcluded.map((item) => (
                    <OpportunityCard
                      key={item.opportunity.id}
                      item={item}
                      isSaved={savedIds.has(item.opportunity.id)}
                      onSaveToggle={handleSaveToggle}
                      isExcluded={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
