/* eslint-disable react-hooks/exhaustive-deps */
import "./userlist.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppLayout from "../AppLayout/AppLayout";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";
import UserActionMenu from "../UserActionMenu/UserActionMenu";

// eslint-disable-next-line react-refresh/only-export-components
function UserList() {
  const { userStore } = useStore();
  const [search, setsearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const totalUsers = userStore.totalUsers;
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [page, setpage] = useState(1);
  const role = userStore.currentUser?.role;
  const navigate = useNavigate();
  const totalPages = Math.max(1, Math.ceil(totalUsers / 5));
  const users = userStore.users;
  const loading = userStore.loading.fetchUsers;
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [menuState, setMenuState] = useState({
    open: false,
    user: null,
    reference: null,
  });
  const stats = [
    {
      label: "Total Users",
      value: totalUsers,
      sub: "Total Registered",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
        </svg>
      ),
    },
    {
      label: "Current Page",
      value: `${page}/${totalPages}`,
      sub: `Page ${page} of ${totalPages}`,
      icon: (
        <svg
          width="20"
          height="20"
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
    {
      label: "Showing",
      value: users.length,
      sub: "Users on this page",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
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
      });
    } catch (error) {
      if (!error?.isNetworkError) {
        toast.error(error?.message || "Failed to fetch users");
      }
    }
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
    fetchusers();
  }, [debouncedSearch, page, userStore]);

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
      title="Users"
      subtitle={`${totalUsers} registered user${totalUsers !== 1 ? "s" : ""}`}
    >
      <div className="page-container-users">
        <div className="users-container">
          <div className="users-stats">
            {stats.map((stat) => (
              <div className="stat-card" key={stat.label}>
                <div className="stat-card-icon">
                  {loading ? (
                    <div className="skeleton skeleton-stat-icon"></div>
                  ) : (
                    stat.icon
                  )}
                </div>

                <div className="stat-card-label">
                  {loading ? (
                    <div className="skeleton skeleton-stat-label"></div>
                  ) : (
                    stat.label
                  )}
                </div>

                <div className="stat-card-value">
                  {loading ? (
                    <div className="skeleton skeleton-stat-value"></div>
                  ) : (
                    stat.value
                  )}
                </div>
                {stat.sub && !loading && (
                  <div className="stat-card-sub">{stat.sub}</div>
                )}
              </div>
            ))}
          </div>

          <div className="users-toolbar">
            {loading ? (
              <div className="search-wrap">
                <div className="skeleton skeleton-search"></div>
              </div>
            ) : (
              <div className="search-wrap">
                <svg
                  className="search-icon"
                  width="18"
                  height="18"
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
                  placeholder="Search by name or email..."
                  className="search-input"
                  onChange={(e) => {
                    setsearch(e.target.value);
                    setpage(1);
                  }}
                />
              </div>
            )}

            {role === "admin" &&
              (loading ? (
                <div className="skeleton skeleton-add-btn"></div>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/admin/users/addNewUser")}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add user
                </button>
              ))}
          </div>
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
                <span>Try a different search term or add a new user</span>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="user-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Gender</th>
                      <th>Date of birth</th>
                      <th>Role</th>
                      {role === "admin" && (
                        <th className="actions-col">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array.from({ length: 5 }).map((_, index) => (
                          <tr key={index}>
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
                              <div className="skeleton skeleton-user-date"></div>
                            </td>
                            <td>
                              <div className="skeleton skeleton-user-role"></div>
                            </td>

                            {role === "admin" && (
                              <td>
                                <div className="skeleton skeleton-user-action"></div>
                              </td>
                            )}
                          </tr>
                        ))
                      : users.map((user) => (
                          <tr key={user._id}>
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
                                  <span className="status-dot online"></span>
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
                              <span className="badge-gender">{user.gender}</span>
                            </td>

                            <td>
                              {user.dob
                                ? new Date(user.dob).toLocaleDateString("en-IN")
                                : "Not Added"}
                            </td>

                            <td>
                              {user.role === "admin" ? (
                                <span className="admin-badge">Admin</span>
                              ) : (
                                <span className="user-badge">User</span>
                              )}
                            </td>

                            {role === "admin" && (
                              <td>
                                <div className="action-menu">
                                  <button
                                    className="menu-trigger"
                                    onClick={(e) => {
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
                                    ⋮
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
      </div>
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
