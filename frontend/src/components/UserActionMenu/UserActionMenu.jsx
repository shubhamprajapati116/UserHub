/* eslint-disable react-hooks/set-state-in-effect */
import "./UserActionMenu.css";
import { useState, useLayoutEffect, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";

function UserActionMenu({
  reference,
  user,
  navigate,
  makeUserAdmin,
  setDeleteId,
  setShowModal,
  userStore,
  onClose,
}) {
  const menuRef = useRef(null);

  const calculatePosition = () => {
    if (!reference) return { top: 0, left: 0 };
    const rect = reference.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight || (user?.role !== "admin" ? 138 : 108);
    const menuWidth = menuRef.current?.offsetWidth || 142;

    // Align dropdown to the right edge of the 3-dots trigger button
    let left = rect.right - menuWidth;
    
    // Check available space
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top;
    if (spaceBelow >= menuHeight + 6 || spaceBelow >= spaceAbove) {
      // Open downwards right below the button
      top = rect.bottom + 4;
    } else {
      // Open upwards snuggly above the button
      top = rect.top - menuHeight - 4;
    }

    // Safety viewport clamping
    if (left < 10) left = 10;
    if (left + menuWidth > window.innerWidth - 10) {
      left = window.innerWidth - menuWidth - 10;
    }
    if (top < 10) top = 10;
    if (top + menuHeight > window.innerHeight - 10) {
      top = window.innerHeight - menuHeight - 10;
    }

    return { top, left };
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

    function handleScrollOrResize() {
      onClose();
    }

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [reference, onClose]);

  if (!reference) {
    return null;
  }

  return createPortal(
    <div
      ref={menuRef}
      className="dropdown-menu"
      style={{
        position: "fixed",
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="dropdown-item"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
          navigate(`/admin/users/${user._id}/view`);
        }}
      >
        <FiEye size={13} />
        <span>View Details</span>
      </button>

      <button
        className="dropdown-item"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
          navigate(`/admin/users/${user._id}/userEdit`);
        }}
      >
        <FiEdit2 size={13} />
        <span>Edit User</span>
      </button>

      {user.role !== "admin" && (
        <button
          className="dropdown-item"
          onClick={async (e) => {
            e.stopPropagation();
            try {
              await makeUserAdmin(user._id);
            } finally {
              onClose();
            }
          }}
          disabled={userStore?.loading?.makeAdmin}
        >
          <span style={{ fontSize: "11px", lineHeight: 1 }}>👑</span>
          <span>
            {userStore?.loading?.makeAdmin ? " Updating..." : " Make Admin"}
          </span>
        </button>
      )}

      <hr className="dropdown-divider" />

      <button
        className="dropdown-item danger"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
          setDeleteId(user._id);
          setShowModal(true);
        }}
        disabled={userStore?.loading?.deleteUser}
      >
        <FiTrash2 size={13} />
        <span>
          {userStore?.loading?.deleteUser ? " Deleting..." : " Delete User"}
        </span>
      </button>
    </div>,
    document.body,
  );
}

export default UserActionMenu;
