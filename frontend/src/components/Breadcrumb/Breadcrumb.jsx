import { Link } from "react-router-dom";
import "./Breadcrumb.css";

function Breadcrumb({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="header-breadcrumb-nav" aria-label="Breadcrumb">
      <ol className="header-breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="header-breadcrumb-item">
              {!isLast && item.path ? (
                <Link to={item.path} className="header-breadcrumb-link">
                  {item.label}
                </Link>
              ) : (
                <span className="header-breadcrumb-current" aria-current="page">
                  {item.label}
                </span>
              )}
              {!isLast && (
                <svg
                  className="header-breadcrumb-chevron"
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
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
