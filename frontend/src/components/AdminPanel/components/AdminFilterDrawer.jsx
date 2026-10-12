export default function AdminFilterDrawer({
  isFilterDrawerOpen,
  setIsFilterDrawerOpen,
  draftFilters,
  setDraftFilters,
  draftFilterCount,
  handleResetDraftFilters,
  handleApplyFilters,
}) {
  if (!isFilterDrawerOpen) return null;

  return (
    <div
      className="filter-drawer-backdrop"
      onClick={() => setIsFilterDrawerOpen(false)}
    >
      <div
        className="filter-drawer-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Filter users directory"
      >
        <div className="filter-drawer-header">
          <div className="filter-drawer-title-wrap">
            <div className="filter-drawer-icon-wrap">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
            </div>
            <div>
              <h3 className="filter-drawer-title">Filter Directory</h3>
              <p className="filter-drawer-subtitle">
                {draftFilterCount > 0
                  ? `${draftFilterCount} active filter${draftFilterCount === 1 ? "" : "s"}`
                  : "Narrow down user results"}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="filter-drawer-close-btn"
            onClick={() => setIsFilterDrawerOpen(false)}
            title="Close filter panel (Esc)"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="filter-drawer-body">
          <div className="drawer-filter-section">
            <div className="drawer-filter-label">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>User Role</span>
            </div>
            <div className="drawer-options-grid">
              {[
                { label: "All Roles", value: "" },
                { label: "Admin", value: "admin" },
                { label: "User", value: "user" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`drawer-option-pill ${draftFilters.role === opt.value ? "active" : ""}`}
                  onClick={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      role: opt.value,
                    }))
                  }
                >
                  <span>{opt.label}</span>
                  {draftFilters.role === opt.value && (
                    <span className="option-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="drawer-filter-section">
            <div className="drawer-filter-label">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Account Status</span>
            </div>
            <div className="drawer-options-grid cols-2">
              {[
                { label: "All Status", value: "", dot: null },
                {
                  label: "Active",
                  value: "active",
                  dot: "status-dot-active",
                },
                {
                  label: "Suspended",
                  value: "suspended",
                  dot: "status-dot-suspended",
                },
                {
                  label: "Banned",
                  value: "banned",
                  dot: "status-dot-banned",
                },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`drawer-option-pill ${draftFilters.status === opt.value ? "active" : ""}`}
                  onClick={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      status: opt.value,
                    }))
                  }
                >
                  <span className="pill-content">
                    {opt.dot && (
                      <span
                        className={`drawer-status-dot ${opt.dot}`}
                      ></span>
                    )}
                    <span>{opt.label}</span>
                  </span>
                  {draftFilters.status === opt.value && (
                    <span className="option-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="drawer-filter-section">
            <div className="drawer-filter-label">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>Email Verification</span>
            </div>
            <div className="drawer-options-grid">
              {[
                { label: "All Emails", value: "" },
                { label: "Verified", value: "verified" },
                { label: "Pending Invites", value: "pending_invite" },
                { label: "Unverified", value: "unverified" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`drawer-option-pill ${draftFilters.verification === opt.value ? "active" : ""}`}
                  onClick={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      verification: opt.value,
                    }))
                  }
                >
                  <span>{opt.label}</span>
                  {draftFilters.verification === opt.value && (
                    <span className="option-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="drawer-filter-section">
            <div className="drawer-filter-label">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              </svg>
              <span>Gender</span>
            </div>
            <div className="drawer-options-grid cols-2">
              {[
                { label: "All Genders", value: "" },
                { label: "Male", value: "male" },
                { label: "Female", value: "female" },
                { label: "Other", value: "other" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`drawer-option-pill ${draftFilters.gender === opt.value ? "active" : ""}`}
                  onClick={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      gender: opt.value,
                    }))
                  }
                >
                  <span>{opt.label}</span>
                  {draftFilters.gender === opt.value && (
                    <span className="option-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="drawer-filter-section">
            <div className="drawer-filter-label">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Joined Date</span>
            </div>
            <div className="drawer-options-grid cols-2">
              {[
                { label: "All Time", value: "" },
                { label: "Today", value: "today" },
                { label: "Last 7 Days", value: "7d" },
                { label: "Last 30 Days", value: "30d" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`drawer-option-pill ${draftFilters.timeframe === opt.value ? "active" : ""}`}
                  onClick={() =>
                    setDraftFilters((prev) => ({
                      ...prev,
                      timeframe: opt.value,
                    }))
                  }
                >
                  <span>{opt.label}</span>
                  {draftFilters.timeframe === opt.value && (
                    <span className="option-check">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="filter-drawer-footer">
          <button
            type="button"
            className="drawer-reset-btn"
            disabled={draftFilterCount === 0}
            onClick={handleResetDraftFilters}
          >
            Reset All
          </button>
          <button
            type="button"
            className="drawer-apply-btn"
            onClick={handleApplyFilters}
          >
            <span>
              Apply Filters
              {draftFilterCount > 0 ? ` (${draftFilterCount})` : ""}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
