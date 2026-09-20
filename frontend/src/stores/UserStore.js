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
    resendLoginOtp: false,
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
    verifyResetToken: false,
    deleteAccount: false,
    verifyEmail: false,
    experience: false,
    notificationPreferences: false,
    fetchAnalytics: false,
    fetchTodayUsers: false,
    requestEmailChange: false,
    verifyEmailChangeOtp: false,
    resendEmailChangeOtp: false,
    cancelEmailChange: false,
    resendPendingVerification: false,
    updateBanner: false,
    revokeSession: false,
    resendVerification: false,
    updateUserStatus: false,
    revokeSessions: false,
  };
  // Device ID generator & getter
  getDeviceId() {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
      // Unique random device fingerprint string (e.g. dev_8f9a2b1c...)
      deviceId =
        "dev_" +
        Math.random().toString(36).substring(2, 12) +
        "_" +
        Date.now().toString(36);
      localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
  }
  error = null;
  users = [];
  todayUsers = [];
  totalUsers = 0;
  systemTotalUsers = 0;
  totalInList = 0;
  stats = null;
  currentFetchUsersId = 0;
  userGrowthAnalytics = null;
  userGrowthCache = {};
  currentFetchAnalyticsId = 0;
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
        // Only clear credentials on actual 401 unauthorized errors, NEVER on 429 rate limit or server blips
        if (
          error?.status === 401 ||
          error?.statusCode === 401 ||
          error?.message?.includes("Invalid Token") ||
          error?.message?.includes("Session expired") ||
          error?.message?.includes("Access Denied")
        ) {
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

  async resendPendingVerification() {
    this.loading.resendPendingVerification = true;
    try {
      const response = await apirequest(
        "/profile/resend-pending-verification",
        {
          method: "POST",
          headers: getAuthHeaders(),
        },
      );
      return response;
    } finally {
      runInAction(() => {
        this.loading.resendPendingVerification = false;
      });
    }
  }

  async login(formdata) {
    if (this.loading.login) return;

    this.loading.login = true;
    this.error = null;

    try {
      const deviceId = this.getDeviceId();
      const response = await apirequest("/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ ...formdata, deviceId }),
      });

      if (response.requireOtp || response.requireotp) {
        return response;
      }

      localStorage.setItem("token", response.token);

      runInAction(() => {
        if (response.user) {
          this.currentUser = response.user;
          localStorage.setItem("user", JSON.stringify(response.user));
        }
      });

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
  // ── 1. Verify Login OTP Method ──
  async verifyLoginOtp(email, otp) {
    this.loading.login = true;
    this.error = null;

    try {
      const deviceId = this.getDeviceId();

      const response = await apirequest("/verify-login-otp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, otp, deviceId }),
      });

      // Token save karo aur Current User state update karo
      if (response.token) {
        localStorage.setItem("token", response.token);

        runInAction(() => {
          if (response.user) {
            this.currentUser = response.user;
            localStorage.setItem("user", JSON.stringify(response.user));
          }
        });
      }

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

  // ── 2. Resend Login OTP Method ──
  async resendLoginOtp(email) {
    if (this.loading.resendLoginOtp) return;
    this.loading.resendLoginOtp = true;
    this.error = null;

    try {
      return await apirequest("/resend-login-otp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });
    } finally {
      runInAction(() => {
        this.loading.resendLoginOtp = false;
      });
    }
  }
  async fetchStats() {
    this.loading.fetchAnalytics = true;
    try {
      let response;
      try {
        response = await apirequest("/api/admin/stats", {
          headers: getAuthHeaders(),
        });
      } catch {
        // Fallback for backward compatibility
        response = await apirequest("/api/admin/users?page=1&limit=1", {
          headers: getAuthHeaders(),
        });
      }

      runInAction(() => {
        this.totalUsers = response.totalUsers;
        this.systemTotalUsers = response.totalUsers;
        this.totalInList = response.totalUsers;
        this.stats = response.stats || null;
      });

      return response;
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
    } finally {
      runInAction(() => {
        this.loading.fetchAnalytics = false;
      });
    }
  }

  async fetchUsers({
    page = 1,
    limit = 5,
    search = "",
    role = "",
    gender = "",
    status = "",
    verification = "",
    country = "",
    timeframe = "",
    sortBy = "createdAt",
    sortOrder = "desc",
  } = {}) {
    const fetchId = ++this.currentFetchUsersId;
    this.loading.fetchUsers = true;
    this.error = null;

    try {
      const params = {
        page,
        limit,
        search,
        role,
        gender,
        country,
        sortBy,
        sortOrder,
      };
      if (status) {
        params.status = status;
      }
      if (verification) {
        params.verification = verification;
      }
      if (timeframe) {
        params.timeframe = timeframe;
      }
      const queryParams = new URLSearchParams(params).toString();
      console.log(queryParams);

      const response = await apirequest(`/api/admin/users?${queryParams}`, {
        headers: getAuthHeaders(),
      });

      // Strict race condition guard: only update if this is the latest in-flight request
      if (fetchId === this.currentFetchUsersId) {
        runInAction(() => {
          this.users = response.users || [];
          this.totalUsers =
            response.systemTotalUsers ?? response.totalUsers ?? 0;
          this.systemTotalUsers =
            response.systemTotalUsers ?? response.totalUsers ?? 0;
          this.totalInList =
            response.totalInList ?? response.users?.length ?? 0;
          this.stats = response.stats || null;
        });
      }

      return response;
    } catch (error) {
      if (fetchId === this.currentFetchUsersId) {
        runInAction(() => {
          this.error = error;
        });
      }

      throw error;
    } finally {
      if (fetchId === this.currentFetchUsersId) {
        runInAction(() => {
          this.loading.fetchUsers = false;
        });
      }
    }
  }

  async fetchUserGrowthAnalytics(timeframe = "7d") {
    // 1. Instant Cache: If timeframe was already fetched, display immediately with 0 latency
    if (this.userGrowthCache[timeframe]) {
      runInAction(() => {
        this.userGrowthAnalytics = this.userGrowthCache[timeframe];
      });
    }

    const fetchId = ++this.currentFetchAnalyticsId;
    this.loading.fetchAnalytics = true;
    this.error = null;

    try {
      const response = await apirequest(
        `/api/admin/analytics/user-growth?timeframe=${timeframe}`,
        {
          headers: getAuthHeaders(),
        },
      );

      // 2. Race Condition Guard: Only update active view if this request is still the latest requested
      if (fetchId === this.currentFetchAnalyticsId) {
        runInAction(() => {
          this.userGrowthCache[timeframe] = response;
          this.userGrowthAnalytics = response;
        });
      } else {
        // Silently preserve in cache for future instant navigation
        this.userGrowthCache[timeframe] = response;
      }

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });
      return null;
    } finally {
      if (fetchId === this.currentFetchAnalyticsId) {
        runInAction(() => {
          this.loading.fetchAnalytics = false;
        });
      }
    }
  }

  async fetchTodayUsers() {
    this.loading.fetchTodayUsers = true;
    try {
      const response = await apirequest(
        `/api/admin/users?timeframe=today&limit=50&sortBy=createdAt&sortOrder=desc`,
        {
          headers: getAuthHeaders(),
        },
      );
      runInAction(() => {
        this.todayUsers = response.users || [];
      });
      return response.users || [];
    } catch (error) {
      console.error("Failed to fetch today users:", error);
      runInAction(() => {
        this.todayUsers = [];
      });
      return [];
    } finally {
      runInAction(() => {
        this.loading.fetchTodayUsers = false;
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
        if (response.user) {
          this.currentUser = response.user;
          localStorage.setItem("user", JSON.stringify(response.user));
        }
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

  async updateBanner(bannerId) {
    if (this.loading.updateBanner) return;
    this.loading.updateBanner = true;
    this.error = null;

    try {
      // Immediate local cache & MobX reactive state update
      if (this.currentUser) {
        runInAction(() => {
          this.currentUser = { ...this.currentUser, profileBanner: bannerId };
          localStorage.setItem("user", JSON.stringify(this.currentUser));
        });
      }
      localStorage.setItem(
        "user_profile_banner_" + (this.currentUser?._id || "default"),
        bannerId,
      );

      const response = await apirequest("/profile/banner", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ profileBanner: bannerId }),
      });

      runInAction(() => {
        if (response.user) {
          this.currentUser = response.user;
          localStorage.setItem("user", JSON.stringify(response.user));
        }
      });

      return response;
    } catch (error) {
      console.warn("Banner API sync warning (local banner kept):", error);
      return { success: true, localOnly: true, profileBanner: bannerId };
    } finally {
      runInAction(() => {
        this.loading.updateBanner = false;
      });
    }
  }

  async requestEmailChange({ newEmail, password }) {
    if (this.loading.requestEmailChange) return;
    this.loading.requestEmailChange = true;
    this.error = null;

    try {
      const response = await apirequest("/profile/request-email-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ newEmail, password }),
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading.requestEmailChange = false;
      });
    }
  }

  async verifyEmailChangeOtp(otp) {
    if (this.loading.verifyEmailChangeOtp) return;
    this.loading.verifyEmailChangeOtp = true;
    this.error = null;

    try {
      const response = await apirequest("/profile/verify-email-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ otp }),
      });

      runInAction(() => {
        this.error = null;
        if (response.user) {
          this.currentUser = response.user;
          localStorage.setItem("user", JSON.stringify(response.user));
        }
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading.verifyEmailChangeOtp = false;
      });
    }
  }

  async resendEmailChangeOtp() {
    if (this.loading.resendEmailChangeOtp) return;
    this.loading.resendEmailChangeOtp = true;
    this.error = null;

    try {
      const response = await apirequest("/profile/resend-email-otp", {
        method: "POST",
        headers: getAuthHeaders(),
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading.resendEmailChangeOtp = false;
      });
    }
  }

  async cancelEmailChange() {
    if (this.loading.cancelEmailChange) return;
    this.loading.cancelEmailChange = true;
    this.error = null;

    try {
      const response = await apirequest("/profile/cancel-email-change", {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      runInAction(() => {
        if (response.user) {
          this.currentUser = response.user;
          localStorage.setItem("user", JSON.stringify(response.user));
        }
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading.cancelEmailChange = false;
      });
    }
  }

  async cancelAdminPendingEmailChange(id) {
    if (this.loading.cancelEmailChange) return;
    this.loading.cancelEmailChange = true;
    this.error = null;

    try {
      const response = await apirequest(
        `/api/admin/users/${id}/pending-email`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );

      runInAction(() => {
        const user = this.users.find((u) => u._id === id);
        if (user) {
          user.pendingEmail = null;
        }
        if (this.editUser && this.editUser._id === id) {
          this.editUser.pendingEmail = null;
        }
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading.cancelEmailChange = false;
      });
    }
  }

  async resendPendingEmailVerification(id) {
    if (this.loading.resendPendingVerification) return;
    this.loading.resendPendingVerification = true;
    this.error = null;

    try {
      const url = id
        ? `/api/admin/users/${id}/resend-pending-email`
        : "/profile/resend-pending-verification";
      const response = await apirequest(url, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading.resendPendingVerification = false;
      });
    }
  }

  async updateUser(id, formData) {
    if (this.loading.updateUser) return;

    this.loading.updateUser = true;
    this.error = null;

    try {
      const response = await apirequest(`/api/admin/users/${id}`, {
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

  async bulkDeleteUsers(userIds) {
    if (this.loading.bulkDelete) return;

    this.loading.bulkDelete = true;
    this.error = null;

    try {
      const response = await apirequest("/api/admin/users/bulk-delete", {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds }),
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading.bulkDelete = false;
      });
    }
  }

  async bulkUpdateUserRole(userIds, role) {
    if (this.loading.bulkRole) return;

    this.loading.bulkRole = true;
    this.error = null;

    try {
      const response = await apirequest("/api/admin/users/bulk-role", {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userIds, role }),
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading.bulkRole = false;
      });
    }
  }

  async deleteUser(id) {
    if (this.loading.deleteUser) return;

    this.loading.deleteUser = true;
    this.error = null;

    try {
      const response = await apirequest(`/api/admin/users/${id}`, {
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

  async revokeUserSessions(id) {
    if (this.loading.revokeSession) return;

    this.loading.revokeSession = true;
    this.error = null;

    try {
      const response = await apirequest(
        `/api/admin/users/${id}/revoke-session`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        },
      );

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
        this.loading.revokeSession = false;
      });
    }
  }

  // ── Public Resend Account Verification (For Unverified / Revoked Users) ──
  async resendVerificationEmail(email) {
    if (this.loading.resendVerification) return;
    this.loading.resendVerification = true;
    this.error = null;
    try {
      const response = await apirequest("/resend-verification", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading.resendVerification = false;
      });
    }
  }


  // ── Admin: Update User Account Status (active | suspended | banned) ──
  async adminUpdateUserStatus(userId, status, reason = "") {
    if (this.loading.updateUserStatus) return;
    this.loading.updateUserStatus = true;
    try {
      const response = await apirequest(`/api/admin/users/${userId}/status`, {
        method: "PATCH",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, reason }),
      });
      runInAction(() => {
        const user = this.users.find((u) => u._id === userId);
        if (user) {
          user.status = response.user?.status || status;
          if (reason) user.statusReason = reason;
        }
      });
      // Trigger background fetch to keep dashboard KPI metrics synchronized
      this.fetchStats().catch(() => {});
      return response;
    } finally {
      runInAction(() => {
        this.loading.updateUserStatus = false;
      });
    }
  }

  async addUser(formData) {
    if (this.loading.addUser) return;

    this.loading.addUser = true;
    this.error = null;

    try {
      const response = await apirequest("/api/admin/users", {
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
      const response = await apirequest(`/api/admin/users/${id}/role`, {
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
      let response;
      try {
        response = await apirequest("/profile/photo", {
          method: "PUT",
          headers: getAuthHeaders(),
          body: formData,
        });
      } catch (err) {
        if (err?.status === 404) {
          response = await apirequest("/profile", {
            method: "PUT",
            headers: getAuthHeaders(),
            body: formData,
          });
        } else {
          throw err;
        }
      }

      runInAction(() => {
        this.error = null;
        if (response?.user) {
          this.currentUser = response.user;
          localStorage.setItem("user", JSON.stringify(response.user));
        }
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
    this.loading.fetchUserById = true;
    this.error = null;
    this.editUser = null;

    try {
      const response = await apirequest(`/api/admin/users/${id}`, {
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
  async verifyResetToken(token) {
    this.loading.verifyResetToken = true;
    this.error = null;

    try {
      const response = await apirequest(`/verify-reset-token/${token}`);

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
        this.loading.verifyResetToken = false;
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

  async addExperience(expData) {
    if (this.loading.experience) return;
    this.loading.experience = true;
    this.error = null;

    try {
      const response = await apirequest("/profile/experience", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(expData),
      });

      runInAction(() => {
        this.error = null;
        if (response.user) {
          this.currentUser = response.user;
          localStorage.setItem("user", JSON.stringify(response.user));
        }
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading.experience = false;
      });
    }
  }

  async updateExperience(expId, expData) {
    if (this.loading.experience) return;
    this.loading.experience = true;
    this.error = null;

    try {
      const response = await apirequest(`/profile/experience/${expId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(expData),
      });

      runInAction(() => {
        this.error = null;
        if (response.user) {
          this.currentUser = response.user;
          localStorage.setItem("user", JSON.stringify(response.user));
        }
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading.experience = false;
      });
    }
  }

  async deleteExperience(expId) {
    if (this.loading.experience) return;
    this.loading.experience = true;
    this.error = null;

    try {
      const response = await apirequest(`/profile/experience/${expId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      runInAction(() => {
        this.error = null;
        if (response.user) {
          this.currentUser = response.user;
          localStorage.setItem("user", JSON.stringify(response.user));
        }
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading.experience = false;
      });
    }
  }

  async updateNotificationPreferences(preferences) {
    if (this.loading.notificationPreferences) return;
    this.loading.notificationPreferences = true;
    this.error = null;

    try {
      const response = await apirequest("/notification-preferences", {
        method: "PUT",
        headers: {
          ...getAuthHeaders(),
          "content-type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      runInAction(() => {
        this.error = null;
        if (response.user) {
          this.currentUser = response.user;
          localStorage.setItem("user", JSON.stringify(response.user));
        } else if (response.notificationPreferences && this.currentUser) {
          this.currentUser.notificationPreferences =
            response.notificationPreferences;
          localStorage.setItem("user", JSON.stringify(this.currentUser));
        }
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });
      throw error;
    } finally {
      runInAction(() => {
        this.loading.notificationPreferences = false;
      });
    }
  }

  async cancelEmailChange() {
    try {
      const response = await apirequest("/profile/cancel-email-change", {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      runInAction(() => {
        if (response.user) {
          this.currentUser = response.user;
          localStorage.setItem("user", JSON.stringify(response.user));
        } else if (this.currentUser) {
          this.currentUser.pendingEmail = null;
          localStorage.setItem("user", JSON.stringify(this.currentUser));
        }
      });

      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error;
      });
      throw error;
    }
  }

  async verifyEmail(token) {
    try {
      return await apirequest(`/verify-email/${token}`, {
        method: "GET",
      });
    } catch (error) {
      throw error;
    }
  }

  async resendVerificationEmail(payload) {
    try {
      const body = typeof payload === "string" ? { email: payload } : payload;
      return await apirequest("/resend-verification", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      throw error;
    }
  }
}
export default UserStore;
