/* eslint-disable react-refresh/only-export-components */
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import UserList from "./components/UserList/UserList";
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
          <Route
            path="/admin/users/:id/view"
            element={
              <AdminRoute>
                <Viewuser />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users/:id/userEdit"
            element={
              <AdminRoute>
                <EditUser />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UserList />
              </AdminRoute>
            }
          />
          <Route
            path="/profile/EditProfile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users/addNewUser"
            element={
              <AdminRoute>
                <AddUser />
              </AdminRoute>
            }
          />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Loginform />} />
          <Route path="/forgotpassword" element={<Forgotpassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="light"
        />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default observer(App);
