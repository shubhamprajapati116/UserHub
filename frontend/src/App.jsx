import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import Loginform from "./components/LoginForm/loginform";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./components/ProtectedRoute";
import Forgotpassword from "./components/ForgotPassword/forgotpassword";
import "./App.css";
import VerifyEmail from "./components/VerifyEmail/VerifyEmail";
import AdminRoute from "./components/AdminRoute";
import Register from "./components/RegisterForm/registrationform";
import { useStore } from "./stores/StoreContext";
import ErrorBoundary from "./components/ErrorBoundary";
import LandingPage from "./components/LandingPage/LandingPage";

import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import AdminPanel from "./components/AdminPanel/AdminPanel";
import AddUser from "./components/Adduser/AddUser";
import EditUser from "./components/EditUser/EditUser";
import Profile from "./components/Profile/Profile";
import EditProfile from "./components/Editprofile/Editprofile";
import Settings from "./components/settings/settings";
import Changepassword from "./components/ChnagePassword/ChangePassword";
import ResetPassword from "./components/ResetPassword/ResetPassword";
import ActiveSessions from "./components/settings/ActiveSessions";
import HelpSupport from "./components/HelpSupport/HelpSupport";
import AcceptInvite from "./components/AcceptInvite/AcceptInvite";
import { preloadAuthBanner } from "./utils/authBannerPreload";

preloadAuthBanner();

function App() {
  const { themeStore, userStore } = useStore();
  useEffect(() => {
    themeStore.initializeTheme();
    preloadAuthBanner();
  }, [themeStore]);

  useEffect(() => {
    const initializeApp = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        userStore.setAuthLoading(false);
        return;
      }

      await userStore.fetchProfile();
    };

    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/accept-invite/:token" element={<AcceptInvite />} />

            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/change-password"
              element={
                <ProtectedRoute>
                  <Changepassword />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/edit"
              element={
                <ProtectedRoute>
                  <EditProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/EditProfile"
              element={<Navigate to="/profile/edit" replace />}
            />
            <Route
              path="/active-sessions"
              element={
                <ProtectedRoute>
                  <ActiveSessions />
                </ProtectedRoute>
              }
            />
            <Route
              path="/help"
              element={
                <ProtectedRoute>
                  <HelpSupport />
                </ProtectedRoute>
              }
            />
            <Route path="/support" element={<Navigate to="/help" replace />} />

            <Route
              path="/admin"
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users/new"
              element={
                <AdminRoute>
                  <AddUser />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users/addNewUser"
              element={<Navigate to="/admin/users/new" replace />}
            />
            <Route
              path="/admin/users/:id/view"
              element={<Navigate to="/admin/users" replace />}
            />
            <Route
              path="/admin/users/:id/edit"
              element={
                <AdminRoute>
                  <EditUser />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users/:id/userEdit"
              element={<Navigate to="/admin/users" replace />}
            />

            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Loginform />} />
            <Route path="/forgotpassword" element={<Forgotpassword />} />
            <Route path="/forgot-password" element={<Forgotpassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
          </Routes>
        <ToastContainer
          position="top-center"
          autoClose={2600}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
        />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default observer(App);
