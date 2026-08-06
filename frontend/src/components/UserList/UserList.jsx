/* eslint-disable react-hooks/exhaustive-deps */
import "./userlist.css";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppLayout from "../AppLayout/AppLayout";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";
import UserActionMenu from "../UserActionMenu/UserActionMenu";

// eslint-disable-next-line react-refresh/only-export-components
function CustomDropdown({ options, value, onChange }) {
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
      className="custom-dropdown-container"
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
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="custom-dropdown-menu">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`custom-dropdown-item ${String(opt.value) === String(value) ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
              {String(opt.value) === String(value) && (
                <svg
                  width="14"
                  height="14"
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

// eslint-disable-next-line react-refresh/only-export-components
function UserList() {
  const { userStore } = useStore();
  const [search, setsearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const totalUsers = userStore.totalUsers;
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [page, setpage] = useState(1);
  const role = userStore.currentUser?.role;
  const navigate = useNavigate();
  const totalPages = Math.max(1, Math.ceil(totalUsers / 5));
  const users = userStore.users;
  const loading = userStore.loading.fetchUsers && users.length === 0;
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [menuState, setMenuState] = useState({
    open: false,
    user: null,
    reference: null,
  });

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

  const handleBulkRoleChange = async (targetRole) => {
    try {
      const res = await userStore.bulkUpdateUserRole(selectedUserIds, targetRole);
      toast.success(res.message);
      setSelectedUserIds([]);
      await fetchusers();
    } catch (error) {
      toast.error(error?.message || "Failed to update roles");
    }
  };

  const handleBulkDelete = async () => {
    try {
      const res = await userStore.bulkDeleteUsers(selectedUserIds);
      toast.success(res.message);
      setSelectedUserIds([]);
      setShowBulkDeleteModal(false);
      await fetchusers();
    } catch (error) {
      toast.error(error?.message || "Failed to delete selected users");
    }
  };
  const currentUser = userStore.currentUser;

  // Check if logged-in Admin matches the currently applied filters
  const isCurrentUserMatchingFilter = (user) => {
    if (!user) return false;
    if (roleFilter && user.role !== roleFilter) return false;
    if (genderFilter && user.gender?.toLowerCase() !== genderFilter.toLowerCase()) return false;
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

  const systemTotalUsers = totalUsers + (matchesCurrentUser ? 1 : 0);
  const verifiedCount =
    users.filter((u) => u.isVerified).length + (matchesCurrentUser && currentUser?.isVerified ? 1 : 0);
  const adminCount =
    users.filter((u) => u.role === "admin").length + (matchesCurrentUser && currentUser?.role === "admin" ? 1 : 0);
  const newTodayCount =
    users.filter((u) => {
      if (!u.createdAt) return false;
      return new Date(u.createdAt).toDateString() === new Date().toDateString();
    }).length +
    (matchesCurrentUser && currentUser?.createdAt && new Date(currentUser.createdAt).toDateString() === new Date().toDateString()
      ? 1
      : 0);

  const inlineStats = [
    {
      label: "Total Users",
      subtext: "(Admin + User)",
      value: systemTotalUsers,
      colorClass: "icon-blue",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      label: "Verified",
      subtext: "Verified Accounts",
      value: verifiedCount,
      colorClass: "icon-green",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      ),
    },
    {
      label: "Admin",
      subtext: "Only Admin Accounts",
      value: adminCount,
      colorClass: "icon-purple",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      ),
    },
    {
      label: "New Today",
      subtext: "Registered Today",
      value: newTodayCount,
      colorClass: "icon-amber",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
        limit: 5,
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
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [search]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedUserIds([]);
    fetchusers();
  }, [debouncedSearch, page, roleFilter, genderFilter, sortBy, sortOrder]);

  const handledelete = async () => {
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
      toast.error(error?.message || "Try again");
    }
  };

  return (
    <AppLayout
      title="Admin Panel"
      subtitle={`Admin User Management (${totalUsers} registered users)`}
    >
      <div className="page-container-users">
        <div className="users-container">

          {/* ── Page Header ── */}
          <div className="ul-page-header">
            <div className="ul-title-group">
              <h2 className="ul-page-title">Admin Management Dashboard</h2>
              <p className="ul-page-sub">Comprehensive overview & control of all accounts</p>
            </div>
            <div className="ul-header-right">
              <div className="search-wrap">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="search"
                  value={search}
                  placeholder="Search by name, email, or phone..."
                  className="search-input"
                  onChange={(e) => { setsearch(e.target.value); setpage(1); }}
                />
              </div>
              {role === "admin" && (
                <button className="btn btn-primary" onClick={() => navigate("/admin/users/addNewUser")}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add User
                </button>
              )}
            </div>
          </div>

          {/* ── Inline Stats Row ── */}
          <div className="ul-inline-stats">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div className="ul-stat-box skeleton-ul-stat" key={i}></div>
                ))
              : inlineStats.map((s) => (
                  <div className="ul-stat-box" key={s.label}>
                    <div className="ul-stat-top">
                      <span className="ul-stat-value">{s.value}</span>
                      <span className={`ul-stat-icon ${s.colorClass}`}>{s.icon}</span>
                    </div>
                    <div className="ul-stat-info-group">
                      <span className="ul-stat-label">{s.label}</span>
                      <span className="ul-stat-subtext">{s.subtext}</span>
                    </div>
                  </div>
                ))}
          </div>

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
                <span className="ul-bulk-badge">{selectedUserIds.length}</span> user(s) selected
              </div>
              <div className="ul-bulk-actions">
                {showMakeAdminBtn && (
                  <button
                    className="btn-bulk-action make-admin"
                    onClick={() => handleBulkRoleChange("admin")}
                  >
                    Make Admin
                  </button>
                )}
                {showMakeUserBtn && (
                  <button
                    className="btn-bulk-action make-user"
                    onClick={() => handleBulkRoleChange("user")}
                  >
                    Make User
                  </button>
                )}
                <button
                  className="btn-bulk-action delete"
                  onClick={() => setShowBulkDeleteModal(true)}
                >
                  Delete Selected
                </button>
                <button
                  className="btn-bulk-action clear"
                  onClick={() => setSelectedUserIds([])}
                >
                  ✕ Clear
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
                      <th className="dob-sortable-th" onClick={() => handleSort("dob")}>
                        <div className="dob-sort-btn">
                          <span className="dob-full-text">Date of birth</span>
                          <span className="dob-short-text">DOB</span>
                          <span className={`dob-sort-icon ${sortBy === "dob" ? "active" : ""}`}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              {sortBy === "dob" ? (
                                sortOrder === "asc" ? (
                                  <path d="M12 19V5M5 12l7-7 7 7" />
                                ) : (
                                  <path d="M12 5v14M5 12l7 7 7-7" />
                                )
                              ) : (
                                <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
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
                            className={selectedUserIds.includes(user._id) ? "row-selected" : ""}
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
                                <span className="verified-badge">Verified</span>
                              ) : (
                                <span className="unverified-badge">Unverified</span>
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
                                      if (menuState.open && menuState.user?._id === user._id) {
                                        setMenuState({ open: false, user: null, reference: null });
                                        return;
                                      }
                                      setMenuState({ open: true, user, reference: e.currentTarget });
                                    }}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                      <circle cx="12" cy="5" r="1.5"/>
                                      <circle cx="12" cy="12" r="1.5"/>
                                      <circle cx="12" cy="19" r="1.5"/>
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
                    Showing <b>{users.length}</b> of <b>{totalUsers}</b> users
                  </div>

                  <div className="pagination-controls">
                    <button
                      className="btn-page"
                      disabled={page <= 1}
                      onClick={() => setpage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <span className="page-indicator">
                      Page <b>{page}</b> of <b>{totalPages}</b>
                    </span>
                    <button
                      className="btn-page"
                      disabled={page >= totalPages}
                      onClick={() =>
                        setpage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Next
                    </button>
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
                onClick={() => {
                  setShowModal(false);
                  setDeleteId(null);
                }}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handledelete}>
                Delete
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
              Are you sure you want to delete <b>{selectedUserIds.length}</b> selected account(s)?
              This action cannot be undone.
            </p>
            <div className="modal-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => setShowBulkDeleteModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleBulkDelete}>
                Delete Selected
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

export default observer(UserList);
