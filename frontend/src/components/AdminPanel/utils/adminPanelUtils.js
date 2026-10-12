export const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getInitialsColorClass = (name) => {
  if (!name) return "avatar-indigo";
  const classes = [
    "avatar-emerald",
    "avatar-purple",
    "avatar-pink",
    "avatar-blue",
    "avatar-amber",
    "avatar-cyan",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return classes[Math.abs(hash) % classes.length];
};

export const formatDob = (dobString) => {
  if (!dobString) return "—";
  try {
    if (typeof dobString === "string" && /^\d{4}-\d{2}-\d{2}/.test(dobString)) {
      const [year, month, day] = dobString.split("T")[0].split("-");
      if (year && month && day) {
        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
      }
    }
    const d = new Date(dobString);
    if (isNaN(d.getTime())) return "—";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "—";
  }
};

export const isPlaceholderPhoto = (photo) => {
  if (!photo) return true;
  const p = String(photo).trim().toLowerCase();
  return (
    p === "" ||
    p === "null" ||
    p === "undefined" ||
    p === "false" ||
    p === "default.png" ||
    p === "placeholder.png"
  );
};

export const getAvailableLimitOptions = (total) => {
  const allTiers = [5, 10, 20, 50];
  if (!total || total <= 5) return [5, 10];
  const filtered = allTiers.filter((tier, index) => {
    if (index === 0 || index === 1) return true;
    const prevTier = allTiers[index - 1];
    return total > prevTier;
  });
  return filtered.length > 0 ? filtered : [5, 10];
};

export const formatLastActive = (dateString, isOnline) => {
  if (isOnline) {
    return {
      text: "Active now",
      shortText: "Now",
      isOnline: true,
      isNever: false,
    };
  }

  if (!dateString) {
    return {
      text: "Never",
      shortText: "Never",
      isOnline: false,
      isNever: true,
    };
  }

  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      return { text: "Never", shortText: "Never", isOnline: false, isNever: true };
    }

    const diffMs = Date.now() - d.getTime();
    if (diffMs < 0) {
      return { text: "Just now", shortText: "Now", isOnline: false, isNever: false };
    }

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return { text: "Just now", shortText: "Now", isOnline: false, isNever: false };
    }
    if (diffMins < 60) {
      return { text: `${diffMins}m ago`, shortText: `${diffMins}m`, isOnline: false, isNever: false };
    }
    if (diffHours < 24) {
      return { text: `${diffHours}h ago`, shortText: `${diffHours}h`, isOnline: false, isNever: false };
    }
    if (diffDays === 1) {
      return { text: "Yesterday", shortText: "1d", isOnline: false, isNever: false };
    }
    if (diffDays < 7) {
      return { text: `${diffDays}d ago`, shortText: `${diffDays}d`, isOnline: false, isNever: false };
    }
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return { text: `${weeks}w ago`, shortText: `${weeks}w`, isOnline: false, isNever: false };
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return { text: `${months}mo ago`, shortText: `${months}mo`, isOnline: false, isNever: false };
    }
    const years = Math.floor(diffDays / 365);
    return { text: `${years}y ago`, shortText: `${years}y`, isOnline: false, isNever: false };
  } catch {
    return { text: "Never", shortText: "Never", isOnline: false, isNever: true };
  }
};

export const formatFullDateTime = (dateString) => {
  if (!dateString) return "Never logged in";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Never logged in";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "Never logged in";
  }
};

