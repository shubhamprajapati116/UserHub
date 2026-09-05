import "./AuthBrandPanel.css";

function AuthBrandPanel({
  title = "Manage users with confidence",
  subtitle = "A secure platform for user management, profile updates, and account settings — built for modern teams.",
  type = "login", // 'login' or 'register'
}) {
  const loginFeatures = [
    {
      title: "Role-Based Access Control",
      desc: "Granular permissions for Admins and Standard users.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      title: "Real-Time Profile Sync",
      desc: "Instant profile updates with secure image uploads.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      ),
    },
    {
      title: "Enterprise Grade Security",
      desc: "Encrypted authentication and active session protection.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      ),
    },
  ];

  const registerFeatures = [
    {
      title: "Instant Account Setup",
      desc: "Get started in under 30 seconds with quick verification.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    {
      title: "Custom Avatar & Bio",
      desc: "Personalize your profile details and preferences.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
    },
    {
      title: "Universal Access",
      desc: "Access your dashboard seamlessly on mobile & desktop.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="4" rx="1" />
          <rect x="14" y="10" width="7" height="11" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
  ];

  const forgotFeatures = [
    {
      title: "Secure Reset Link",
      desc: "A one-time password reset link is sent directly to your verified email.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
      ),
    },
    {
      title: "Link Expires in 1 Hour",
      desc: "For your protection, reset links expire automatically after 60 minutes.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      title: "Back in Minutes",
      desc: "Follow the link in your email to set a new password and regain access.",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
    },
  ];

  const features =
    type === "register"
      ? registerFeatures
      : type === "forgot"
        ? forgotFeatures
        : loginFeatures;


  return (
    <div className="auth-split-brand">
      {/* Background Decorative Mesh & Glow Overlay */}
      <div className="auth-brand-ambient-glow" />
      <div className="auth-brand-grid-pattern" />

      {/* Top Header Logo & Heading */}
      <div className="auth-brand-top">
        <div className="auth-brand-logo">
          <div className="auth-brand-logo-icon">U</div>
          <div className="auth-brand-title-wrap">
            <span className="auth-brand-name">UserHub</span>
            <span className="auth-brand-tagline">Management Platform</span>
          </div>
        </div>

        <h1 className="auth-brand-headline">{title}</h1>
        <p className="auth-brand-desc">{subtitle}</p>

        <div className="auth-brand-divider" />
      </div>

      {/* Bottom Feature Items with Titles & Descriptions */}
      <div className="auth-brand-features">
        {features.map((feat, index) => (
          <div className="auth-brand-feature-item" key={index}>
            <div className="auth-brand-feature-icon">{feat.icon}</div>
            <div className="auth-brand-feature-content">
              <h4 className="auth-feature-title">{feat.title}</h4>
              <p className="auth-feature-desc">{feat.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AuthBrandPanel;
