import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "var(--bg-main, #0f172a)",
            color: "var(--text-primary, #f8fafc)",
            padding: "20px",
            textAlign: "center",
            fontFamily: "system-ui, -apple-system, sans-serif",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              background: "var(--bg-elevated, #1e293b)",
              padding: "36px 28px",
              borderRadius: "16px",
              boxShadow: "0 20px 35px -5px rgba(0, 0, 0, 0.4)",
              maxWidth: "460px",
              width: "100%",
              border: "1px solid var(--border, rgba(255, 255, 255, 0.1))",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "#ef4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                margin: "0 auto 16px auto",
                boxShadow: "0 0 20px rgba(239, 68, 68, 0.2)",
              }}
            >
              ⚠️
            </div>
            <h2
              style={{
                fontSize: "1.25rem",
                marginBottom: "10px",
                fontWeight: "700",
                color: "var(--text-primary, #ffffff)",
              }}
            >
              Service Temporarily Unavailable
            </h2>
            <p
              style={{
                color: "var(--text-secondary, #94a3b8)",
                fontSize: "0.875rem",
                lineHeight: "1.6",
                marginBottom: "24px",
              }}
            >
              We encountered a temporary connection issue. Please check your network connection or retry.
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  flex: "1",
                  minWidth: "130px",
                  backgroundColor: "transparent",
                  color: "var(--text-primary, #ffffff)",
                  border: "1px solid var(--border, rgba(255, 255, 255, 0.2))",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Go to Dashboard
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  flex: "1",
                  minWidth: "130px",
                  backgroundColor: "var(--accent, #6366f1)",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 2px 10px rgba(99, 102, 241, 0.35)",
                  transition: "all 0.2s ease",
                }}
              >
                Retry Connection
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
