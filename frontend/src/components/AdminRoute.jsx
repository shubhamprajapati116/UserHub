/* eslint-disable react-refresh/only-export-components */
import { Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useStore } from "../stores/StoreContext";
import FullScreenLoader from "../components/FullscreenLoader/FullscreenLoader";

function AdminRoute({ children }) {
  const { userStore } = useStore();
  const token = localStorage.getItem("token");

  if (userStore.authLoading) {
    return <FullScreenLoader />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!userStore.currentUser) {
    if (userStore.error?.isNetworkError) {
      return children;
    }
    return <Navigate to="/login" replace />;
  }

  if (userStore.currentUser.role !== "admin") {
    return <Navigate to="/profile" replace />;
  }

  return children;
}

export default observer(AdminRoute);