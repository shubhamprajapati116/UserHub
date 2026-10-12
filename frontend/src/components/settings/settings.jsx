import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import AppLayout from "../AppLayout/AppLayout";
import "./settings.css";
import ActiveSessions from "./ActiveSessions";
import SecurityEmailModal from "../SecurityEmailModal/SecurityEmailModal";

import SettingsSidebarNav from "./components/SettingsSidebarNav";
import SettingsProfileTab from "./components/SettingsProfileTab";
import SettingsSecurityTab from "./components/SettingsSecurityTab";
import SettingsAppearanceTab from "./components/SettingsAppearanceTab";
import SettingsNotificationsTab from "./components/SettingsNotificationsTab";
import SettingsDangerTab from "./components/SettingsDangerTab";
import DeleteAccountModal from "./components/DeleteAccountModal";

function Settings() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const [showModal, setShowModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [avatarError, setAvatarError] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);

  const { userStore, themeStore } = useStore();
  const darkMode = themeStore.darkMode;
  const loading = userStore.loading.deleteAccount;
  const currentUser = userStore.currentUser;

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab") || location.state?.tab;
    const validTabs = [
      "profile",
      "security",
      "appearance",
      "notifications",
      "activeSessions",
      "danger",
    ];
    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, location.state]);

  useEffect(() => {
    if (
      location.state?.openEmailModal ||
      searchParams.get("openEmail") === "true"
    ) {
      setShowEmailModal(true);
    }
  }, [location.state, searchParams]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal]);

  const handledarkmode = () => {
    themeStore.toggleTheme();
  };

  const securityAlerts =
    currentUser?.notificationPreferences?.securityLoginAlerts !== false;

  const handleToggleSecurityAlerts = async (e) => {
    const newValue = e.target.checked;
    try {
      await userStore.updateNotificationPreferences({
        securityLoginAlerts: newValue,
      });
      toast.success(
        `Security alerts ${newValue ? "turned ON" : "turned OFF"}`,
      );
    } catch (error) {
      if (!error?.isNetworkError) {
        toast.error(
          error?.message || "Failed to update notification settings",
        );
      }
    }
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
      if (!error?.isNetworkError) {
        toast.error(error?.message || "Failed to delete account");
      }
    }
  };

  const copyToClipboard = (text, keyName, label = "Value") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    toast.info(`Copied ${label} to clipboard!`, { autoClose: 1500 });
    setTimeout(() => {
      setCopiedKey((prev) => (prev === keyName ? null : prev));
    }, 2000);
  };

  const userPhoto = currentUser?.profilephoto;
  const avatarUrl = userPhoto
    ? userPhoto.startsWith("http")
      ? userPhoto
      : `${import.meta.env.VITE_API_URL}/uploads/${userPhoto}`
    : null;

  const userName = currentUser?.name || "User";
  const initials =
    userName
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  const memberSince = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recently joined";

  return (
    <AppLayout
      title="Settings"
      subtitle="Manage your personal profile, display theme, and account security"
    >
      <div className="settings-page-wrapper">
        <div className="settings-option1-container">
          <SettingsSidebarNav
            activeTab={activeTab}
            handleTabChange={handleTabChange}
            avatarUrl={avatarUrl}
            avatarError={avatarError}
            setAvatarError={setAvatarError}
            initials={initials}
            userName={userName}
            currentUser={currentUser}
          />

          <div className="settings-main-panel">
            {activeTab === "profile" && (
              <SettingsProfileTab
                currentUser={currentUser}
                avatarUrl={avatarUrl}
                avatarError={avatarError}
                setAvatarError={setAvatarError}
                initials={initials}
                userName={userName}
                memberSince={memberSince}
                darkMode={darkMode}
                securityAlerts={securityAlerts}
                copiedKey={copiedKey}
                copyToClipboard={copyToClipboard}
                navigate={navigate}
              />
            )}

            {activeTab === "security" && (
              <SettingsSecurityTab
                currentUser={currentUser}
                setShowEmailModal={setShowEmailModal}
                navigate={navigate}
              />
            )}

            {activeTab === "appearance" && (
              <SettingsAppearanceTab
                darkMode={darkMode}
                handledarkmode={handledarkmode}
              />
            )}

            {activeTab === "notifications" && (
              <SettingsNotificationsTab
                securityAlerts={securityAlerts}
                handleToggleSecurityAlerts={handleToggleSecurityAlerts}
                loadingPreferences={
                  userStore.loading.notificationPreferences
                }
                currentUser={currentUser}
              />
            )}

            {activeTab === "activeSessions" && (
              <ActiveSessions
                onNavigateSecurity={() => handleTabChange("security")}
              />
            )}

            {activeTab === "danger" && (
              <SettingsDangerTab
                onOpenDeleteModal={() => setShowModal(true)}
              />
            )}
          </div>
        </div>
      </div>

      <DeleteAccountModal
        showModal={showModal}
        onClose={() => setShowModal(false)}
        handleDelete={handleDelete}
        loading={loading}
      />

      <SecurityEmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
      />
    </AppLayout>
  );
}

export default observer(Settings);
