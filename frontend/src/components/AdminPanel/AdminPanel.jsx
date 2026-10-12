import "./adminpanel.css";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import AppLayout from "../AppLayout/AppLayout";
import { useStore } from "../../stores/StoreContext";
import { observer } from "mobx-react-lite";
import UserActionMenu from "../UserActionMenu/UserActionMenu";

import { getAvailableLimitOptions } from "./utils/adminPanelUtils";
import AdminPanelHeader from "./components/AdminPanelHeader";
import AdminCommandBar from "./components/AdminCommandBar";
import AdminActiveFilters from "./components/AdminActiveFilters";
import AdminBulkActionBar from "./components/AdminBulkActionBar";
import AdminUserTable from "./components/AdminUserTable";
import AdminPagination from "./components/AdminPagination";
import AdminFilterDrawer from "./components/AdminFilterDrawer";
import AdminActionModals from "./components/AdminActionModals";
import AdminUserDrawer from "./components/AdminUserDrawer";

const DEFAULT_VISIBLE_COLUMNS = {
  role: true,
  gender: true,
  status: true,
  lastActive: true,
  dob: true,
};

const getInitialVisibleColumns = () => {
  try {
    const saved = localStorage.getItem("admin_visible_columns");
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_VISIBLE_COLUMNS, ...parsed };
    }
  } catch {
  }
  return DEFAULT_VISIBLE_COLUMNS;
};

function AdminPanel() {
  const { userStore } = useStore();
  const navigate = useNavigate();

  const [visibleColumns, setVisibleColumns] = useState(getInitialVisibleColumns);
  const [drawerUser, setDrawerUser] = useState(null);

  const handleToggleColumn = (colId) => {
    if (visibleColumns[colId]) {
      const activeCount = Object.values(visibleColumns).filter(Boolean).length;
      if (activeCount <= 1) {
        toast.info("At least one column must remain visible", {
          toastId: "column-visibility-min-limit",
        });
        return;
      }
    }

    setVisibleColumns((prev) => {
      const next = { ...prev, [colId]: !prev[colId] };
      const hasAnyVisible = Object.values(next).some(Boolean);
      if (!hasAnyVisible) {
        return prev;
      }
      try {
        localStorage.setItem("admin_visible_columns", JSON.stringify(next));
      } catch {
      }
      return next;
    });
  };

  const handleResetColumns = () => {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
    try {
      localStorage.setItem("admin_visible_columns", JSON.stringify(DEFAULT_VISIBLE_COLUMNS));
    } catch {
    }
    toast.success("Columns reset to default", {
      toastId: "columns-reset-default",
    });
  };

  const [search, setsearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [verificationFilter, setVerificationFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [timeframeFilter, setTimeframeFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [singleAdminModal, setSingleAdminModal] = useState({
    open: false,
    user: null,
  });
  const [bulkRoleModal, setBulkRoleModal] = useState({
    open: false,
    targetRole: "",
  });

  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [draftFilters, setDraftFilters] = useState({
    role: "",
    status: "",
    verification: "",
    gender: "",
    timeframe: "",
  });

  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);
  const [page, setpage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const [menuState, setMenuState] = useState({
    open: false,
    user: null,
    reference: null,
  });
  const [showTableLoader, setShowTableLoader] = useState(false);
  const [modalActionLoading, setModalActionLoading] = useState(false);

  const currentUserId = userStore.currentUser?._id || userStore.currentUser?.id;
  const users = (userStore.users || []).filter((u) => u._id !== currentUserId);
  const role = userStore.currentUser?.role;
  const totalUsers = userStore.systemTotalUsers || userStore.totalUsers;
  const totalInList = userStore.totalInList ?? users.length;
  const totalPages = Math.max(1, Math.ceil(totalInList / limit));
  const targetedDeleteUser =
    deleteTargetUser || users.find((u) => u._id === deleteId);
  const loading = userStore.loading.fetchUsers && users.length === 0;
  const isFetchingUsers = userStore.loading.fetchUsers;

  const activeFilters = useMemo(() => {
    const list = [];
    if (roleFilter) {
      list.push({
        id: "role",
        label: "Role",
        displayValue: roleFilter === "admin" ? "Admin" : "User",
        clear: () => {
          setRoleFilter("");
          setpage(1);
        },
      });
    }
    if (statusFilter) {
      list.push({
        id: "status",
        label: "Status",
        displayValue:
          statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1),
        clear: () => {
          setStatusFilter("");
          setpage(1);
        },
      });
    }
    if (verificationFilter) {
      list.push({
        id: "verification",
        label: "Email",
        displayValue:
          verificationFilter === "verified"
            ? "Verified"
            : verificationFilter === "pending_invite"
            ? "Pending Invites"
            : "Unverified",
        clear: () => {
          setVerificationFilter("");
          setpage(1);
        },
      });
    }
    if (genderFilter) {
      list.push({
        id: "gender",
        label: "Gender",
        displayValue:
          genderFilter.charAt(0).toUpperCase() + genderFilter.slice(1),
        clear: () => {
          setGenderFilter("");
          setpage(1);
        },
      });
    }
    if (timeframeFilter) {
      const timeLabels = {
        "30d": "Last 30 Days",
        "7d": "Last 7 Days",
        today: "Today",
      };
      list.push({
        id: "timeframe",
        label: "Joined",
        displayValue: timeLabels[timeframeFilter] || timeframeFilter,
        clear: () => {
          setTimeframeFilter("");
          setpage(1);
        },
      });
    }
    return list;
  }, [
    roleFilter,
    statusFilter,
    verificationFilter,
    genderFilter,
    timeframeFilter,
  ]);

  const activeFilterCount = activeFilters.length;
  const draftFilterCount = Object.values(draftFilters).filter(Boolean).length;
  const availableLimitOptions = getAvailableLimitOptions(totalInList);

  const handleClearAllFilters = () => {
    setRoleFilter("");
    setStatusFilter("");
    setVerificationFilter("");
    setGenderFilter("");
    setTimeframeFilter("");
    setpage(1);
  };

  const handleOpenFilterDrawer = () => {
    setDraftFilters({
      role: roleFilter,
      status: statusFilter,
      verification: verificationFilter,
      gender: genderFilter,
      timeframe: timeframeFilter,
    });
    setIsFilterDrawerOpen(true);
  };

  const handleResetDraftFilters = () => {
    setDraftFilters({
      role: "",
      status: "",
      verification: "",
      gender: "",
      timeframe: "",
    });
  };

  const handleApplyFilters = () => {
    setRoleFilter(draftFilters.role);
    setStatusFilter(draftFilters.status);
    setVerificationFilter(draftFilters.verification);
    setGenderFilter(draftFilters.gender);
    setTimeframeFilter(draftFilters.timeframe);
    setpage(1);
    setIsFilterDrawerOpen(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let timer;
    if (isFetchingUsers) {
      timer = setTimeout(() => {
        setShowTableLoader(true);
      }, 150);
    } else {
      setShowTableLoader(false);
    }
    return () => clearTimeout(timer);
  }, [isFetchingUsers]);

  useEffect(() => {
    const available = getAvailableLimitOptions(totalInList);
    if (!available.includes(limit)) {
      const fallback = available[0] || 5;
      setLimit(fallback);
      setpage(1);
    }
  }, [totalInList, limit]);

  useEffect(() => {
    try {
      localStorage.removeItem("admin_table_limit");
    } catch {
    }
  }, []);

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setpage(totalPages);
    }
  }, [page, totalPages]);

  const isAnyModalOpen =
    showModal ||
    showBulkDeleteModal ||
    showImageModal ||
    singleAdminModal.open ||
    bulkRoleModal.open ||
    isFilterDrawerOpen;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFilterDrawerOpen) {
        setIsFilterDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFilterDrawerOpen]);

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAnyModalOpen]);

  const selectableUsers = users.filter((u) => u._id !== currentUserId);
  const selectedUsers = users.filter((u) => selectedUserIds.includes(u._id));
  const showMakeAdminBtn =
    selectedUsers.length > 0 && selectedUsers.every((u) => u.role === "user");
  const showMakeUserBtn =
    selectedUsers.length > 0 && selectedUsers.every((u) => u.role === "admin");
  const isAllSelected =
    selectableUsers.length > 0 &&
    selectableUsers.every((u) => selectedUserIds.includes(u._id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectableUsers.map((u) => u._id));
    }
  };

  const toggleSelectUser = (id, e) => {
    if (e) e.stopPropagation();
    if (id === currentUserId) return;
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const fetchusers = async () => {
    try {
      await userStore.fetchUsers({
        page,
        limit,
        search: debouncedSearch.trim(),
        role: roleFilter,
        status: statusFilter,
        verification: verificationFilter,
        gender: genderFilter,
        timeframe: timeframeFilter,
        sortBy,
        sortOrder,
      });
    } catch (error) {
      if (!error?.isNetworkError) {
        toast.error(error?.message || "Failed to fetch users");
      }
    }
  };

  useEffect(() => {
    setSelectedUserIds([]);
    fetchusers();
  }, [
    debouncedSearch,
    page,
    limit,
    roleFilter,
    statusFilter,
    verificationFilter,
    genderFilter,
    timeframeFilter,
    sortBy,
    sortOrder,
  ]);

  const handleManualRefresh = async () => {
    if (isRefreshing || userStore.loading.fetchUsers) return;
    setIsRefreshing(true);
    setSelectedUserIds([]);
    try {
      await fetchusers();
      if (userStore.fetchStats) {
        userStore.fetchStats().catch(() => {});
      }
      toast.info("User list refreshed", {
        autoClose: 1800,
        toastId: "admin-refresh-toast",
      });
    } catch (err) {
      toast.error(err?.message || "Failed to refresh users");
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
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

  const handledelete = async () => {
    if (!deleteId || modalActionLoading) return;
    setModalActionLoading(true);
    try {
      const data = await userStore.deleteUser(deleteId);
      toast.success(data.message);
      await fetchusers();
      setShowModal(false);
      setDeleteId(null);
      setDeleteTargetUser(null);
      setMenuState({
        open: false,
        user: null,
        reference: null,
      });
    } catch (error) {
      toast.error(error?.message || "Failed to delete user");
    } finally {
      setModalActionLoading(false);
    }
  };

  const handleSingleMakeAdminSubmit = async () => {
    const targetId = singleAdminModal.user?._id;
    if (!targetId || modalActionLoading) return;
    setModalActionLoading(true);
    try {
      const data = await userStore.makeAdmin(targetId);
      toast.success(data.message);
      await fetchusers();
      setSingleAdminModal({ open: false, user: null });
    } catch (error) {
      toast.error(error?.message || "Failed to promote user to admin");
    } finally {
      setModalActionLoading(false);
    }
  };

  const handleBulkRoleChange = async (targetRole) => {
    if (!targetRole || selectedUserIds.length === 0 || modalActionLoading)
      return;
    setModalActionLoading(true);
    try {
      const res = await userStore.bulkUpdateUserRole(
        selectedUserIds,
        targetRole,
      );
      toast.success(res.message);
      setSelectedUserIds([]);
      await fetchusers();
      setBulkRoleModal({ open: false, targetRole: "" });
    } catch (error) {
      toast.error(error?.message || "Failed to update roles");
    } finally {
      setModalActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUserIds.length === 0 || modalActionLoading) return;
    setModalActionLoading(true);
    try {
      const res = await userStore.bulkDeleteUsers(selectedUserIds);
      toast.success(res.message);
      setSelectedUserIds([]);
      await fetchusers();
      setShowBulkDeleteModal(false);
    } catch (error) {
      toast.error(error?.message || "Failed to delete selected users");
    } finally {
      setModalActionLoading(false);
    }
  };

  return (
    <AppLayout
      title="User Management"
      subtitle={`Admin Panel • User Directory & Management (${totalUsers} registered users)`}
    >
      <div className="page-container-users linear-theme">
        <div className="users-container linear-wrapper">
          <AdminPanelHeader totalUsers={totalUsers} />

          <div className="linear-command-bar">
            <AdminCommandBar
              search={search}
              setsearch={setsearch}
              setDebouncedSearch={setDebouncedSearch}
              setpage={setpage}
              isRefreshing={isRefreshing}
              isLoadingUsers={userStore.loading.fetchUsers}
              handleManualRefresh={handleManualRefresh}
              handleOpenFilterDrawer={handleOpenFilterDrawer}
              activeFilterCount={activeFilterCount}
              role={role}
              onAddUser={() => navigate("/admin/users/new")}
              visibleColumns={visibleColumns}
              onToggleColumn={handleToggleColumn}
              onResetColumns={handleResetColumns}
            />
            <AdminActiveFilters
              activeFilters={activeFilters}
              activeFilterCount={activeFilterCount}
              handleClearAllFilters={handleClearAllFilters}
            />
          </div>

          <AdminBulkActionBar
            selectedUserIds={selectedUserIds}
            showMakeAdminBtn={showMakeAdminBtn}
            showMakeUserBtn={showMakeUserBtn}
            onOpenBulkRoleModal={(targetRole) =>
              setBulkRoleModal({ open: true, targetRole })
            }
            onOpenBulkDeleteModal={() => setShowBulkDeleteModal(true)}
            onClearSelection={() => setSelectedUserIds([])}
          />

          <div className="linear-table-card">
            <AdminUserTable
              loading={loading}
              users={users}
              showTableLoader={showTableLoader}
              isAllSelected={isAllSelected}
              toggleSelectAll={toggleSelectAll}
              handleSort={handleSort}
              sortBy={sortBy}
              sortOrder={sortOrder}
              role={role}
              selectedUserIds={selectedUserIds}
              currentUserId={currentUserId}
              toggleSelectUser={toggleSelectUser}
              setSelectedImage={setSelectedImage}
              setShowImageModal={setShowImageModal}
              menuState={menuState}
              setMenuState={setMenuState}
              visibleColumns={visibleColumns}
            />

            <AdminPagination
              loading={loading}
              totalInList={totalInList}
              usersCount={users.length}
              page={page}
              limit={limit}
              totalPages={totalPages}
              availableLimitOptions={availableLimitOptions}
              setLimit={setLimit}
              setpage={setpage}
            />
          </div>
        </div>
      </div>

      {menuState.open && (
        <UserActionMenu
          reference={menuState.reference}
          user={menuState.user}
          navigate={navigate}
          makeUserAdmin={makeUserAdmin}
          openMakeAdminModal={(targetUser) =>
            setSingleAdminModal({ open: true, user: targetUser })
          }
          openDeleteModal={(targetUser) => {
            setDeleteId(targetUser._id);
            setDeleteTargetUser(targetUser);
            setShowModal(true);
          }}
          setDeleteId={setDeleteId}
          setShowModal={setShowModal}
          userStore={userStore}
          onOpenQuickView={(targetUser) => setDrawerUser(targetUser)}
          onClose={() =>
            setMenuState({
              open: false,
              user: null,
              reference: null,
            })
          }
        />
      )}

      <AdminUserDrawer
        user={drawerUser}
        onClose={() => setDrawerUser(null)}
        userStore={userStore}
        navigate={navigate}
        onRefresh={fetchusers}
      />

      <AdminActionModals
        singleAdminModal={singleAdminModal}
        onCloseSingleAdminModal={() =>
          setSingleAdminModal({ open: false, user: null })
        }
        handleSingleMakeAdminSubmit={handleSingleMakeAdminSubmit}
        bulkRoleModal={bulkRoleModal}
        onCloseBulkRoleModal={() =>
          setBulkRoleModal({ open: false, targetRole: "" })
        }
        handleBulkRoleChange={handleBulkRoleChange}
        showModal={showModal}
        targetedDeleteUser={targetedDeleteUser}
        onCloseSingleDeleteModal={() => {
          setShowModal(false);
          setDeleteId(null);
          setDeleteTargetUser(null);
        }}
        handledelete={handledelete}
        showBulkDeleteModal={showBulkDeleteModal}
        onCloseBulkDeleteModal={() => setShowBulkDeleteModal(false)}
        handleBulkDelete={handleBulkDelete}
        showImageModal={showImageModal}
        selectedImage={selectedImage}
        onCloseImageModal={() => setShowImageModal(false)}
        selectedUserIds={selectedUserIds}
        modalActionLoading={modalActionLoading}
      />

      <AdminFilterDrawer
        isFilterDrawerOpen={isFilterDrawerOpen}
        setIsFilterDrawerOpen={setIsFilterDrawerOpen}
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
        draftFilterCount={draftFilterCount}
        handleResetDraftFilters={handleResetDraftFilters}
        handleApplyFilters={handleApplyFilters}
      />
    </AppLayout>
  );
}

export default observer(AdminPanel);
