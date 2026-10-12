import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./AppDatePicker.css";

function AppDatePicker({
  id,
  name,
  value,
  onChange,
  disabled = false,
  className = "",
  inputClassName = "",
  maxDate,
  minDate,
  placeholderText = "Select date",
  error = false,
}) {
  const parseSelectedDate = (val) => {
    if (!val) return null;
    try {
      let parsed;
      if (typeof val === "string" && val.length === 10 && val.includes("-")) {
        parsed = new Date(val + "T00:00:00");
      } else {
        parsed = new Date(val);
      }
      return isNaN(parsed.getTime()) ? null : parsed;
    } catch {
      return null;
    }
  };

  const selectedDate = parseSelectedDate(value);

  const handleDateChange = (date) => {
    const formatted = date
      ? date.toLocaleDateString("en-CA")
      : "";

    const syntheticEvent = {
      target: {
        name,
        value: formatted,
        type: "date",
      },
    };
    onChange(syntheticEvent);
  };

  return (
    <div className={`app-datepicker-wrapper ${error ? "dp-error" : ""} ${className}`}>
      <DatePicker
        id={id}
        selected={selectedDate}
        onChange={handleDateChange}
        dateFormat="dd MMM yyyy"
        placeholderText={placeholderText}
        disabled={disabled}
        maxDate={maxDate}
        minDate={minDate}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        autoComplete="off"
        className={`form-input dp-input ${inputClassName} ${error ? "error" : ""}`}
        calendarClassName="app-dp-calendar"
        popperPlacement="bottom-start"
        portalId="root-portal"
      />
      <span className="dp-calendar-icon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </span>
    </div>
  );
}

export default AppDatePicker;
