import "./UserActionMenu.css";
import { useLayoutEffect, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";
import {
  useFloating,
  offset,
  shift,
  autoUpdate,
} from "@floating-ui/react";

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
  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    middleware: [
      offset(8),
      shift({
        padding: 8,
        crossAxis: false,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  useLayoutEffect(() => {
    if (reference) {
      refs.setReference(reference);
    }
  }, [reference, refs]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        refs.floating.current &&
        !refs.floating.current.contains(e.target) &&
        reference &&
        !reference.contains(e.target)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [reference, refs, onClose]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!reference) {
    return null;
  }

  return createPortal(
    <div
      ref={refs.setFloating}
      className="dropdown-menu"
      style={floatingStyles}
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
        <FiEye size={17} />
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
        <FiEdit2 size={17} />
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
          disabled={userStore.loading.makeAdmin}
        >
          👑
          {userStore.loading.makeAdmin ? " Updating..." : " Make Admin"}
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
        disabled={userStore.loading.deleteUser}
      >
        <FiTrash2 size={17} />
        {userStore.loading.deleteUser ? " Deleting..." : " Delete User"}
      </button>
    </div>,
    document.body,
  );
}

export default UserActionMenu;
