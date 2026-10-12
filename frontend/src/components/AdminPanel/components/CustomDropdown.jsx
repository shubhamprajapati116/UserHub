import { useState, useEffect, useRef } from "react";

export default function CustomDropdown({
  options,
  value,
  onChange,
  dropUp = false,
  prefix = "",
  icon = null,
}) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption =
    options.find((o) => String(o.value) === String(value)) || options[0];

  const isFiltered = Boolean(value && value !== "");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.left;
      if (spaceRight < 185 || rect.right > window.innerWidth - 20) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    }
  }, [open]);

  const fullLabel =
    `${prefix ? prefix + " " : ""}${selectedOption ? selectedOption.label : ""}`.trim();

  return (
    <div
      className={`custom-dropdown-container ${dropUp ? "drop-up" : ""} ${isFiltered ? "is-filtered" : ""}`}
      ref={dropdownRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={`custom-dropdown-btn ${open ? "open" : ""} ${isFiltered ? "active-filter" : ""}`}
        title={fullLabel}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <span className="dropdown-label-wrap">
          {icon && <span className="dropdown-prefix-icon">{icon}</span>}
          {prefix && <span className="dropdown-prefix">{prefix}</span>}
          <span className="dropdown-value-text">
            {selectedOption ? selectedOption.label : ""}
          </span>
        </span>
        <svg
          className={`dropdown-chevron ${open ? "rotate" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          className={`custom-dropdown-menu ${dropUp ? "drop-up-menu" : ""} ${alignRight ? "align-right" : ""}`}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`custom-dropdown-item ${String(opt.value) === String(value) ? "active" : ""} ${opt.disabled ? "item-disabled" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                if (opt.disabled) return;
                onChange(opt.value);
                setOpen(false);
              }}
              title={opt.label}
            >
              <span className="dropdown-item-text">{opt.label}</span>
              {!opt.disabled && String(opt.value) === String(value) && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="dropdown-item-check"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
