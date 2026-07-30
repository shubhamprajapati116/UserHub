import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-toastify";
import AppLayout from "../AppLayout/AppLayout";
import "./settings.css";

// eslint-disable-next-line react-refresh/only-export-components
function Settings() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const { userStore, themeStore } = useStore();
  const darkMode = themeStore.darkMode;
  const loading = userStore.loading.deleteAccount;

  const handledarkmode = () => {
    themeStore.toggleTheme();
  };

  const handleDelete = async () => {
    try {
      const data = await userStore.deleteAccount();

      userStore.clearCurrentUser();

      localStorage.removeItem("token");
      localStorage.removeItem("role");

      setShowModal(false);

      toast.success(data.message);

      setTimeout(() => {
        navigate("/login");
      }, 1000);
    } catch (error) {
      toast.error(error?.message || "Failed to delete account");
    }
  };

  return (
    <AppLayout
      title="Settings"
      subtitle="Manage your preferences and account security"
    >
      <div className="page-container-centered">
        <div className="settings-grid">
          <div className="card settings-layout">
            <div className="settings-body">
              <div className="setting-section">
                <div className="setting-info">
                  <div className="setting-info-icon security">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div>
                    <h3>Security</h3>
                    <p>Manage your account security settings.</p>
                  </div>
                </div>

                <div className="setting-card">
                  <div className="setting-card-content">
                    <h4>Password</h4>
                    <p>
                      Change your password regularly to keep your account
                      secure.
                    </p>
                  </div>
                  <button
                    className="btn btn-outline"
                    onClick={() => navigate("/settings/change-password")}
                  >
                    Change Password
                  </button>
                </div>
              </div>

              <div className="setting-section ">
                <div className="setting-info">
                  <div className="setting-info-icon security">
                    {
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="5" />
                        <line x1="12" y1="1" x2="12" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="23" />
                        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                        <line x1="1" y1="12" x2="3" y2="12" />
                        <line x1="21" y1="12" x2="23" y2="12" />
                        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                      </svg>
                    }
                  </div>
                  <div>
                    <h3>Appearance</h3>
                    <p>Customize your app's appearance and theme.</p>
                  </div>
                </div>

                <div className="setting-card">
                  <div className="setting-card-content">
                    <h4>Dark Mode</h4>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={darkMode}
                      onChange={handledarkmode}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <div className="setting-section danger-zone">
                <div className="setting-info">
                  <div className="setting-info-icon danger">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div>
                    <h3>Account Management</h3>
                    <p>Permanent actions related to your account.</p>
                  </div>
                </div>

                <div className="setting-card">
                  <div className="setting-card-content">
                    <h4>Delete Account</h4>
                    <p>
                      Permanently delete your account and all associated data.
                      This action cannot be undone.
                    </p>
                  </div>
                  <button
                    className="btn delete"
                    onClick={() => setShowModal(true)}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-icon">!</div>
              <h3>Delete your account?</h3>
              <p>
                All your data will be permanently removed. This cannot be
                undone.
              </p>
              <div className="modal-buttons">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default observer(Settings);
