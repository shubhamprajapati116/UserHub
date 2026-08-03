import { makeAutoObservable, runInAction } from "mobx";
import apirequest from "../api/apirequest";
const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});
class UserStore {
  currentUser = (() => {
    try {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  })();
  loading = {
    login: false,
    register: false,
    fetchProfile: false,
    fetchUsers: false,
    fetchUserById: false,
    addUser: false,
    updateUser: false,
    updateProfile: false,
    photoUpdate: false,
    deleteUser: false,
    makeAdmin: false,
    changePassword: false,
    forgotPassword: false,
    resetPassword: false,
    deleteAccount: false,
    verifyEmail: false,
  };
  error = null;
  users = [];
  totalUsers = 0;
  editUser = null;
  authLoading = true;

  setAuthLoading(value) {
    this.authLoading = value;
  }

  clearCurrentUser() {
    this.currentUser = null;
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }
  constructor(rootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  async fetchProfile() {
    if (this.loading.fetchProfile) return;

    this.loading.fetchProfile = true;
    this.error = null;

    try {
      const response = await apirequest("/profile", {
        headers: getAuthHeaders(),
      });

      runInAction(() => {
        this.currentUser = response;
        localStorage.setItem("user", JSON.stringify(response));
      });
    } catch (error) {
      runInAction(() => {
        this.error = error;
        if (!error?.isNetworkError) {
          this.currentUser = null;
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      });
    } finally {
      runInAction(() => {
        this.loading.fetchProfile = false;
        this.authLoading = false;
      });
    }
  }

  async login(formdata) {
    if (this.loading.login) return;

    this.loading.login = true;
    this.error = null;

    try {
      const response = await apirequest("/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(formdata),
      });

      localStorage.setItem("token", response.token);

      await this.fetchProfile();

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    } finally {
      runInAction(() => {
        this.loading.login = false;
      });
    }
  }

  async fetchUsers({ page, limit, search }) {
    if (this.loading.fetchUsers) return;

    this.loading.fetchUsers = true;
    this.error = null;

    try {
      const response = await apirequest(
        `/Users?page=${page}&limit=${limit}&search=${search}`,
        {
          headers: getAuthHeaders(),
        },
      );

      runInAction(() => {
        this.users = response.users;
        this.totalUsers = response.totalUsers;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    } finally {
      runInAction(() => {
        this.loading.fetchUsers = false;
      });
    }
  }
  async register(formData) {
    if (this.loading.register) return;

    this.loading.register = true;
    this.error = null;

    try {
      const response = await apirequest("/register", {
        method: "POST",
        body: formData,
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    } finally {
      runInAction(() => {
        this.loading.register = false;
      });
    }
  }

  async updateUser(id, formData) {
    if (this.loading.updateUser) return;

    this.loading.updateUser = true;
    this.error = null;

    try {
      const response = await apirequest(`/Users/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: formData,
      });

      runInAction(() => {
        this.error = null;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    } finally {
      runInAction(() => {
        this.loading.updateUser = false;
      });
    }
  }
  async deleteUser(id) {
    if (this.loading.deleteUser) return;

    this.loading.deleteUser = true;
    this.error = null;

    try {
      const response = await apirequest(`/Users/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      runInAction(() => {
        this.error = null;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    } finally {
      runInAction(() => {
        this.loading.deleteUser = false;
      });
    }
  }
  async updateProfile(formData) {
    if (this.loading.updateProfile) return;

    this.loading.updateProfile = true;
    this.error = null;

    try {
      const response = await apirequest("/profile", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: formData,
      });

      runInAction(() => {
        this.error = null;
        this.currentUser = response.user;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    } finally {
      runInAction(() => {
        this.loading.updateProfile = false;
      });
    }
  }

  async addUser(formData) {
    if (this.loading.addUser) return;

    this.loading.addUser = true;
    this.error = null;

    try {
      const response = await apirequest("/admin/users", {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      runInAction(() => {
        this.error = null;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    } finally {
      runInAction(() => {
        this.loading.addUser = false;
      });
    }
  }
  async makeAdmin(id) {
    if (this.loading.makeAdmin) return;

    this.loading.makeAdmin = true;
    this.error = null;

    try {
      const response = await apirequest(`/users/${id}/make-admin`, {
        method: "PUT",
        headers: getAuthHeaders(),
      });

      runInAction(() => {
        this.error = null;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    } finally {
      runInAction(() => {
        this.loading.makeAdmin = false;
      });
    }
  }
  async photoUpdate(formData) {
    if (this.loading.photoUpdate) return;

    this.loading.photoUpdate = true;
    this.error = null;

    try {
      const response = await apirequest("/profile", {
        method: "PUT",
        headers: getAuthHeaders(),
        body: formData,
      });

      runInAction(() => {
        this.error = null;
        this.currentUser = response.user;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    } finally {
      runInAction(() => {
        this.loading.photoUpdate = false;
      });
    }
  }
  async fetchUserById(id) {
    if (this.loading.fetchUserById) return;

    this.loading.fetchUserById = true;
    this.error = null;

    try {
      const response = await apirequest(`/Users/${id}`, {
        headers: getAuthHeaders(),
      });

      runInAction(() => {
        this.error = null;
        this.editUser = response;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    } finally {
      runInAction(() => {
        this.loading.fetchUserById = false;
      });
    }
  }
  async changePassword(formData) {
    if (this.loading.changePassword) return;

    this.loading.changePassword = true;
    this.error = null;

    try {
      const response = await apirequest("/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      runInAction(() => {
        this.error = null;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    } finally {
      runInAction(() => {
        this.loading.changePassword = false;
      });
    }
  }
  async forgotPassword(email) {
    if (this.loading.forgotPassword) return;

    this.loading.forgotPassword = true;
    this.error = null;

    try {
      const response = await apirequest("/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      runInAction(() => {
        this.error = null;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    } finally {
      runInAction(() => {
        this.loading.forgotPassword = false;
      });
    }
  }
  async resetPassword(token, password) {
    if (this.loading.resetPassword) return;

    this.loading.resetPassword = true;
    this.error = null;

    try {
      const response = await apirequest(`/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
        }),
      });

      runInAction(() => {
        this.error = null;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    } finally {
      runInAction(() => {
        this.loading.resetPassword = false;
      });
    }
  }
  async deleteAccount() {
    if (this.loading.deleteAccount) return;

    this.loading.deleteAccount = true;
    this.error = null;

    try {
      const response = await apirequest("/account-delete", {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      runInAction(() => {
        this.error = null;
        this.currentUser = null;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    } finally {
      runInAction(() => {
        this.loading.deleteAccount = false;
      });
    }
  }
  async verifyEmail(token) {
    if (this.loading.verifyEmail) return;

    this.loading.verifyEmail = true;
    this.error = null;

    try {
      const response = await apirequest(`/verify-email/${token}`);

      runInAction(() => {
        this.error = null;
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });

      throw error;
    } finally {
      runInAction(() => {
        this.loading.verifyEmail = false;
      });
    }
  }
}
export default UserStore;
