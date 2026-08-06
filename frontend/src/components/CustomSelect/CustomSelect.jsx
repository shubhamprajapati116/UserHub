import { useState, useEffect, useRef } from "react";
import "./CustomSelect.css";

/**
 * CustomSelect — Reusable styled custom dropdown for forms.
 * Replaces native HTML <select> with a sleek dark glassmorphism component.
 */
function CustomSelect({
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = "Select option",
  disabled = false,
  error = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (disabled) return;
    setOpen(false);
    const syntheticEvent = {
      target: {
        id,
        name,
        value: val,
      },
    };
    onChange(syntheticEvent);
  };

  return (
    <div
      className={`custom-form-select-wrapper ${open ? "open" : ""} ${disabled ? "disabled" : ""} ${error ? "has-error" : ""} ${className}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        id={id}
        className="custom-form-select-btn"
        onClick={() => !disabled && setOpen((prev) => !prev)}
        disabled={disabled}
      >
        <span className={selectedOption ? "selected-text" : "placeholder-text"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg
          className={`select-chevron ${open ? "rotate" : ""}`}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="custom-form-select-menu">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`custom-form-select-item ${opt.value === value ? "active" : ""}`}
              onClick={() => handleSelect(opt.value)}
            >
              <span>{opt.label}</span>
              {opt.value === value && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
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

export default CustomSelect;
