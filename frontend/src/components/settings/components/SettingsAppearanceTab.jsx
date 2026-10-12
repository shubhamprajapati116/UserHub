export default function SettingsAppearanceTab({ darkMode, handledarkmode }) {
  return (
    <div className="setting-section-panel">
      <div className="setting-info">
        <div className="setting-info-icon appearance">
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
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        </div>
        <div>
          <h3>Appearance & Theme</h3>
          <p>
            Choose how UserHub looks on your screen based on what feels
            comfortable for you.
          </p>
        </div>
      </div>

      <div className="theme-selector-grid">
        <div
          className={`theme-preview-card ${darkMode ? "selected" : ""}`}
          onClick={() => {
            if (!darkMode) handledarkmode();
          }}
          role="button"
          tabIndex={0}
        >
          <div className="theme-preview-box dark">
            <div className="preview-window">
              <div className="preview-bar"></div>
              <div className="preview-content">
                <div className="preview-line short"></div>
                <div className="preview-line long"></div>
              </div>
            </div>
          </div>
          <div className="theme-card-info">
            <div className="theme-title-row">
              <span className="theme-name">🌙 Dark Theme</span>
              {darkMode && <span className="theme-active-tag">Active</span>}
            </div>
            <p className="theme-desc">
              Dark background that is easy on your eyes, especially in low light
              or at night.
            </p>
          </div>
        </div>

        <div
          className={`theme-preview-card ${!darkMode ? "selected" : ""}`}
          onClick={() => {
            if (darkMode) handledarkmode();
          }}
          role="button"
          tabIndex={0}
        >
          <div className="theme-preview-box light">
            <div className="preview-window">
              <div className="preview-bar"></div>
              <div className="preview-content">
                <div className="preview-line short"></div>
                <div className="preview-line long"></div>
              </div>
            </div>
          </div>
          <div className="theme-card-info">
            <div className="theme-title-row">
              <span className="theme-name">☀️ Light Theme</span>
              {!darkMode && <span className="theme-active-tag">Active</span>}
            </div>
            <p className="theme-desc">
              Bright and clean layout with high contrast, ideal for daytime
              reading.
            </p>
          </div>
        </div>
      </div>

      <div className="setting-card">
        <div className="setting-card-icon moon">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </div>
        <div className="setting-card-content">
          <h4>Dark Mode Toggle</h4>
          <p>Quickly switch between dark and light mode anytime.</p>
        </div>
        <label className="switch">
          <input
            type="checkbox"
            checked={darkMode}
            onChange={handledarkmode}
          />
          <span className="slider"></span>
        </label>
      </div>
    </div>
  );
}
