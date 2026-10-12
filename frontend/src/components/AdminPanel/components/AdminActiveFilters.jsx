export default function AdminActiveFilters({
  activeFilters,
  activeFilterCount,
  handleClearAllFilters,
}) {
  if (activeFilterCount === 0) return null;

  return (
    <div className="command-active-chips-strip">
      <span className="active-chips-label">Applied:</span>
      <div className="active-chips-scroll">
        {activeFilters.map((f) => (
          <span key={f.id} className="active-filter-chip">
            <span className="chip-key">{f.label}:</span>
            <strong className="chip-val">{f.displayValue}</strong>
            <button
              type="button"
              className="chip-remove-btn"
              onClick={f.clear}
              title={`Remove ${f.label} filter`}
            >
              ✕
            </button>
          </span>
        ))}
      </div>

      <button
        type="button"
        className="command-clear-all-btn"
        onClick={handleClearAllFilters}
        title="Clear all active filters"
      >
        Clear all
      </button>
    </div>
  );
}
