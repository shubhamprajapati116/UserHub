import { Link } from "react-router-dom";
import "./Breadcrumb.css";

function Breadcrumb({ items = [], showHome = false }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="breadcrumb-nav-container" aria-label="Breadcrumb">
      <ol className="breadcrumb-trail">
        {showHome && (
          <li className="breadcrumb-item breadcrumb-home-item">
            <Link to="/" className="breadcrumb-pill breadcrumb-home-link" title="Dashboard">
              <svg
                className="breadcrumb-home-icon"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              <span className="visually-hidden">Home</span>
            </Link>
            <svg
              className="breadcrumb-chevron"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </li>
        )}

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className={`breadcrumb-item ${isLast ? "breadcrumb-item-active" : ""}`}>
              {!isLast && item.path ? (
                <Link to={item.path} className="breadcrumb-pill breadcrumb-link">
                  {item.icon && <span className="breadcrumb-item-icon">{item.icon}</span>}
                  <span className="breadcrumb-label">{item.label}</span>
                </Link>
              ) : (
                <div className="breadcrumb-pill breadcrumb-current" aria-current="page">
                  {item.icon && <span className="breadcrumb-item-icon">{item.icon}</span>}
                  <span className="breadcrumb-label">{item.label}</span>
                </div>
              )}

              {!isLast && (
                <svg
                  className="breadcrumb-chevron"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
