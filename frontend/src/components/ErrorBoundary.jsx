import React from "react";
import "./ErrorBoundary.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ isRetrying: true });
    setTimeout(() => {
      this.setState({ hasError: false, error: null, isRetrying: false });
      window.location.reload();
    }, 400);
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="eb-backdrop" role="alert" aria-live="assertive">
          <div className="eb-card">
            <div className="eb-icon-wrapper" aria-hidden="true">
              <svg
                className="eb-icon-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0-4 7h1a5 5 0 0 0 4.54 3" />
                <line x1="2" y1="2" x2="22" y2="22" strokeWidth="2.1" />
                <path d="M8.5 16.5a5 5 0 0 0 3.5 1.5h6a5 5 0 0 0 3.5-1.5" />
              </svg>
            </div>

            <h2 className="eb-title">Service Temporarily Unavailable</h2>
            <p className="eb-description">
              We encountered a temporary connection issue. Please check your network or retry in a few moments.
            </p>

            <div className="eb-actions">
              <button
                type="button"
                className="eb-btn-secondary"
                onClick={this.handleGoHome}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span>Go to Dashboard</span>
              </button>

              <button
                type="button"
                className="eb-btn-primary"
                onClick={this.handleReload}
                disabled={this.state.isRetrying}
              >
                {this.state.isRetrying ? (
                  <>
                    <span className="eb-btn-spinner" />
                    <span>Connecting…</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                    </svg>
                    <span>Retry Connection</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
