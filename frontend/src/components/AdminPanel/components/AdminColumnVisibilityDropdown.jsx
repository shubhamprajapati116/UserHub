import { useState, useRef, useEffect } from "react";
import { FiColumns, FiChevronDown, FiRotateCcw, FiCheck, FiLock } from "react-icons/fi";

const AVAILABLE_COLUMNS = [
  { id: "role", label: "Role", description: "Admin / User access role" },
  { id: "gender", label: "Gender", description: "Demographic gender" },
  { id: "status", label: "Status", description: "Account status (Active/Suspended/Banned)" },
  { id: "lastActive", label: "Last Active", description: "Recent login or online status" },
  { id: "dob", label: "Date of Birth", description: "Birthdate timestamp" },
];

export default function AdminColumnVisibilityDropdown({
  visibleColumns,
  onToggleColumn,
  onResetColumns,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const activeCount = AVAILABLE_COLUMNS.filter((col) => visibleColumns[col.id]).length;
  const isAllActive = activeCount === AVAILABLE_COLUMNS.length;

  return (
    <div className="col-dropdown-wrap" ref={dropdownRef}>
      <button
        type="button"
        className={`command-columns-btn ${isOpen ? "active" : ""} ${!isAllActive ? "has-custom" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Customize visible columns"
        aria-expanded={isOpen}
      >
        <FiColumns className="columns-icon" size={13} />
        <span className="columns-label">Columns</span>
        {!isAllActive && (
          <span className="columns-count-badge">
            {activeCount}/{AVAILABLE_COLUMNS.length}
          </span>
        )}
        <FiChevronDown className={`columns-chevron ${isOpen ? "open" : ""}`} size={12} />
      </button>

      {isOpen && (
        <div className="col-dropdown-menu">
          <div className="col-dropdown-header">
            <div className="col-dropdown-title-row">
              <span className="col-dropdown-title">Table Columns</span>
              <span className="col-dropdown-sub">
                {activeCount} of {AVAILABLE_COLUMNS.length} active
              </span>
            </div>
          </div>

          <div className="col-dropdown-list">
            {AVAILABLE_COLUMNS.map((col) => {
              const isChecked = !!visibleColumns[col.id];
              const isLastActive = isChecked && activeCount <= 1;
              return (
                <label
                  key={col.id}
                  className={`col-item-row ${isChecked ? "checked" : ""} ${isLastActive ? "locked" : ""}`}
                  onClick={(e) => {
                    if (isLastActive) {
                      e.preventDefault();
                    }
                  }}
                  title={isLastActive ? "At least one column must remain visible" : ""}
                >
                  <div className="col-checkbox-custom">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isLastActive}
                      onChange={() => {
                        if (!isLastActive) {
                          onToggleColumn(col.id);
                        }
                      }}
                    />
                    <span className={`checkbox-visual ${isLastActive ? "locked" : ""}`}>
                      {isChecked && <FiCheck size={11} />}
                    </span>
                  </div>
                  <div className="col-info">
                    <div className="col-name-row">
                      <span className="col-name">{col.label}</span>
                      {isLastActive && (
                        <span className="col-locked-badge">
                          <FiLock size={9} />
                          <span>Required</span>
                        </span>
                      )}
                    </div>
                    <span className="col-desc">{col.description}</span>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="col-dropdown-footer">
            <button
              type="button"
              className="col-reset-btn"
              onClick={() => {
                onResetColumns();
                setIsOpen(false);
              }}
              title="Reset all columns to default visible"
            >
              <FiRotateCcw size={11} />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
