import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

function PasswordInput({
  name,
  value,
  onChange,
  placeholder,
  error,
  id,
  disabled,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="password-field">
      <div className="input-wrapper">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          onChange={onChange}
          value={value}
          className="form-input"
          id={id}
          disabled={disabled}
        ></input>
        <button
          type="button"
          className="password-toggle"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          aria-label={showPassword ? "Hide Password" : "Show Password"}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
export default PasswordInput;
