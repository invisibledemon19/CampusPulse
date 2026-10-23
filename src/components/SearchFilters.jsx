import { SlidersHorizontal, X } from 'lucide-react';

export default function SearchFilters({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  onClearFilters,
  cities = [],
  isMobileOpen = false,
  onToggleMobile
}) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-4 space-y-4">
      {/* Mobile Header with close button */}
      <div className="flex items-center justify-between lg:hidden pb-2 border-b border-[var(--color-line)]">
        <h2 className="text-base font-semibold text-[var(--color-ink)]">
          Filters
        </h2>
        <button
          type="button"
          onClick={onToggleMobile}
          aria-label="Close filters"
          className="p-2 text-[var(--color-muted)] hover:text-[var(--color-ink)] rounded-[var(--radius-control)] min-h-[44px] min-w-[44px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>

      {/* Search field */}
      <div>
        <label htmlFor="search-input" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
          Search
        </label>
        <input
          id="search-input"
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Title, organizer, skill or city"
          className="w-full min-h-[44px] px-3 border border-[var(--color-line)] rounded-[var(--radius-control)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category-select" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
          Category
        </label>
        <select
          id="category-select"
          value={filters.category}
          onChange={(e) => onFilterChange('category', e.target.value)}
          className="w-full min-h-[44px] px-3 border border-[var(--color-line)] rounded-[var(--radius-control)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        >
          <option value="all">All</option>
          <option value="hackathon">Hackathon</option>
          <option value="internship">Internship</option>
          <option value="workshop">Workshop</option>
          <option value="event">Event</option>
        </select>
      </div>

      {/* Cost */}
      <div>
        <label htmlFor="cost-select" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
          Cost
        </label>
        <select
          id="cost-select"
          value={filters.cost}
          onChange={(e) => onFilterChange('cost', e.target.value)}
          className="w-full min-h-[44px] px-3 border border-[var(--color-line)] rounded-[var(--radius-control)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        >
          <option value="any">Any</option>
          <option value="free">Free only</option>
          <option value="paid">Paid</option>
        </select>
      </div>

      {/* Format */}
      <div>
        <label htmlFor="format-select" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
          Format
        </label>
        <select
          id="format-select"
          value={filters.format}
          onChange={(e) => onFilterChange('format', e.target.value)}
          className="w-full min-h-[44px] px-3 border border-[var(--color-line)] rounded-[var(--radius-control)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        >
          <option value="any">Any</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      {/* City */}
      <div>
        <label htmlFor="city-select" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
          City
        </label>
        <select
          id="city-select"
          value={filters.city}
          onChange={(e) => onFilterChange('city', e.target.value)}
          className="w-full min-h-[44px] px-3 border border-[var(--color-line)] rounded-[var(--radius-control)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        >
          <option value="all">All cities</option>
          {cities.map((city) => (
            <option key={city} value={city.toLowerCase()}>
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* Sort */}
      <div>
        <label htmlFor="sort-select" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
          Sort
        </label>
        <select
          id="sort-select"
          value={filters.sort}
          onChange={(e) => onFilterChange('sort', e.target.value)}
          className="w-full min-h-[44px] px-3 border border-[var(--color-line)] rounded-[var(--radius-control)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        >
          <option value="fit">Best fit</option>
          <option value="deadline">Deadline soonest</option>
          <option value="date">Event date soonest</option>
        </select>
      </div>

      {/* Clear Filters */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onClearFilters}
          className="w-full min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-line)] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-canvas)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}
