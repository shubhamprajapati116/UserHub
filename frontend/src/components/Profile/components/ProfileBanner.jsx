function ProfileBanner() {
  return (
    <div className="profile-banner">
      <div className="banner-aurora-glow"></div>
      <svg
        className="banner-aurora-wave"
        viewBox="0 0 1200 240"
        fill="none"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="auroraGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#a855f7" stopOpacity="0.95" />
            <stop offset="80%" stopColor="#06b6d4" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="auroraGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
            <stop offset="50%" stopColor="#818cf8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.35" />
          </linearGradient>
          <filter id="auroraGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Ambient Glow Ribbon */}
        <path
          d="M-40,150 Q 260,40, 560,135 T 1160,65 Q 1240,95, 1260,110"
          fill="none"
          stroke="url(#auroraGrad2)"
          strokeWidth="32"
          filter="url(#auroraGlow)"
        />
        {/* Primary Neon Aurora Wave Ribbon */}
        <path
          d="M-40,140 Q 240,55, 540,140 T 1140,55 Q 1220,85, 1260,100"
          fill="none"
          stroke="url(#auroraGrad1)"
          strokeWidth="14"
          filter="url(#auroraGlow)"
        />
        {/* Crisp Center Light Core */}
        <path
          d="M-40,140 Q 240,55, 540,140 T 1140,55 Q 1220,85, 1260,100"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeOpacity="0.8"
        />
      </svg>
      <div className="banner-overlay-fade"></div>
    </div>
  );
}

export default ProfileBanner;
