import CustomDropdown from "./CustomDropdown";

export default function AdminPagination({
  loading,
  totalInList,
  usersCount,
  page,
  limit,
  totalPages,
  availableLimitOptions,
  setLimit,
  setpage,
}) {
  if (loading) {
    return (
      <div className="linear-pagination">
        <div className="skeleton skeleton-page-btn"></div>
        <div className="skeleton skeleton-page-info"></div>
        <div className="skeleton skeleton-page-btn"></div>
      </div>
    );
  }

  if (totalInList <= 0) return null;

  return (
    <div className="linear-pagination">
      <div className="linear-pagination-info">
        <span className="info-prefix">Showing </span>
        <strong className="font-mono">
          {usersCount > 0 ? (page - 1) * limit + 1 : 0}-
          {Math.min(page * limit, totalInList)}
        </strong>
        <span className="info-divider"> of </span>
        <strong className="font-mono">{totalInList}</strong>
        <span className="info-suffix"> users</span>
      </div>

      <div className="linear-pagination-right">
        <div className="linear-rows-selector">
          <span className="rows-label-full">Rows per page:</span>
          <span className="rows-label-short">Rows:</span>
          <CustomDropdown
            dropUp={true}
            options={availableLimitOptions.map((v) => ({
              value: v,
              label: String(v),
            }))}
            value={limit}
            onChange={(newLimit) => {
              setLimit(Number(newLimit));
              setpage(1);
            }}
          />
        </div>

        <div className="linear-page-nav">
          <button
            className="linear-page-btn prev-btn"
            disabled={page <= 1}
            onClick={() => setpage((p) => Math.max(1, p - 1))}
            title="Previous Page"
            aria-label="Previous Page"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="linear-btn-text">Prev</span>
          </button>
          <span className="linear-page-text font-mono">
            <span className="page-label-full">Page </span>
            {page}
            <span className="page-divider-full"> of </span>
            <span className="page-divider-short">/</span>
            {totalPages}
          </span>
          <button
            className="linear-page-btn next-btn"
            disabled={page >= totalPages}
            onClick={() => setpage((p) => Math.min(totalPages, p + 1))}
            title="Next Page"
            aria-label="Next Page"
          >
            <span className="linear-btn-text">Next</span>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
