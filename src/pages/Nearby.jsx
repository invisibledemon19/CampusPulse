import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, SlidersHorizontal, User } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { listOpportunities, getProfile, listSaved, saveOpportunity, unsaveOpportunity } from '../services/index.js';
import { rankOpportunities } from '../utils/scoring.js';
import OpportunityCard from '../components/OpportunityCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';

export default function Nearby() {
  usePageMeta({
    title: 'Offline events near you | CampusPlus',
    description: 'Browse in-person hackathons, workshops and events in your city. Set a travel distance and a maximum registration fee.',
    path: '/nearby',
    noindex: false
  });

  const [opportunities, setOpportunities] = useState([]);
  const [profile, setProfile] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Local overrides that do not persist to profile
  const [maxDistanceOverride, setMaxDistanceOverride] = useState('');
  const [maxFeeOverride, setMaxFeeOverride] = useState('');

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

      if (userProfile) {
        if (userProfile.maxDistanceKm !== null && userProfile.maxDistanceKm !== undefined) {
          setMaxDistanceOverride(String(userProfile.maxDistanceKm));
        }
        if (userProfile.maxRegistrationFee !== null && userProfile.maxRegistrationFee !== undefined) {
          setMaxFeeOverride(String(userProfile.maxRegistrationFee));
        }
      }
    } catch (err) {
      setError(err.message || 'Listings could not be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute effective profile with local overrides
  const effectiveProfile = useMemo(() => {
    if (!profile) return null;
    return {
      ...profile,
      maxDistanceKm: maxDistanceOverride === '' ? null : Number(maxDistanceOverride),
      maxRegistrationFee: maxFeeOverride === '' ? null : Number(maxFeeOverride)
    };
  }, [profile, maxDistanceOverride, maxFeeOverride]);

  // Filter to offline or hybrid, and check location
  const nearbyItems = useMemo(() => {
    // Only offline or hybrid listings
    const offlineOrHybrid = opportunities.filter((opp) => {
      const f = (opp.format || '').toLowerCase();
      return f === 'offline' || f === 'hybrid';
    });

    const { ranked } = rankOpportunities(offlineOrHybrid, effectiveProfile);

    // If profile has no city, show every offline listing
    if (!profile?.location) {
      return ranked;
    }

    // Otherwise, location score must be 70 or higher (same city, same region or within distance)
    return ranked.filter((item) => {
      const locScore = item.components?.location;
      return locScore !== null && locScore !== undefined && locScore >= 70;
    });
  }, [opportunities, effectiveProfile, profile]);

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
        setStatusMessage(err.message || 'Unable to update saved item.');
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
        setStatusMessage(err.message || 'Unable to save item.');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Live announcement region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)] mb-2">
          Offline events within your travel distance
        </h1>
        <p className="text-base text-[var(--color-muted)]">
          Browse in-person hackathons, workshops and events in your city. Set a travel distance and a maximum registration fee.
        </p>
      </div>

      {/* Note if profile has no city */}
      {!profile?.location && !loading && !error && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-4 md:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-[var(--color-brand)] shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium text-[var(--color-ink)]">
              Add your city in your profile to see only nearby events.
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

      {/* Override controls bar */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-4 md:p-5 mb-6">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-[var(--color-ink)]">
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span>Adjust distance and fee limit for this view</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="nearby-distance" className="block text-xs font-medium text-[var(--color-ink)] mb-1">
              Maximum distance (km)
            </label>
            <input
              id="nearby-distance"
              type="number"
              min="0"
              max="2000"
              value={maxDistanceOverride}
              onChange={(e) => setMaxDistanceOverride(e.target.value)}
              placeholder="e.g. 50"
              className="w-full min-h-[44px] px-3 border border-[var(--color-line)] rounded-[var(--radius-control)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
            />
          </div>

          <div>
            <label htmlFor="nearby-fee" className="block text-xs font-medium text-[var(--color-ink)] mb-1">
              Maximum registration fee
            </label>
            <input
              id="nearby-fee"
              type="number"
              min="0"
              value={maxFeeOverride}
              onChange={(e) => setMaxFeeOverride(e.target.value)}
              placeholder="Leave empty for any fee"
              className="w-full min-h-[44px] px-3 border border-[var(--color-line)] rounded-[var(--radius-control)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setMaxDistanceOverride(profile?.maxDistanceKm ? String(profile.maxDistanceKm) : '');
                setMaxFeeOverride(profile?.maxRegistrationFee ? String(profile.maxRegistrationFee) : '');
              }}
              className="w-full min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-line)] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-canvas)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
            >
              Reset to profile limits
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="mb-4">
        <p className="text-sm text-[var(--color-muted)]" aria-live="polite">
          Showing {nearbyItems.length} offline and hybrid opportunities
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="status" aria-label="Loading nearby events">
          <div className="h-60 bg-[var(--color-line)] rounded-[var(--radius-card)]" />
          <div className="h-60 bg-[var(--color-line)] rounded-[var(--radius-card)]" />
        </div>
      )}

      {error && !loading && (
        <ErrorState message={error} onRetry={loadData} />
      )}

      {!loading && !error && nearbyItems.length === 0 && (
        <EmptyState
          message="No offline events match your distance and fee filters. Try raising the distance or fee limit."
          actionText="Reset filters"
          onAction={() => {
            setMaxDistanceOverride('');
            setMaxFeeOverride('');
          }}
        />
      )}

      {!loading && !error && nearbyItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {nearbyItems.map((item) => (
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
    </div>
  );
}
