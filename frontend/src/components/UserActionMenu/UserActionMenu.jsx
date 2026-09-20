/* eslint-disable react-hooks/set-state-in-effect */
import "./UserActionMenu.css";
import { useState, useLayoutEffect, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FiEye,
  FiEdit2,
  FiTrash2,
  FiShield,
  FiMail,
  FiLogOut,
  FiPauseCircle,
  FiPlayCircle,
  FiSlash,
} from "react-icons/fi";
import { toast } from "react-toastify";

function UserActionMenu({
  reference,
  user,
  navigate,
  makeUserAdmin,
  openMakeAdminModal,
  openDeleteModal,
  setDeleteId,
  setShowModal,
  userStore,
  onClose,
}) {
  const menuRef = useRef(null);
  const [avatarError, setAvatarError] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const currentUser = userStore?.currentUser;
  const isSelf = currentUser?._id === user?._id;

  const handleRevokeSession = async (e) => {
    e.stopPropagation();
    if (isSelf) return;

    setIsRevoking(true);
    try {
      if (userStore?.revokeUserSessions) {
        const res = await userStore.revokeUserSessions(user._id);
        toast.warning(
          res?.message || "User sessions revoked. Kicked out to login screen.",
          {
            toastId: `revoke-${user._id}`,
          },
        );
      }
      onClose();
    } catch (err) {
      toast.error(err?.message || "Failed to revoke user session");
    } finally {
      setIsRevoking(false);
    }
  };

  const handleUpdateStatus = async (e, newStatus) => {
    e.stopPropagation();
    if (isSelf) return;

    setIsUpdatingStatus(true);
    try {
      if (userStore?.adminUpdateUserStatus) {
        const res = await userStore.adminUpdateUserStatus(user._id, newStatus);
        const actionLabel =
          newStatus === "active"
            ? "reactivated"
            : newStatus === "suspended"
            ? "suspended"
            : "banned";
        toast.success(
          res?.message || `User account has been ${actionLabel} successfully!`
        );
      } else {
        toast.info(`Status updated to ${newStatus}`);
      }
      onClose();
    } catch (err) {
      toast.error(err?.message || `Failed to update status to ${newStatus}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const calculatePosition = () => {
    if (!reference) {
      return { top: 72, left: 0, maxHeight: 380, placement: "bottom" };
    }

    const rect = reference.getBoundingClientRect();
    const menuEl = menuRef.current;
    const menuWidth = menuEl?.offsetWidth || 188;
    // Accurate or realistic initial menu height
    const menuHeight = menuEl?.scrollHeight || menuEl?.offsetHeight || 360;

    // Safety margins: Header is 62px, so safe top boundary is 72px (never touch or overlap header!)
    const SAFE_TOP = 72;
    const SAFE_BOTTOM = 14;
    const SAFE_LEFT = 10;
    const SAFE_RIGHT = 14;

    const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - SAFE_BOTTOM - 6);
    const spaceAbove = Math.max(0, rect.top - SAFE_TOP - 6);

    // Natural reading direction for table rows is downwards.
    // Only flip upwards if space below is genuinely constrained (< 220px) AND space above has more room.
    const openUpwards = spaceBelow < 220 && spaceAbove > spaceBelow;

    let top;
    let maxHeight;
    let placement;

    if (openUpwards) {
      placement = "top";
      maxHeight = Math.max(160, Math.min(380, spaceAbove));
      const effectiveHeight = Math.min(menuHeight, maxHeight);
      top = Math.max(SAFE_TOP, rect.top - effectiveHeight - 6);
    } else {
      placement = "bottom";
      top = rect.bottom + 6;
      maxHeight = Math.max(160, Math.min(380, spaceBelow));
    }

    // Safety boundary clamping: NEVER allow top < SAFE_TOP under any circumstance!
    top = Math.max(SAFE_TOP, top);
    if (top + maxHeight > window.innerHeight - SAFE_BOTTOM) {
      maxHeight = Math.max(120, window.innerHeight - SAFE_BOTTOM - top);
    }

    // Horizontal alignment: right-align to trigger button
    let left = rect.right - menuWidth;
    if (left < SAFE_LEFT) left = SAFE_LEFT;
    if (left + menuWidth > window.innerWidth - SAFE_RIGHT) {
      left = window.innerWidth - menuWidth - SAFE_RIGHT;
    }

    return {
      top: Math.round(top),
      left: Math.round(left),
      maxHeight: Math.round(maxHeight),
      placement,
    };
  };

  const [position, setPosition] = useState(calculatePosition);

  useLayoutEffect(() => {
    setPosition(calculatePosition());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference, user]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        reference &&
        !reference.contains(e.target)
      ) {
        onClose();
      }
    }

    function handleScroll(e) {
      // 🛡️ Do NOT close if scrolling inside the dropdown menu itself
      if (
        menuRef.current &&
        (menuRef.current === e.target || menuRef.current.contains(e.target))
      ) {
        return;
      }
      onClose();
    }

    function handleResize() {
      onClose();
    }

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    window.addEventListener("resize", handleResize, { passive: true });
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, { capture: true });
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [reference, onClose]);

  if (!reference || !user) {
    return null;
  }

  // Avatar URL & Fallback
  const userPhoto = user?.profilephoto;
  const avatarUrl = userPhoto
    ? userPhoto.startsWith("http")
      ? userPhoto
      : `${import.meta.env.VITE_API_URL}/uploads/${userPhoto}`
    : null;

  const initials = (user?.name || "U")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return createPortal(
    <div
      ref={menuRef}
      className={`uam-dropdown-menu placement-${position.placement || "bottom"}`}
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
        maxHeight: `${position.maxHeight || 380}px`,
      }}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* ── User Header Context ── */}
      <div className="uam-user-header">
        <div className="uam-avatar-wrap">
          {avatarUrl && !avatarError ? (
            <img
              src={avatarUrl}
              alt=""
              className="uam-avatar-img"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <span className="uam-avatar-fallback">{initials}</span>
          )}
          {user.isVerified && (
            <span className="uam-verified-indicator" title="Verified Account">
              ✓
            </span>
          )}
        </div>
        <div className="uam-user-meta">
          <div className="uam-name-row">
            <span className="uam-user-name" title={user.name}>
              {user.name || "User"}
            </span>
            {isSelf && <span className="uam-self-badge">You</span>}
          </div>
          <div className="uam-sub-row">
            <span
              className={`uam-role-pill ${user.role === "admin" ? "admin" : "user"}`}
            >
              {user.role?.toUpperCase() || "USER"}
            </span>
            {user.status === "suspended" && (
              <span className="uam-status-pill suspended">SUSPENDED</span>
            )}
            {user.status === "banned" && (
              <span className="uam-status-pill banned">BANNED</span>
            )}
          </div>
        </div>
      </div>

      <div className="uam-divider"></div>

      {/* ── Navigation Actions Section ── */}
      <div className="uam-section">
        <button
          type="button"
          className="uam-item"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
            navigate(`/admin/users/${user._id}/view`);
          }}
        >
          <div className="uam-icon-box view">
            <FiEye size={12} />
          </div>
          <span className="uam-item-label">View Details</span>
        </button>

        <button
          type="button"
          className="uam-item"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
            navigate(`/admin/users/${user._id}/edit`);
          }}
        >
          <div className="uam-icon-box edit">
            <FiEdit2 size={12} />
          </div>
          <span className="uam-item-label">Edit User</span>
        </button>
      </div>

      {/* ── Pending Email Actions ── */}
      {user.pendingEmail && (
        <>
          <div className="uam-divider"></div>
          <div className="uam-section">
            <button
              type="button"
              className="uam-item"
              onClick={async (e) => {
                e.stopPropagation();
                onClose();
                try {
                  const res = await userStore.resendPendingEmailVerification(
                    user._id,
                  );
                  toast.success(
                    res?.message ||
                      "Verification link resent successfully!",
                  );
                } catch (err) {
                  toast.error(
                    err?.message ||
                      "Failed to resend verification link",
                  );
                }
              }}
              disabled={userStore?.loading?.resendPendingVerification}
            >
              <div className="uam-icon-box mail">
                <FiMail size={12} />
              </div>
              <span className="uam-item-label">Resend Verification Link</span>
            </button>

            <button
              type="button"
              className="uam-item"
              onClick={async (e) => {
                e.stopPropagation();
                onClose();
                try {
                  const res =
                    await userStore.cancelAdminPendingEmailChange(user._id);
                  toast.info(
                    res?.message || "Pending email change cancelled.",
                  );
                } catch (err) {
                  toast.error(
                    err?.message || "Failed to cancel email change",
                  );
                }
              }}
              disabled={userStore?.loading?.cancelEmailChange}
            >
              <div className="uam-icon-box suspend">
                <FiSlash size={12} />
              </div>
              <span className="uam-item-label">Cancel Email Change</span>
            </button>
          </div>
        </>
      )}

      {/* ── Role Management Section ── */}
      {user.role !== "admin" && (
        <>
          <div className="uam-divider"></div>
          <div className="uam-section">
            <button
              type="button"
              className="uam-item promote"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                if (openMakeAdminModal) {
                  openMakeAdminModal(user);
                } else if (makeUserAdmin) {
                  makeUserAdmin(user._id);
                }
              }}
              disabled={userStore?.loading?.makeAdmin}
            >
              <div className="uam-icon-box admin">
                <FiShield size={12} />
              </div>
              <span className="uam-item-label">
                {userStore?.loading?.makeAdmin
                  ? "Promoting..."
                  : "Promote to Admin"}
              </span>
            </button>
          </div>
        </>
      )}

      {/* ── Account Status Management (Suspend / Ban / Reactivate) ── */}
      {!isSelf && user.role !== "admin" && (
        <>
          <div className="uam-divider"></div>
          <div className="uam-section">
            {user.status === "suspended" || user.status === "banned" ? (
              <button
                type="button"
                className="uam-item reactivate"
                onClick={(e) => handleUpdateStatus(e, "active")}
                disabled={isUpdatingStatus || userStore?.loading?.updateUserStatus}
                title="Reactivate this user account and restore login access"
              >
                <div className="uam-icon-box reactivate">
                  <FiPlayCircle size={12} />
                </div>
                <span className="uam-item-label">
                  {isUpdatingStatus ? "Reactivating..." : "Reactivate Account"}
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="uam-item suspend"
                onClick={(e) => handleUpdateStatus(e, "suspended")}
                disabled={isUpdatingStatus || userStore?.loading?.updateUserStatus}
                title="Temporarily suspend user account without deleting data"
              >
                <div className="uam-icon-box suspend">
                  <FiPauseCircle size={12} />
                </div>
                <span className="uam-item-label">
                  {isUpdatingStatus ? "Suspending..." : "Suspend Account"}
                </span>
              </button>
            )}

            {user.status !== "banned" && (
              <button
                type="button"
                className="uam-item ban"
                onClick={(e) => handleUpdateStatus(e, "banned")}
                disabled={isUpdatingStatus || userStore?.loading?.updateUserStatus}
                title="Permanently ban user account from logging in"
              >
                <div className="uam-icon-box ban">
                  <FiSlash size={12} />
                </div>
                <span className="uam-item-label">
                  {isUpdatingStatus ? "Banning..." : "Ban Account"}
                </span>
              </button>
            )}
          </div>
        </>
      )}

      <div className="uam-divider"></div>

      {/* ── Danger Zone / Access Control Section ── */}
      <div className="uam-section">
        {!isSelf && (
          <button
            type="button"
            className="uam-item revoke"
            onClick={handleRevokeSession}
            disabled={isRevoking || userStore?.loading?.revokeSession}
            title={
              !user.isVerified
                ? "Terminate all sessions and kick unverified user out to login screen"
                : "Force logout user and terminate all active sessions"
            }
          >
            <div className="uam-icon-box revoke">
              <FiLogOut size={12} />
            </div>
            <span className="uam-item-label">
              {isRevoking ? "Revoking..." : "Revoke (Kick to Login)"}
            </span>
          </button>
        )}

        <button
          type="button"
          className={`uam-item danger ${isSelf ? "disabled" : ""}`}
          onClick={(e) => {
            e.stopPropagation();
            if (isSelf) return;
            onClose();
            if (openDeleteModal) {
              openDeleteModal(user);
            } else {
              setDeleteId(user._id);
              setShowModal(true);
            }
          }}
          disabled={isSelf || userStore?.loading?.deleteUser}
          title={isSelf ? "You cannot delete your own account" : "Delete this user"}
        >
          <div className="uam-icon-box delete">
            <FiTrash2 size={12} />
          </div>
          <span className="uam-item-label">
            {isSelf
              ? "Cannot Delete Self"
              : userStore?.loading?.deleteUser
              ? "Deleting..."
              : "Delete User"}
          </span>
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default UserActionMenu;
