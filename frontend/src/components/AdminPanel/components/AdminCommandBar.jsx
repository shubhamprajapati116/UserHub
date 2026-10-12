import AdminColumnVisibilityDropdown from "./AdminColumnVisibilityDropdown";

export default function AdminCommandBar({
  search,
  setsearch,
  setDebouncedSearch,
  setpage,
  isRefreshing,
  isLoadingUsers,
  handleManualRefresh,
  handleOpenFilterDrawer,
  activeFilterCount,
  role,
  onAddUser,
  visibleColumns,
  onToggleColumn,
  onResetColumns,
}) {
  return (
    <div className="command-bar-primary-row">
      <div className="command-search-wrap">
        <svg
          className="command-search-icon"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={search}
          placeholder="Search by name, email, or phone number..."
          className="command-search-input"
          onChange={(e) => {
            setsearch(e.target.value);
            setpage(1);
          }}
        />
        {search && (
          <button
            type="button"
            className="command-search-clear"
            onClick={() => {
              setsearch("");
              setDebouncedSearch("");
              setpage(1);
            }}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      <div className="command-actions-group">
        <button
          type="button"
          className={`command-reload-btn ${isRefreshing || isLoadingUsers ? "is-refreshing" : ""}`}
          onClick={handleManualRefresh}
          title="Refresh user list"
          aria-label="Refresh user list"
          disabled={isLoadingUsers || isRefreshing}
        >
          <svg
            className={`reload-icon ${isRefreshing || isLoadingUsers ? "spinning" : ""}`}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span className="reload-btn-label">Refresh</span>
        </button>

        <button
          type="button"
          className={`command-filter-trigger-btn ${activeFilterCount > 0 ? "has-active" : ""}`}
          onClick={handleOpenFilterDrawer}
          title="Filter and refine users"
        >
          <svg
            className="filter-trigger-icon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="filter-trigger-label">Filters</span>
          {activeFilterCount > 0 && (
            <span className="filter-count-badge">
              {activeFilterCount}
            </span>
          )}
        </button>

        <AdminColumnVisibilityDropdown
          visibleColumns={visibleColumns}
          onToggleColumn={onToggleColumn}
          onResetColumns={onResetColumns}
        />

        {role === "admin" && (
          <button
            className="command-add-btn"
            onClick={onAddUser}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add User</span>
          </button>
        )}
      </div>
    </div>
  );
}
