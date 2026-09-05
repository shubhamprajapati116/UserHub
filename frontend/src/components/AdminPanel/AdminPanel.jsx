/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-hooks/exhaustive-deps */
import "./adminpanel.css";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppLayout from "../AppLayout/AppLayout";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";
import UserActionMenu from "../UserActionMenu/UserActionMenu";
import UserGrowthChart from "../UserGrowthChart/UserGrowthChart";

// eslint-disable-next-line react-refresh/only-export-components
function CustomDropdown({ options, value, onChange, dropUp = false }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption =
    options.find((o) => String(o.value) === String(value)) || options[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={`custom-dropdown-container ${dropUp ? "drop-up" : ""}`}
      ref={dropdownRef}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={`custom-dropdown-btn ${open ? "open" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <span>{selectedOption ? selectedOption.label : ""}</span>
        <svg
          className={`dropdown-chevron ${open ? "rotate" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className={`custom-dropdown-menu ${dropUp ? "drop-up-menu" : ""}`}>
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
            >
              {opt.label}
              {!opt.disabled && String(opt.value) === String(value) && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
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
  const [genderFilter, setGenderFilter] = useState("");
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
  const totalUsers = userStore.totalUsers;
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [page, setpage] = useState(1);
  const [limit, setLimit] = useState(5);
  const role = userStore.currentUser?.role;
  const navigate = useNavigate();
  const totalPages = Math.max(1, Math.ceil(totalUsers / limit));
  const users = userStore.users;
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

  const availableLimitOptions = getAvailableLimitOptions(totalUsers);

  // Auto-adjust limit if total count changes and current limit is no longer available
  useEffect(() => {
    const available = getAvailableLimitOptions(totalUsers);
    if (!available.includes(limit)) {
      const fallback = available[available.length - 1] || 5;
      setLimit(fallback);
      setpage(1);
    }
  }, [totalUsers, limit]);

  const isAnyModalOpen =
    showModal ||
    showBulkDeleteModal ||
    showImageModal ||
    singleAdminModal.open ||
    bulkRoleModal.open;
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

  const selectedUsers = users.filter((u) => selectedUserIds.includes(u._id));
  const showMakeAdminBtn =
    selectedUsers.length > 0 && selectedUsers.every((u) => u.role === "user");
  const showMakeUserBtn =
    selectedUsers.length > 0 && selectedUsers.every((u) => u.role === "admin");
  const isAllSelected =
    users.length > 0 && users.every((u) => selectedUserIds.includes(u._id));
  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map((u) => u._id));
    }
  };

  const toggleSelectUser = (id, e) => {
    if (e) e.stopPropagation();
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const [modalActionLoading, setModalActionLoading] = useState(false);

  const handleBulkRoleChange = async (targetRole) => {
    if (!targetRole || selectedUserIds.length === 0 || modalActionLoading) return;
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

  const currentUser = userStore.currentUser;

  const isCurrentUserMatchingFilter = (user) => {
    if (!user) return false;
    if (roleFilter && user.role !== roleFilter) return false;
    if (
      genderFilter &&
      user.gender?.toLowerCase() !== genderFilter.toLowerCase()
    )
      return false;
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase().trim();
      const nameMatch = user.name?.toLowerCase().includes(s);
      const emailMatch = user.email?.toLowerCase().includes(s);
      const phoneMatch = user.phone?.includes(s);
      if (!nameMatch && !emailMatch && !phoneMatch) return false;
    }
    return true;
  };

  const matchesCurrentUser = isCurrentUserMatchingFilter(currentUser);
  const backendStats = userStore.stats;
  const systemTotalUsers = totalUsers + (matchesCurrentUser ? 1 : 0);
  const verifiedCount =
    (backendStats
      ? backendStats.verifiedUsersCount
      : users.filter((u) => u.isVerified).length) +
    (matchesCurrentUser && currentUser?.isVerified ? 1 : 0);
  const adminCount =
    (backendStats
      ? backendStats.adminUsersCount
      : users.filter((u) => u.role === "admin").length) +
    (matchesCurrentUser && currentUser?.role === "admin" ? 1 : 0);

  const newTodayCount =
    (backendStats
      ? backendStats.todayUsersCount
      : users.filter(
          (u) =>
            u.createdAt &&
            new Date(u.createdAt).toDateString() === new Date().toDateString(),
        ).length) +
    (matchesCurrentUser &&
    currentUser?.createdAt &&
    new Date(currentUser.createdAt).toDateString() === new Date().toDateString()
      ? 1
      : 0);

  const inlineStats = [
    {
      label: "Total Users",
      subtext: "System registered",
      value: systemTotalUsers,
      colorClass: "icon-blue",
      badge: "All Time",
      badgeClass: "badge-blue",
      icon: (
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Verified Users",
      subtext: "Email confirmed",
      value: verifiedCount,
      colorClass: "icon-green",
      badge: `${systemTotalUsers > 0 ? Math.round((verifiedCount / systemTotalUsers) * 100) : 100}% verified`,
      badgeClass: "badge-green",
      icon: (
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
    },
    {
      label: "Admin Accounts",
      subtext: "System managers",
      value: adminCount,
      colorClass: "icon-purple",
      badge: "Full access",
      badgeClass: "badge-purple",
      icon: (
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      ),
    },
    {
      label: "New Today",
      subtext: "Registered today",
      value: newTodayCount,
      colorClass: "icon-amber",
      badge: newTodayCount > 0 ? `+${newTodayCount} new` : "Today",
      badgeClass: "badge-amber",
      icon: (
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
  ];

  const fetchusers = async () => {
    try {
      await userStore.fetchUsers({
        page,
        limit,
        search: debouncedSearch.trim(),
        role: roleFilter,
        gender: genderFilter,
        sortBy,
        sortOrder,
      });
    } catch (error) {
      if (!error?.isNetworkError) {
        toast.error(error?.message || "Failed to fetch users");
      }
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
    genderFilter,
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
      title="Admin Panel"
      subtitle={`Admin User Management(${totalUsers}registered users)`}
    >
      <div className="page-container-users">
        <div className="users-container">
          <div className="ul-page-header">
            <div className="ul-title-group">
              <h2 className="ul-page-title">Admin Management Dashboard</h2>
              <p className="ul-page-sub">
                Comprehensive overview & control of all accounts
              </p>
            </div>
            <div className="ul-header-right">
              <div className="search-wrap">
                <svg
                  className="search-icon"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="search"
                  value={search}
                  placeholder="Search by name, email, or phone..."
                  className="search-input"
                  onChange={(e) => {
                    setsearch(e.target.value);
                    setpage(1);
                  }}
                />
              </div>
              {role === "admin" && (
                <button
                  className="btn btn-primary"
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
                  Add User
                </button>
              )}
            </div>
          </div>

          {/* ── Inline Stats Row (Option 1 Glassmorphic Cards) ── */}
          <div className="ul-inline-stats">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div className="ul-stat-box skeleton-stat-card" key={i}>
                    <div className="ul-stat-top">
                      <div className="ul-stat-main-info">
                        <div className="skeleton skeleton-stat-label"></div>
                        <div className="skeleton skeleton-stat-value"></div>
                      </div>
                      <div className="skeleton skeleton-stat-icon"></div>
                    </div>
                    <div className="ul-stat-bottom">
                      <div className="skeleton skeleton-stat-badge"></div>
                      <div className="skeleton skeleton-stat-subtext"></div>
                    </div>
                    <div className="ul-stat-progress-bar">
                      <div className="skeleton skeleton-stat-progress"></div>
                    </div>
                  </div>
                ))
              : inlineStats.map((s) => (
                  <div
                    className={`ul-stat-box ${s.colorClass}-card`}
                    key={s.label}
                  >
                    <div className="ul-stat-top">
                      <div className="ul-stat-main-info">
                        <span className="ul-stat-label">{s.label}</span>
                        <span className="ul-stat-value">{s.value}</span>
                      </div>
                      <div className={`ul-stat-icon-wrapper ${s.colorClass}`}>
                        {s.icon}
                      </div>
                    </div>
                    <div className="ul-stat-bottom">
                      <span className={`ul-stat-badge ${s.badgeClass}`}>
                        {s.badge}
                      </span>
                      <span className="ul-stat-subtext">{s.subtext}</span>
                    </div>
                    <div className="ul-stat-progress-bar">
                      <div
                        className={`ul-stat-progress-fill ${s.colorClass}`}
                      />
                    </div>
                  </div>
                ))}
          </div>

          {/* ── User Registration Growth Timeline Analytics Chart ── */}
          <UserGrowthChart />

          {/* ── Filter & Sort Toolbar ── */}
          <div className="ul-filter-row">
            <div className="ul-filter-group">
              <span className="ul-filter-label">Role:</span>
              <CustomDropdown
                options={[
                  { label: "All Roles", value: "" },
                  { label: "Admin", value: "admin" },
                  { label: "Regular User", value: "user" },
                ]}
                value={roleFilter}
                onChange={(val) => {
                  setRoleFilter(val);
                  setpage(1);
                }}
              />
            </div>

            <div className="ul-filter-group">
              <span className="ul-filter-label">Gender:</span>
              <CustomDropdown
                options={[
                  { label: "All Genders", value: "" },
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                  { label: "Other", value: "other" },
                ]}
                value={genderFilter}
                onChange={(val) => {
                  setGenderFilter(val);
                  setpage(1);
                }}
              />
            </div>

            {(roleFilter || genderFilter || debouncedSearch) && (
              <button
                className="ul-reset-btn"
                onClick={() => {
                  setsearch("");
                  setDebouncedSearch("");
                  setRoleFilter("");
                  setGenderFilter("");
                  setSortBy("createdAt");
                  setSortOrder("desc");
                  setpage(1);
                }}
              >
                Reset Filters
              </button>
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

          <div className="users-panel card">
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
                <table className="user-table">
                  <thead>
                    <tr>
                      <th className="checkbox-col">
                        <input
                          type="checkbox"
                          className="ul-checkbox"
                          checked={isAllSelected}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th>User</th>
                      <th>Email</th>
                      <th>Gender</th>
                      <th>Role</th>
                      <th>Verified</th>
                      <th
                        className="dob-sortable-th"
                        onClick={() => handleSort("dob")}
                      >
                        <div className="dob-sort-btn">
                          <span className="dob-full-text">Date of birth</span>
                          <span className="dob-short-text">DOB</span>
                          <span
                            className={`dob-sort-icon ${sortBy === "dob" ? "active" : ""}`}
                          >
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                            >
                              {sortBy === "dob" ? (
                                sortOrder === "asc" ? (
                                  <path d="M12 19V5M5 12l7-7 7 7" />
                                ) : (
                                  <path d="M12 5v14M5 12l7 7 7-7" />
                                )
                              ) : (
                                <path d="M7 15l5 5 5-5M7 9l5 5 5-5" />
                              )}
                            </svg>
                          </span>
                        </div>
                      </th>
                      {role === "admin" && (
                        <th className="actions-col">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 5 }).map((_, index) => (
                          <tr key={index}>
                            <td className="checkbox-col">
                              <div className="skeleton skeleton-checkbox"></div>
                            </td>
                            <td>
                              <div className="user-cell">
                                <div className="skeleton skeleton-user-avatar"></div>
                                <div className="skeleton skeleton-user-name"></div>
                              </div>
                            </td>
                            <td>
                              <div className="skeleton skeleton-user-email"></div>
                            </td>
                            <td>
                              <div className="skeleton skeleton-user-small"></div>
                            </td>
                            <td>
                              <div className="skeleton skeleton-user-role"></div>
                            </td>
                            <td>
                              <div className="skeleton skeleton-user-role"></div>
                            </td>
                            <td>
                              <div className="skeleton skeleton-user-date"></div>
                            </td>
                            {role === "admin" && (
                              <td>
                                <div className="skeleton skeleton-user-action"></div>
                              </td>
                            )}
                          </tr>
                        ))
                      : users.map((user) => (
                          <tr
                            key={user._id}
                            className={
                              selectedUserIds.includes(user._id)
                                ? "row-selected"
                                : ""
                            }
                          >
                            <td className="checkbox-col">
                              <input
                                type="checkbox"
                                className="ul-checkbox"
                                checked={selectedUserIds.includes(user._id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelectUser(user._id, e);
                                }}
                              />
                            </td>
                            <td>
                              <div className="user-cell">
                                <div
                                  className="user-avatar-wrapper"
                                  style={{ position: "relative" }}
                                >
                                  {user.profilephoto || user.profileImage ? (
                                    <img
                                      src={
                                        user.profileImage ||
                                        `${import.meta.env.VITE_API_URL}/uploads/${user.profilephoto}`
                                      }
                                      alt={user.name}
                                      className="user-avatar"
                                      onClick={() => {
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
                                  ) : (
                                    <div className="user-avatar-initials">
                                      {user.name
                                        ? user.name
                                            .substring(0, 2)
                                            .toUpperCase()
                                        : "U"}
                                    </div>
                                  )}
                                </div>
                                <div className="user-info">
                                  <span
                                    className="user-name"
                                    style={{ textTransform: "capitalize" }}
                                  >
                                    {user.name}
                                  </span>
                                </div>
                              </div>
                            </td>

                            <td className="email-cell">{user.email}</td>

                            <td>
                              <span
                                className={`badge-gender ${
                                  user.gender ? user.gender.toLowerCase() : ""
                                }`}
                              >
                                {user.gender || "Not Added"}
                              </span>
                            </td>

                            <td>
                              {user.role === "admin" ? (
                                <span className="admin-badge">Admin</span>
                              ) : (
                                <span className="user-badge">User</span>
                              )}
                            </td>

                            <td>
                              {user.isVerified ? (
                                <span className="verified-badge">
                                  <span className="status-dot green-dot" />
                                  Verified
                                </span>
                              ) : (
                                <span className="unverified-badge">
                                  <span className="status-dot amber-dot" />
                                  Unverified
                                </span>
                              )}
                            </td>

                            <td>
                              {user.dob
                                ? new Date(user.dob).toLocaleDateString("en-IN")
                                : "Not Added"}
                            </td>
                            {role === "admin" && (
                              <td>
                                <div className="action-menu">
                                  <button
                                    className="menu-trigger"
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
                                      <circle cx="12" cy="5" r="1.5" />
                                      <circle cx="12" cy="12" r="1.5" />
                                      <circle cx="12" cy="19" r="1.5" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            )}
            {loading ? (
              <div className="pagination">
                <div className="skeleton skeleton-page-btn"></div>

                <div className="skeleton skeleton-page-info"></div>

                <div className="skeleton skeleton-page-btn"></div>
              </div>
            ) : (
              totalUsers > 0 && (
                <div className="pagination">
                  <div className="pagination-info">
                    <span className="pagination-info-full">
                      Showing <b>{users.length}</b> of <b>{totalUsers}</b> users
                    </span>
                    <span className="pagination-info-short">
                      <b>{users.length}</b>/<b>{totalUsers}</b>
                    </span>
                  </div>

                  <div className="pagination-right-group">
                    <div className="pagination-rows-selector">
                      <span className="rows-label rows-label-full">
                        Rows per page:
                      </span>
                      <span className="rows-label rows-label-short">Rows:</span>
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

                    <div className="pagination-controls">
                      <button
                        className="btn-page"
                        disabled={page <= 1}
                        onClick={() => setpage((p) => Math.max(1, p - 1))}
                        title="Previous Page"
                        aria-label="Previous Page"
                      >
                        <span className="btn-page-text">Previous</span>
                        <svg
                          className="btn-page-arrow"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                      </button>
                      <span className="page-indicator">
                        <span className="page-indicator-full">
                          Page <b>{page}</b> of <b>{totalPages}</b>
                        </span>
                        <span className="page-indicator-short">
                          <b>{page}</b>/<b>{totalPages}</b>
                        </span>
                      </span>
                      <button
                        className="btn-page"
                        disabled={page >= totalPages}
                        onClick={() =>
                          setpage((p) => Math.min(totalPages, p + 1))
                        }
                        title="Next Page"
                        aria-label="Next Page"
                      >
                        <span className="btn-page-text">Next</span>
                        <svg
                          className="btn-page-arrow"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
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
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-icon admin">👑</div>
            <h3>Grant Admin Privileges?</h3>
            <p>
              You are granting full Admin access to{" "}
              <b>{singleAdminModal.user?.name || "this user"}</b>. They will
              have full permissions to manage accounts and database records. Are
              you sure you want to proceed?
            </p>
            <div className="modal-buttons">
              <button
                className="btn btn-secondary"
                disabled={modalActionLoading}
                onClick={() => setSingleAdminModal({ open: false, user: null })}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={modalActionLoading}
                onClick={handleSingleMakeAdminSubmit}
              >
                {modalActionLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Granting Admin...</span>
                  </>
                ) : (
                  "Yes, Grant Admin"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Bulk Role Change Confirmation Modal ── */}
      {bulkRoleModal.open && (
        <div className="modal-overlay">
          <div className="modal">
            <div
              className={`modal-icon ${bulkRoleModal.targetRole === "admin" ? "admin" : "warning"}`}
            >
              {bulkRoleModal.targetRole === "admin" ? "👑" : "🛡️"}
            </div>
            <h3>
              {bulkRoleModal.targetRole === "admin"
                ? `Grant Admin Access to ${selectedUserIds.length} User(s)?`
                : `Demote ${selectedUserIds.length} Admin(s) to Regular User?`}
            </h3>
            <p>
              {bulkRoleModal.targetRole === "admin"
                ? `Are you sure you want to grant full administrative privileges to ${selectedUserIds.length} selected account(s)?`
                : `Are you sure you want to revoke admin permissions from ${selectedUserIds.length} selected account(s)? They will lose access to the Admin Panel.`}
            </p>
            <div className="modal-buttons">
              <button
                className="btn btn-secondary"
                disabled={modalActionLoading}
                onClick={() =>
                  setBulkRoleModal({ open: false, targetRole: "" })
                }
              >
                Cancel
              </button>
              <button
                className={`btn ${bulkRoleModal.targetRole === "admin" ? "btn-primary" : "btn-danger"}`}
                disabled={modalActionLoading}
                onClick={() => handleBulkRoleChange(bulkRoleModal.targetRole)}
              >
                {modalActionLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Updating Roles...</span>
                  </>
                ) : bulkRoleModal.targetRole === "admin" ? (
                  "Yes, Grant Admin"
                ) : (
                  "Yes, Demote to User"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-icon">!</div>
            <h3>Delete this user?</h3>
            <p>
              This action cannot be undone. The user will be permanently
              removed.
            </p>
            <div className="modal-buttons">
              <button
                className="btn btn-secondary"
                disabled={modalActionLoading}
                onClick={() => {
                  setShowModal(false);
                  setDeleteId(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handledelete}
                disabled={modalActionLoading}
              >
                {modalActionLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Deleting...</span>
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {showBulkDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-icon">!</div>
            <h3>Delete {selectedUserIds.length} Selected User(s)?</h3>
            <p>
              Are you sure you want to delete <b>{selectedUserIds.length}</b>{" "}
              selected account(s)? This action cannot be undone.
            </p>
            <div className="modal-buttons">
              <button
                className="btn btn-secondary"
                disabled={modalActionLoading}
                onClick={() => setShowBulkDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={handleBulkDelete}
                disabled={modalActionLoading}
              >
                {modalActionLoading ? (
                  <>
                    <span className="btn-spinner"></span>
                    <span>Deleting Selected...</span>
                  </>
                ) : (
                  "Delete Selected"
                )}
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
