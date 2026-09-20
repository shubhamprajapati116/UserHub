/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
import "./adminpanel.css";
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppLayout from "../AppLayout/AppLayout";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";
import UserActionMenu from "../UserActionMenu/UserActionMenu";

// Helper to extract initials
const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

// Helper for initials color gradient class
const getInitialsColorClass = (name) => {
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

// Format DOB as DD/MM/YYYY (compact and timezone-safe)
const formatDob = (dobString) => {
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

// Helper to detect if photo is the default silhouette placeholder
const isPlaceholderPhoto = (photo) => {
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

// eslint-disable-next-line react-refresh/only-export-components
function CustomDropdown({ options, value, onChange, dropUp = false, prefix = "", icon = null }) {
  const [open, setOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption =
    options.find((o) => String(o.value) === String(value)) || options[0];

  const isFiltered = Boolean(value && value !== "");

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceRight = window.innerWidth - rect.left;
      if (spaceRight < 185 || rect.right > window.innerWidth - 20) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    }
  }, [open]);

  const fullLabel = `${prefix ? prefix + " " : ""}${selectedOption ? selectedOption.label : ""}`.trim();

  return (
    <div
      className={`custom-dropdown-container ${dropUp ? "drop-up" : ""} ${isFiltered ? "is-filtered" : ""}`}
      ref={dropdownRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={`custom-dropdown-btn ${open ? "open" : ""} ${isFiltered ? "active-filter" : ""}`}
        title={fullLabel}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <span className="dropdown-label-wrap">
          {icon && <span className="dropdown-prefix-icon">{icon}</span>}
          {prefix && <span className="dropdown-prefix">{prefix}</span>}
          <span className="dropdown-value-text">{selectedOption ? selectedOption.label : ""}</span>
        </span>
        <svg
          className={`dropdown-chevron ${open ? "rotate" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className={`custom-dropdown-menu ${dropUp ? "drop-up-menu" : ""} ${alignRight ? "align-right" : ""}`}>
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`custom-dropdown-item ${String(opt.value) === String(value) ? "active" : ""} ${opt.disabled ? "item-disabled" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                if (opt.disabled) return;
                onChange(opt.value);
                setOpen(false);
              }}
              title={opt.label}
            >
              <span className="dropdown-item-text">{opt.label}</span>
              {!opt.disabled && String(opt.value) === String(value) && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="dropdown-item-check"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper to calculate available page size tiers dynamically based on total users count
const getAvailableLimitOptions = (total) => {
  const allTiers = [5, 10, 20, 50];
  return allTiers.filter((tier, index) => {
    if (index === 0) return true; // 5 is always available
    const prevTier = allTiers[index - 1];
    return total > prevTier;
  });
};

// eslint-disable-next-line react-refresh/only-export-components
function AdminPanel() {
  const { userStore } = useStore();
  const [search, setsearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [timeframeFilter, setTimeframeFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [singleAdminModal, setSingleAdminModal] = useState({
    open: false,
    user: null,
  });
  const [bulkRoleModal, setBulkRoleModal] = useState({
    open: false,
    targetRole: "",
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeFilters = useMemo(() => {
    const list = [];
    if (roleFilter) {
      list.push({
        id: "role",
        label: "Role",
        displayValue: roleFilter === "admin" ? "Admin" : "User",
        clear: () => {
          setRoleFilter("");
          setpage(1);
        },
      });
    }
    if (statusFilter) {
      list.push({
        id: "status",
        label: "Status",
        displayValue:
          statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1),
        clear: () => {
          setStatusFilter("");
          setpage(1);
        },
      });
    }
    if (verificationFilter) {
      list.push({
        id: "verification",
        label: "Email",
        displayValue:
          verificationFilter === "verified" ? "Verified" : "Unverified",
        clear: () => {
          setVerificationFilter("");
          setpage(1);
        },
      });
    }
    if (genderFilter) {
      list.push({
        id: "gender",
        label: "Gender",
        displayValue:
          genderFilter.charAt(0).toUpperCase() + genderFilter.slice(1),
        clear: () => {
          setGenderFilter("");
          setpage(1);
        },
      });
    }
    if (timeframeFilter) {
      const timeLabels = {
        "30d": "Last 30 Days",
        "7d": "Last 7 Days",
        today: "Today",
      };
      list.push({
        id: "timeframe",
        label: "Joined",
        displayValue: timeLabels[timeframeFilter] || timeframeFilter,
        clear: () => {
          setTimeframeFilter("");
          setpage(1);
        },
      });
    }
    return list;
  }, [roleFilter, statusFilter, verificationFilter, genderFilter, timeframeFilter]);

  const activeFilterCount = activeFilters.length;

  const handleClearAllFilters = () => {
    setRoleFilter("");
    setStatusFilter("");
    setVerificationFilter("");
    setGenderFilter("");
    setTimeframeFilter("");
    setpage(1);
  };
  const totalUsers = userStore.systemTotalUsers || userStore.totalUsers;
  const totalInList = userStore.totalInList ?? users.length;
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);
  const [page, setpage] = useState(1);
  const [limit, setLimit] = useState(5);
  const role = userStore.currentUser?.role;
  const navigate = useNavigate();
  const totalPages = Math.max(1, Math.ceil(totalInList / limit));
  const users = userStore.users;
  const targetedDeleteUser =
    deleteTargetUser || users.find((u) => u._id === deleteId);
  const loading = userStore.loading.fetchUsers && users.length === 0;
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [menuState, setMenuState] = useState({
    open: false,
    user: null,
    reference: null,
  });

  const [showTableLoader, setShowTableLoader] = useState(false);
  const isFetchingUsers = userStore.loading.fetchUsers;

  // Debounced Table Loader: 150ms threshold
  // On Fast Networks (<150ms): API returns before 150ms -> 0% flicker!
  // On 3G Networks (>150ms): Translucent table overlay cleanly appears.
  useEffect(() => {
    let timer;
    if (isFetchingUsers) {
      timer = setTimeout(() => {
        setShowTableLoader(true);
      }, 150);
    } else {
      setShowTableLoader(false);
    }
    return () => clearTimeout(timer);
  }, [isFetchingUsers]);

  const availableLimitOptions = getAvailableLimitOptions(totalInList);

  // Auto-adjust limit if total count changes and current limit is no longer available
  useEffect(() => {
    const available = getAvailableLimitOptions(totalInList);
    if (!available.includes(limit)) {
      const fallback = available[available.length - 1] || 5;
      setLimit(fallback);
      setpage(1);
    }
  }, [totalInList, limit]);

  const isAnyModalOpen =
    showModal ||
    showBulkDeleteModal ||
    showImageModal ||
    singleAdminModal.open ||
    bulkRoleModal.open ||
    isFilterDrawerOpen;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFilterDrawerOpen) {
        setIsFilterDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFilterDrawerOpen]);

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAnyModalOpen]);

  const currentUserId = userStore.currentUser?._id || userStore.currentUser?.id;
  const selectableUsers = users.filter((u) => u._id !== currentUserId);
  const selectedUsers = users.filter((u) => selectedUserIds.includes(u._id));
  const showMakeAdminBtn =
    selectedUsers.length > 0 && selectedUsers.every((u) => u.role === "user");
  const showMakeUserBtn =
    selectedUsers.length > 0 && selectedUsers.every((u) => u.role === "admin");
  const isAllSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((u) => selectedUserIds.includes(u._id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectableUsers.map((u) => u._id));
    }
  };

  const toggleSelectUser = (id, e) => {
    if (e) e.stopPropagation();
    if (id === currentUserId) return;
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const [modalActionLoading, setModalActionLoading] = useState(false);

  const handleBulkRoleChange = async (targetRole) => {
    if (!targetRole || selectedUserIds.length === 0 || modalActionLoading)
      return;
    setModalActionLoading(true);
    try {
      const res = await userStore.bulkUpdateUserRole(
        selectedUserIds,
        targetRole,
      );
      toast.success(res.message);
      setSelectedUserIds([]);
      await fetchusers();
      setBulkRoleModal({ open: false, targetRole: "" });
    } catch (error) {
      toast.error(error?.message || "Failed to update roles");
    } finally {
      setModalActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0 || modalActionLoading) return;
    setModalActionLoading(true);
    try {
      const res = await userStore.bulkDeleteUsers(selectedUserIds);
      toast.success(res.message);
      setSelectedUserIds([]);
      await fetchusers();
      setShowBulkDeleteModal(false);
    } catch (error) {
      toast.error(error?.message || "Failed to delete selected users");
    } finally {
      setModalActionLoading(false);
    }
  };

  const fetchusers = async () => {
    try {
      await userStore.fetchUsers({
        page,
        limit,
        search: debouncedSearch.trim(),
        role: roleFilter,
        status: statusFilter,
        verification: verificationFilter,
        gender: genderFilter,
        timeframe: timeframeFilter,
        sortBy,
        sortOrder,
      });
    } catch (error) {
      if (!error?.isNetworkError) {
        toast.error(error?.message || "Failed to fetch users");
      }
    }
  };

  const handleManualRefresh = async () => {
    if (isRefreshing || userStore.loading.fetchUsers) return;
    setIsRefreshing(true);
    try {
      await fetchusers();
      if (userStore.fetchStats) {
        userStore.fetchStats().catch(() => {});
      }
      toast.info("User list refreshed", {
        autoClose: 1800,
        toastId: "admin-refresh-toast",
      });
    } catch (err) {
      toast.error(err?.message || "Failed to refresh users");
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setpage(1);
  };

  const makeUserAdmin = async (id) => {
    try {
      const data = await userStore.makeAdmin(id);

      toast.success(data.message);

      await fetchusers();
      if (page > 1 && users.length === 1) {
        setpage(page - 1);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to make user admin");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    setSelectedUserIds([]);
    fetchusers();
  }, [
    debouncedSearch,
    page,
    limit,
    roleFilter,
    statusFilter,
    verificationFilter,
    genderFilter,
    timeframeFilter,
    sortBy,
    sortOrder,
  ]);

  const handledelete = async () => {
    if (!deleteId || modalActionLoading) return;
    setModalActionLoading(true);
    try {
      const data = await userStore.deleteUser(deleteId);
      toast.success(data.message);
      await fetchusers();
      setShowModal(false);
      setDeleteId(null);
      setDeleteTargetUser(null);
      setMenuState({
        open: false,
        user: null,
        reference: null,
      });
    } catch (error) {
      toast.error(error?.message || "Failed to delete user");
    } finally {
      setModalActionLoading(false);
    }
  };

  const handleSingleMakeAdminSubmit = async () => {
    const targetId = singleAdminModal.user?._id;
    if (!targetId || modalActionLoading) return;
    setModalActionLoading(true);
    try {
      const data = await userStore.makeAdmin(targetId);
      toast.success(data.message);
      await fetchusers();
      setSingleAdminModal({ open: false, user: null });
    } catch (error) {
      toast.error(error?.message || "Failed to promote user to admin");
    } finally {
      setModalActionLoading(false);
    }
  };
  return (
    <AppLayout
      title="User Management"
      subtitle={`Admin Panel • User Directory & Management (${totalUsers} registered users)`}
    >
      <div className="page-container-users linear-theme">
        <div className="users-container linear-wrapper">
          {/* ── Section Header: User Management ── */}
          <div className="dashboard-section-header linear-page-header">
            <div className="section-header-left">
              <div className="section-header-icon-box">
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
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="section-header-content">
                <h2 className="section-header-title">User Management</h2>
                <p className="section-header-sub">
                  Directory of registered accounts, system roles, and account permissions
                </p>
              </div>
            </div>

            <div className="section-header-right">
              <span className="section-header-badge">
                <span className="section-badge-dot"></span>
                <span className="font-mono">
                  {totalUsers} {totalUsers === 1 ? "User" : "Users"}
                </span>
              </span>
            </div>
          </div>

          {/* ── Integrated Modern Linear Command Bar ── */}
          <div className="linear-command-bar">
            {/* Top Row: Search Input & Primary Actions */}
            <div className="command-bar-primary-row">
              <div className="command-search-wrap">
                <svg
                  className="command-search-icon"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="search"
                  value={search}
                  placeholder="Search by name, email, or phone number..."
                  className="command-search-input"
                  onChange={(e) => {
                    setsearch(e.target.value);
                    setpage(1);
                  }}
                />
                {search && (
                  <button
                    type="button"
                    className="command-search-clear"
                    onClick={() => {
                      setsearch("");
                      setDebouncedSearch("");
                      setpage(1);
                    }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="command-actions-group">
                <button
                  type="button"
                  className={`command-reload-btn ${isRefreshing || userStore.loading.fetchUsers ? "is-refreshing" : ""}`}
                  onClick={handleManualRefresh}
                  title="Refresh user list"
                  aria-label="Refresh user list"
                  disabled={userStore.loading.fetchUsers || isRefreshing}
                >
                  <svg
                    className={`reload-icon ${isRefreshing || userStore.loading.fetchUsers ? "spinning" : ""}`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 4v6h-6" />
                    <path d="M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  <span className="reload-btn-label">Refresh</span>
                </button>

                <button
                  type="button"
                  className={`command-filter-trigger-btn ${activeFilterCount > 0 ? "has-active" : ""}`}
                  onClick={() => setIsFilterDrawerOpen(true)}
                  title="Filter and refine users"
                >
                  <svg
                    className="filter-trigger-icon"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                  <span className="filter-trigger-label">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="filter-count-badge">{activeFilterCount}</span>
                  )}
                </button>

                {role === "admin" && (
                  <button
                    className="command-add-btn"
                    onClick={() => navigate("/admin/users/new")}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add User</span>
                  </button>
                )}
              </div>
            </div>

            {/* Active Applied Filter Chips Strip (Shows ONLY when filters are active) */}
            {activeFilterCount > 0 && (
              <div className="command-active-chips-strip">
                <span className="active-chips-label">Applied:</span>
                <div className="active-chips-scroll">
                  {activeFilters.map((f) => (
                    <span key={f.id} className="active-filter-chip">
                      <span className="chip-key">{f.label}:</span>
                      <strong className="chip-val">{f.displayValue}</strong>
                      <button
                        type="button"
                        className="chip-remove-btn"
                        onClick={f.clear}
                        title={`Remove ${f.label} filter`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  className="command-clear-all-btn"
                  onClick={handleClearAllFilters}
                  title="Clear all active filters"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* ── Floating Bulk Action Toolbar ── */}
          {selectedUserIds.length > 0 && (
            <div className="ul-bulk-toolbar">
              <div className="ul-bulk-info">
                <span className="ul-bulk-badge">{selectedUserIds.length}</span>
                <span className="ul-bulk-text">
                  {selectedUserIds.length === 1
                    ? "user selected"
                    : "users selected"}
                </span>
              </div>
              <div className="ul-bulk-actions">
                {showMakeAdminBtn && (
                  <button
                    className="btn-bulk-action make-admin"
                    onClick={() =>
                      setBulkRoleModal({ open: true, targetRole: "admin" })
                    }
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" />
                    </svg>
                    <span>Make Admin</span>
                  </button>
                )}
                {showMakeUserBtn && (
                  <button
                    className="btn-bulk-action make-user"
                    onClick={() =>
                      setBulkRoleModal({ open: true, targetRole: "user" })
                    }
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Make User</span>
                  </button>
                )}
                <button
                  className="btn-bulk-action delete"
                  onClick={() => setShowBulkDeleteModal(true)}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Delete Selected</span>
                </button>
                <button
                  className="btn-bulk-action clear"
                  onClick={() => setSelectedUserIds([])}
                  title="Clear Selection"
                >
                  <span>✕ Clear</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Linear Precision Table Card ── */}
          <div className="linear-table-card">
            {!loading && users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <p>No users found</p>
                <span>Try a different search term or reset your filters</span>
              </div>
            ) : (
              <div className="table-wrap">
                {showTableLoader && (
                  <div className="table-loading-overlay">
                    <div className="table-spinner"></div>
                    <span>Updating user list...</span>
                  </div>
                )}
                <table className="linear-table">
                  <thead>
                    <tr>
                      <th className="th-checkbox">
                        <input
                          type="checkbox"
                          className="ul-checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                          aria-label="Select all users"
                        />
                      </th>
                      <th className="th-profile">User</th>
                      <th className="th-role">Role</th>
                      <th className="th-gender">Gender</th>
                      <th className="th-status">Status</th>
                      <th
                        className="th-dob th-sortable"
                        onClick={() => handleSort("dob")}
                        title="Sort by Date of Birth"
                      >
                        <div className="dob-header-cell">
                          <span className="dob-full-text">Date of Birth</span>
                          <span className="dob-short-text">DOB</span>
                          <span
                            className={`dob-arrow-wrap ${
                              sortBy === "dob" ? "active" : ""
                            }`}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              {sortBy === "dob" ? (
                                sortOrder === "asc" ? (
                                  <path d="M12 19V5M5 12l7-7 7 7" />
                                ) : (
                                  <path d="M12 5v14M5 12l7 7 7-7" />
                                )
                              ) : (
                                <path d="M7 9l5-5 5 5M7 15l5 5 5-5" />
                              )}
                            </svg>
                          </span>
                        </div>
                      </th>
                      {role === "admin" && (
                        <th className="th-actions">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 5 }).map((_, index) => (
                          <tr key={index}>
                            <td className="td-checkbox">
                              <div className="skeleton skeleton-checkbox"></div>
                            </td>
                            <td className="td-profile">
                              <div className="user-profile-cell">
                                <div className="skeleton skeleton-user-avatar"></div>
                                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                                  <div className="skeleton skeleton-user-name"></div>
                                  <div className="skeleton skeleton-user-email"></div>
                                </div>
                              </div>
                            </td>
                            <td className="td-role">
                              <div className="skeleton skeleton-user-role"></div>
                            </td>
                            <td className="td-gender">
                              <div className="skeleton skeleton-user-small"></div>
                            </td>
                            <td className="td-status">
                              <div className="skeleton skeleton-user-small"></div>
                            </td>
                            <td className="td-dob">
                              <div className="skeleton skeleton-user-date"></div>
                            </td>
                            {role === "admin" && (
                              <td className="td-actions">
                                <div className="skeleton skeleton-user-action"></div>
                              </td>
                            )}
                          </tr>
                        ))
                      : users.map((user) => {
                          const isSelf = user._id === currentUserId;
                          return (
                            <tr
                              key={user._id}
                              className={`linear-row ${
                                selectedUserIds.includes(user._id)
                                  ? "row-selected"
                                  : ""
                              } ${user.role === "admin" ? "row-admin" : ""} ${
                                user.status === "suspended"
                                  ? "row-suspended"
                                  : user.status === "banned"
                                  ? "row-banned"
                                  : ""
                              } ${isSelf ? "row-self" : ""}`}
                            >
                              <td className="td-checkbox">
                                <input
                                  type="checkbox"
                                  className="ul-checkbox"
                                  checked={selectedUserIds.includes(user._id)}
                                  disabled={isSelf}
                                  title={
                                    isSelf
                                      ? "You cannot select your own account for batch actions"
                                      : "Select user"
                                  }
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    toggleSelectUser(user._id, e);
                                  }}
                                />
                              </td>
                              <td className="td-profile">
                                <div className="user-profile-cell">
                                  <div className="linear-avatar-wrap">
                                    {(user.profilephoto || user.profileImage) &&
                                    !isPlaceholderPhoto(user.profilephoto || user.profileImage) ? (
                                      <img
                                        src={
                                          user.profileImage ||
                                          `${import.meta.env.VITE_API_URL}/uploads/${user.profilephoto}`
                                        }
                                        alt={user.name}
                                        className={`profile-avatar-img ${
                                          user.status === "banned"
                                            ? "avatar-ring-banned"
                                            : user.status === "suspended"
                                            ? "avatar-ring-suspended"
                                            : user.role === "admin"
                                            ? "avatar-ring-admin"
                                            : "avatar-ring-user"
                                        }`}
                                        onError={(e) => {
                                          e.currentTarget.style.display = "none";
                                          const fb = e.currentTarget.nextElementSibling;
                                          if (fb) fb.style.display = "inline-flex";
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const photo =
                                            user.profileImage ||
                                            user.profilephoto;
                                          if (!photo) return;
                                          setSelectedImage(
                                            user.profileImage ||
                                              `${import.meta.env.VITE_API_URL}/uploads/${user.profilephoto}`,
                                          );
                                          setShowImageModal(true);
                                        }}
                                      />
                                    ) : null}
                                    <div
                                      className={`profile-initials-avatar ${getInitialsColorClass(user.name)}`}
                                      style={{
                                        display:
                                          (user.profilephoto || user.profileImage) &&
                                          !isPlaceholderPhoto(user.profilephoto || user.profileImage)
                                            ? "none"
                                            : "inline-flex",
                                      }}
                                      title={user.name}
                                      onClick={(e) => {
                                        const photo =
                                          user.profileImage ||
                                          user.profilephoto;
                                        if (photo && !isPlaceholderPhoto(photo)) {
                                          e.stopPropagation();
                                          setSelectedImage(
                                            user.profileImage ||
                                              `${import.meta.env.VITE_API_URL}/uploads/${user.profilephoto}`,
                                          );
                                          setShowImageModal(true);
                                        }
                                      }}
                                    >
                                      {getInitials(user.name)}
                                    </div>
                                  </div>
                                  <div className="profile-meta-wrap">
                                    <div className="profile-name-row">
                                      <span className="profile-name">
                                        {user.name}
                                      </span>
                                      {isSelf && (
                                        <span className="linear-you-badge">
                                          You
                                        </span>
                                      )}
                                    </div>
                                    <div className="profile-email-wrap">
                                      <span className="profile-email font-mono">
                                        {user.email}
                                      </span>
                                      {user.isVerified ? (
                                        <span className="email-status-pill verified" title="Email Verified">
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                          </svg>
                                          <span>Verified</span>
                                        </span>
                                      ) : (
                                        <span
                                          className="email-status-pill unverified"
                                          title="Email verification pending. User can verify via email link or request new link on login."
                                        >
                                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                          </svg>
                                          <span>Unverified</span>
                                        </span>
                                      )}
                                    </div>
                                    {user.pendingEmail && (
                                      <div
                                        className="profile-pending-email-badge"
                                        title={`Pending email change to ${user.pendingEmail}. Verification link sent.`}
                                      >
                                        <svg
                                          width="10"
                                          height="10"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        >
                                          <circle cx="12" cy="12" r="10" />
                                          <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        <span>Pending: {user.pendingEmail}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>

                            <td className="td-role">
                              {user.role === "admin" ? (
                                <span className="linear-badge-admin">
                                  <svg className="badge-svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z" />
                                  </svg>
                                  <span>Admin</span>
                                </span>
                              ) : (
                                <span className="linear-badge-user">
                                  <svg className="badge-svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                  </svg>
                                  <span>User</span>
                                </span>
                              )}
                            </td>

                            <td className="td-gender">
                              {user.gender ? (
                                <span
                                  className={`linear-badge-gender ${user.gender.toLowerCase()}`}
                                >
                                  {user.gender.toLowerCase() === "male" ? (
                                    <svg className="gender-svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="10" cy="14" r="5" />
                                      <line x1="19" y1="5" x2="13.6" y2="10.4" />
                                      <polyline points="15 5 19 5 19 9" />
                                    </svg>
                                  ) : user.gender.toLowerCase() === "female" ? (
                                    <svg className="gender-svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="9" r="5" />
                                      <line x1="12" y1="14" x2="12" y2="21" />
                                      <line x1="9" y1="18" x2="15" y2="18" />
                                    </svg>
                                  ) : (
                                    <svg className="gender-svg-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="5" />
                                      <line x1="12" y1="2" x2="12" y2="7" />
                                      <line x1="12" y1="17" x2="12" y2="22" />
                                    </svg>
                                  )}
                                  <span>
                                    {user.gender.charAt(0).toUpperCase() +
                                      user.gender.slice(1).toLowerCase()}
                                  </span>
                                </span>
                              ) : (
                                <span className="linear-badge-gender none">—</span>
                              )}
                            </td>

                            <td className="td-status">
                              {user.status === "banned" ? (
                                <span className="linear-status-badge banned" title={user.statusReason ? `Banned: ${user.statusReason}` : "Account is permanently banned"}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                  </svg>
                                  <span>Banned</span>
                                </span>
                              ) : user.status === "suspended" ? (
                                <span className="linear-status-badge suspended" title={user.statusReason ? `Suspended: ${user.statusReason}` : "Account is temporarily suspended"}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="10" y1="15" x2="10" y2="9" />
                                    <line x1="14" y1="15" x2="14" y2="9" />
                                  </svg>
                                  <span>Suspended</span>
                                </span>
                              ) : (
                                <span className="linear-status-badge active" title="Account is active and operational">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 6L9 17l-5-5" />
                                  </svg>
                                  <span>Active</span>
                                </span>
                              )}
                            </td>

                            <td className="td-dob font-mono">
                              <div className="dob-pill">
                                <svg className="dob-calendar-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                  <line x1="16" y1="2" x2="16" y2="6" />
                                  <line x1="8" y1="2" x2="8" y2="6" />
                                  <line x1="3" y1="10" x2="21" y2="10" />
                                </svg>
                                <span>{formatDob(user.dob)}</span>
                              </div>
                            </td>

                            {role === "admin" && (
                              <td className="td-actions">
                                <button
                                  className={`linear-action-btn ${
                                    menuState.open &&
                                    menuState.user?._id === user._id
                                      ? "active"
                                      : ""
                                  }`}
                                  title="User actions"
                                  aria-label="User actions"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (
                                      menuState.open &&
                                      menuState.user?._id === user._id
                                    ) {
                                      setMenuState({
                                        open: false,
                                        user: null,
                                        reference: null,
                                      });
                                      return;
                                    }
                                    setMenuState({
                                      open: true,
                                      user,
                                      reference: e.currentTarget,
                                    });
                                  }}
                                >
                                  <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                  >
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="19" cy="12" r="2" />
                                    <circle cx="5" cy="12" r="2" />
                                  </svg>
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Precision Linear Footer ── */}
            {loading ? (
              <div className="linear-pagination">
                <div className="skeleton skeleton-page-btn"></div>
                <div className="skeleton skeleton-page-info"></div>
                <div className="skeleton skeleton-page-btn"></div>
              </div>
            ) : (
              totalInList > 0 && (
                <div className="linear-pagination">
                  <div className="linear-pagination-info">
                    <span className="info-prefix">Showing </span>
                    <strong className="font-mono">
                      {users.length > 0 ? (page - 1) * limit + 1 : 0}-
                      {Math.min(page * limit, totalInList)}
                    </strong>
                    <span className="info-divider"> of </span>
                    <strong className="font-mono">{totalInList}</strong>
                    <span className="info-suffix"> users</span>
                  </div>

                  <div className="linear-pagination-right">
                    <div className="linear-rows-selector">
                      <span className="rows-label-full">Rows per page:</span>
                      <span className="rows-label-short">Rows:</span>
                      <CustomDropdown
                        dropUp={true}
                        options={availableLimitOptions.map((v) => ({
                          value: v,
                          label: String(v),
                        }))}
                        value={limit}
                        onChange={(newLimit) => {
                          setLimit(Number(newLimit));
                          setpage(1);
                        }}
                      />
                    </div>

                    <div className="linear-page-nav">
                      <button
                        className="linear-page-btn prev-btn"
                        disabled={page <= 1}
                        onClick={() => setpage((p) => Math.max(1, p - 1))}
                        title="Previous Page"
                        aria-label="Previous Page"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                        <span className="linear-btn-text">Prev</span>
                      </button>
                      <span className="linear-page-text font-mono">
                        <span className="page-label-full">Page </span>
                        {page}
                        <span className="page-divider-full"> of </span>
                        <span className="page-divider-short">/</span>
                        {totalPages}
                      </span>
                      <button
                        className="linear-page-btn next-btn"
                        disabled={page >= totalPages}
                        onClick={() =>
                          setpage((p) => Math.min(totalPages, p + 1))
                        }
                        title="Next Page"
                        aria-label="Next Page"
                      >
                        <span className="linear-btn-text">Next</span>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
      {menuState.open && (
        <UserActionMenu
          reference={menuState.reference}
          user={menuState.user}
          navigate={navigate}
          makeUserAdmin={makeUserAdmin}
          openMakeAdminModal={(targetUser) =>
            setSingleAdminModal({ open: true, user: targetUser })
          }
          openDeleteModal={(targetUser) => {
            setDeleteId(targetUser._id);
            setDeleteTargetUser(targetUser);
            setShowModal(true);
          }}
          setDeleteId={setDeleteId}
          setShowModal={setShowModal}
          userStore={userStore}
          onClose={() =>
            setMenuState({
              open: false,
              user: null,
              reference: null,
            })
          }
        />
      )}
      {/* ── Single User Make Admin Confirmation Modal ── */}
      {singleAdminModal.open && (
        <div
          className="admin-modal-overlay"
          onClick={() => {
            if (!modalActionLoading) setSingleAdminModal({ open: false, user: null });
          }}
        >
          <div
            className="admin-dialog-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <div className="admin-modal-icon-badge promote">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <div className="admin-modal-title-group">
                <h3>Grant Administrator Access</h3>
                <p>You are about to promote this user to a system administrator.</p>
              </div>
            </div>

            {/* User Details Preview Card */}
            {singleAdminModal.user && (
              <div className="admin-modal-user-card">
                <div className="admin-modal-avatar">
                  {singleAdminModal.user.profilePicture ? (
                    <img
                      src={singleAdminModal.user.profilePicture}
                      alt={singleAdminModal.user.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                  <div className="admin-modal-avatar-fallback">
                    {getInitials(singleAdminModal.user.name)}
                  </div>
                </div>
                <div className="admin-modal-user-info">
                  <div className="admin-modal-user-name">
                    {singleAdminModal.user.name}
                  </div>
                  <div className="admin-modal-user-email">
                    {singleAdminModal.user.email}
                  </div>
                </div>
                <div className="admin-modal-role-pill">
                  <span className="role-chip current">User</span>
                  <span className="role-arrow">→</span>
                  <span className="role-chip target-admin">Admin</span>
                </div>
              </div>
            )}

            {/* Elevated Permissions Advisory */}
            <div className="admin-modal-callout info">
              <div className="callout-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div className="callout-content">
                <strong>Administrative Permissions:</strong> This user will gain full privileges to manage accounts, edit user roles, revoke active sessions, and configure platform settings.
              </div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-btn cancel"
                disabled={modalActionLoading}
                onClick={() => setSingleAdminModal({ open: false, user: null })}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-modal-btn confirm-primary"
                disabled={modalActionLoading}
                onClick={handleSingleMakeAdminSubmit}
              >
                {modalActionLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Granting Admin Access...</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                    <span>Grant Admin Access</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Role Change Confirmation Modal ── */}
      {bulkRoleModal.open && (
        <div
          className="admin-modal-overlay"
          onClick={() => {
            if (!modalActionLoading) setBulkRoleModal({ open: false, targetRole: "" });
          }}
        >
          <div
            className="admin-dialog-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <div className={`admin-modal-icon-badge ${bulkRoleModal.targetRole === "admin" ? "promote" : "warning"}`}>
                {bulkRoleModal.targetRole === "admin" ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="8.5" cy="7" r="4" />
                    <line x1="18" y1="8" x2="23" y2="13" />
                    <line x1="23" y1="8" x2="18" y2="13" />
                  </svg>
                )}
              </div>
              <div className="admin-modal-title-group">
                <h3>
                  {bulkRoleModal.targetRole === "admin"
                    ? `Grant Admin Access to ${selectedUserIds.length} User${selectedUserIds.length === 1 ? "" : "s"}?`
                    : `Revoke Admin Access for ${selectedUserIds.length} User${selectedUserIds.length === 1 ? "" : "s"}?`}
                </h3>
                <p>
                  {bulkRoleModal.targetRole === "admin"
                    ? `You are about to promote ${selectedUserIds.length} selected account${selectedUserIds.length === 1 ? "" : "s"} to system administrators.`
                    : `You are about to change ${selectedUserIds.length} selected account${selectedUserIds.length === 1 ? "" : "s"} back to regular user role.`}
                </p>
              </div>
            </div>

            <div className="admin-modal-batch-tag">
              <span className="batch-tag-count">{selectedUserIds.length}</span>
              <span>Account{selectedUserIds.length === 1 ? "" : "s"} Selected for Role Update</span>
            </div>

            <div className={`admin-modal-callout ${bulkRoleModal.targetRole === "admin" ? "info" : "warning"}`}>
              <div className="callout-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div className="callout-content">
                {bulkRoleModal.targetRole === "admin"
                  ? "All selected users will gain full permissions to view and modify platform data, promote users, and manage system operations."
                  : "These users will immediately lose administrative permissions and access to the Admin Panel. Their existing sessions will remain active as regular users."}
              </div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-btn cancel"
                disabled={modalActionLoading}
                onClick={() => setBulkRoleModal({ open: false, targetRole: "" })}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`admin-modal-btn ${bulkRoleModal.targetRole === "admin" ? "confirm-primary" : "confirm-warning"}`}
                disabled={modalActionLoading}
                onClick={() => handleBulkRoleChange(bulkRoleModal.targetRole)}
              >
                {modalActionLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Updating Roles...</span>
                  </>
                ) : bulkRoleModal.targetRole === "admin" ? (
                  "Grant Admin Access"
                ) : (
                  "Change to User Role"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Single User Delete Confirmation Modal ── */}
      {showModal && (
        <div
          className="admin-modal-overlay"
          onClick={() => {
            if (!modalActionLoading) {
              setShowModal(false);
              setDeleteId(null);
              setDeleteTargetUser(null);
            }
          }}
        >
          <div
            className="admin-dialog-modal danger"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <div className="admin-modal-icon-badge delete">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <div className="admin-modal-title-group">
                <h3>Delete User Account</h3>
                <p>This action is irreversible and will permanently purge this account.</p>
              </div>
            </div>

            {/* Targeted User Preview Card */}
            {targetedDeleteUser && (
              <div className="admin-modal-user-card danger">
                <div className="admin-modal-avatar">
                  {targetedDeleteUser.profilePicture ? (
                    <img
                      src={targetedDeleteUser.profilePicture}
                      alt={targetedDeleteUser.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                  <div className="admin-modal-avatar-fallback danger">
                    {getInitials(targetedDeleteUser.name)}
                  </div>
                </div>
                <div className="admin-modal-user-info">
                  <div className="admin-modal-user-name">
                    {targetedDeleteUser.name}
                  </div>
                  <div className="admin-modal-user-email">
                    {targetedDeleteUser.email}
                  </div>
                </div>
                <span className={`role-chip ${targetedDeleteUser.role === "admin" ? "target-admin" : "current"}`}>
                  {targetedDeleteUser.role === "admin" ? "Admin" : "User"}
                </span>
              </div>
            )}

            {/* Permanent Destruction Warning */}
            <div className="admin-modal-callout danger">
              <div className="callout-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div className="callout-content">
                <strong>Permanent Removal:</strong> All profile records, active devices, sessions, and security credentials for this user will be completely erased. This cannot be undone.
              </div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-btn cancel"
                disabled={modalActionLoading}
                onClick={() => {
                  setShowModal(false);
                  setDeleteId(null);
                  setDeleteTargetUser(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-modal-btn confirm-danger"
                onClick={handledelete}
                disabled={modalActionLoading}
              >
                {modalActionLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Deleting User...</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Delete User Account</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk Delete Confirmation Modal ── */}
      {showBulkDeleteModal && (
        <div
          className="admin-modal-overlay"
          onClick={() => {
            if (!modalActionLoading) setShowBulkDeleteModal(false);
          }}
        >
          <div
            className="admin-dialog-modal danger"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <div className="admin-modal-icon-badge delete">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
              </div>
              <div className="admin-modal-title-group">
                <h3>Delete {selectedUserIds.length} Selected Account{selectedUserIds.length === 1 ? "" : "s"}?</h3>
                <p>This batch action is irreversible and will permanently delete all selected users.</p>
              </div>
            </div>

            <div className="admin-modal-batch-tag danger">
              <span className="batch-tag-count">{selectedUserIds.length}</span>
              <span>Accounts Queued for Permanent Deletion</span>
            </div>

            <div className="admin-modal-callout danger">
              <div className="callout-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <div className="callout-content">
                <strong>Permanent Removal:</strong> All selected accounts, login credentials, and stored personal data will be completely erased from the database immediately.
              </div>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-modal-btn cancel"
                disabled={modalActionLoading}
                onClick={() => setShowBulkDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-modal-btn confirm-danger"
                onClick={handleBulkDelete}
                disabled={modalActionLoading}
              >
                {modalActionLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Deleting {selectedUserIds.length} Accounts...</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Delete {selectedUserIds.length} Selected Accounts</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Slide-Over Filter Drawer / Mobile Bottom Sheet ── */}
      {isFilterDrawerOpen && (
        <div
          className="filter-drawer-backdrop"
          onClick={() => setIsFilterDrawerOpen(false)}
        >
          <div
            className="filter-drawer-panel"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Filter users directory"
          >
            {/* Drawer Header */}
            <div className="filter-drawer-header">
              <div className="filter-drawer-title-wrap">
                <div className="filter-drawer-icon-wrap">
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
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                  </svg>
                </div>
                <div>
                  <h3 className="filter-drawer-title">Filter Directory</h3>
                  <p className="filter-drawer-subtitle">
                    {activeFilterCount > 0
                      ? `${activeFilterCount} active filter${activeFilterCount === 1 ? "" : "s"}`
                      : "Narrow down user results"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="filter-drawer-close-btn"
                onClick={() => setIsFilterDrawerOpen(false)}
                title="Close filter panel (Esc)"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Drawer Scrollable Body */}
            <div className="filter-drawer-body">
              {/* Section 1: Role */}
              <div className="drawer-filter-section">
                <div className="drawer-filter-label">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span>User Role</span>
                </div>
                <div className="drawer-options-grid">
                  {[
                    { label: "All Roles", value: "" },
                    { label: "Admin", value: "admin" },
                    { label: "User", value: "user" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`drawer-option-pill ${roleFilter === opt.value ? "active" : ""}`}
                      onClick={() => {
                        setRoleFilter(opt.value);
                        setpage(1);
                      }}
                    >
                      <span>{opt.label}</span>
                      {roleFilter === opt.value && <span className="option-check">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Account Status */}
              <div className="drawer-filter-section">
                <div className="drawer-filter-label">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Account Status</span>
                </div>
                <div className="drawer-options-grid cols-2">
                  {[
                    { label: "All Status", value: "", dot: null },
                    { label: "Active", value: "active", dot: "status-dot-active" },
                    { label: "Suspended", value: "suspended", dot: "status-dot-suspended" },
                    { label: "Banned", value: "banned", dot: "status-dot-banned" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`drawer-option-pill ${statusFilter === opt.value ? "active" : ""}`}
                      onClick={() => {
                        setStatusFilter(opt.value);
                        setpage(1);
                      }}
                    >
                      <span className="pill-content">
                        {opt.dot && <span className={`drawer-status-dot ${opt.dot}`}></span>}
                        <span>{opt.label}</span>
                      </span>
                      {statusFilter === opt.value && <span className="option-check">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 3: Email Verification */}
              <div className="drawer-filter-section">
                <div className="drawer-filter-label">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>Email Verification</span>
                </div>
                <div className="drawer-options-grid">
                  {[
                    { label: "All Emails", value: "" },
                    { label: "Verified", value: "verified" },
                    { label: "Unverified", value: "unverified" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`drawer-option-pill ${verificationFilter === opt.value ? "active" : ""}`}
                      onClick={() => {
                        setVerificationFilter(opt.value);
                        setpage(1);
                      }}
                    >
                      <span>{opt.label}</span>
                      {verificationFilter === opt.value && <span className="option-check">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 4: Gender */}
              <div className="drawer-filter-section">
                <div className="drawer-filter-label">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                  </svg>
                  <span>Gender</span>
                </div>
                <div className="drawer-options-grid cols-2">
                  {[
                    { label: "All Genders", value: "" },
                    { label: "Male", value: "male" },
                    { label: "Female", value: "female" },
                    { label: "Other", value: "other" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`drawer-option-pill ${genderFilter === opt.value ? "active" : ""}`}
                      onClick={() => {
                        setGenderFilter(opt.value);
                        setpage(1);
                      }}
                    >
                      <span>{opt.label}</span>
                      {genderFilter === opt.value && <span className="option-check">✓</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 5: Joined Timeframe */}
              <div className="drawer-filter-section">
                <div className="drawer-filter-label">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Joined Date</span>
                </div>
                <div className="drawer-options-grid cols-2">
                  {[
                    { label: "All Time", value: "" },
                    { label: "Today", value: "today" },
                    { label: "Last 7 Days", value: "7d" },
                    { label: "Last 30 Days", value: "30d" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`drawer-option-pill ${timeframeFilter === opt.value ? "active" : ""}`}
                      onClick={() => {
                        setTimeframeFilter(opt.value);
                        setpage(1);
                      }}
                    >
                      <span>{opt.label}</span>
                      {timeframeFilter === opt.value && <span className="option-check">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="filter-drawer-footer">
              <button
                type="button"
                className="drawer-reset-btn"
                disabled={activeFilterCount === 0}
                onClick={handleClearAllFilters}
              >
                Reset All
              </button>
              <button
                type="button"
                className="drawer-apply-btn"
                onClick={() => setIsFilterDrawerOpen(false)}
              >
                <span>Show {totalInList} {totalInList === 1 ? "User" : "Users"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showImageModal && (
        <div className="image-modal" onClick={() => setShowImageModal(false)}>
          <img
            className="image-modal-photo"
            src={selectedImage}
            alt="Profile"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </AppLayout>
  );
}

export default observer(AdminPanel);
