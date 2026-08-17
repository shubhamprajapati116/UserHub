/* eslint-disable react-refresh/only-export-components */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import AdminPanel from "./components/AdminPanel/AdminPanel";
import Loginform from "./components/LoginForm/loginform";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./components/Profile/Profile";
import Forgotpassword from "./components/ForgotPassword/forgotpassword";
import "./App.css";
import ResetPassword from "./components/ResetPassword/ResetPassword";
import Settings from "./components/settings/settings";
import Changepassword from "./components/ChnagePassword/ChangePassword";
import VerifyEmail from "./components/VerifyEmail/VerifyEmail";
import AdminRoute from "./components/AdminRoute";
import Register from "./components/RegisterForm/registrationform";
import EditUser from "./components/EditUser/EditUser";
import EditProfile from "./components/Editprofile/Editprofile";
import AddUser from "./components/Adduser/AddUser";
import { useStore } from "./stores/StoreContext";
import Viewuser from "./components/Viewuser/Viewuser";
import ErrorBoundary from "./components/ErrorBoundary";
import ActiveSessions from "./components/settings/ActiveSessions";

function App() {
  const { themeStore, userStore } = useStore();
  useEffect(() => {
    themeStore.initializeTheme();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/users" replace />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings></Settings>
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/settings/change-password"
            element={
              <ProtectedRoute>
                <Changepassword></Changepassword>
              </ProtectedRoute>
            }
          ></Route>
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/active-sessions" element={<ActiveSessions />} />
          {/* Admin User Management Routes */}
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
            element={
              <AdminRoute>
                <Viewuser />
              </AdminRoute>
            }
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

          {/* Profile Routes */}
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

          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Loginform />} />
          <Route path="/forgotpassword" element={<Forgotpassword />} />
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
