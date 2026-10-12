let isPreloaded = false;

export function preloadAuthBanner() {
  if (typeof window === "undefined" || isPreloaded) return;

  try {
    const img = new Image();
    img.src = "/auth-brand-bg.webp";

    if (img.decode) {
      img
        .decode()
        .then(() => {
          isPreloaded = true;
          window.__AUTH_BANNER_PRELOADED__ = true;
        })
        .catch(() => {
          isPreloaded = true;
          window.__AUTH_BANNER_PRELOADED__ = true;
        });
    } else {
      img.onload = () => {
        isPreloaded = true;
        window.__AUTH_BANNER_PRELOADED__ = true;
      };
    }

    if ("caches" in window) {
      window.caches
        .open("userhub-banner-v1")
        .then((cache) => {
          cache.match("/auth-brand-bg.webp").then((res) => {
            if (!res) {
              cache.add("/auth-brand-bg.webp").catch(() => {});
            }
          });
        })
        .catch(() => {});
    }
  } catch {
  }
}

export function isAuthBannerReady() {
  if (isPreloaded || (typeof window !== "undefined" && window.__AUTH_BANNER_PRELOADED__)) {
    return true;
  }
  if (typeof Image !== "undefined") {
    const probe = new Image();
    probe.src = "/auth-brand-bg.webp";
    if (probe.complete && probe.naturalWidth > 0) {
      isPreloaded = true;
      if (typeof window !== "undefined") {
        window.__AUTH_BANNER_PRELOADED__ = true;
      }
      return true;
    }
  }
  return false;
}
