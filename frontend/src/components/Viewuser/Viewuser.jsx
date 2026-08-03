/* eslint-disable react-refresh/only-export-components */
import "./ViewUser.css";
import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";
import AppLayout from "../../components/AppLayout/AppLayout";

import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaUserTag,
  FaCheckCircle,
  FaVenusMars,
  FaBirthdayCake,
  FaGlobe,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaEdit,
} from "react-icons/fa";

function ViewUser() {
  const { id } = useParams();

  const { userStore } = useStore();

  useEffect(() => {
    userStore.fetchUserById(id);
  }, [id, userStore]);

  const user = userStore.editUser || {};
  const loading = userStore.loading.fetchUserById || false;

  return (
    <AppLayout title="User Details" subtitle="View complete user information">
      <div className="userview-page">
        <div className="userview-container">
          <Link to="/admin/users" className="userview-back-link">
            <FaArrowLeft />
            <span>Back to Users</span>
          </Link>
          <div className="userview-header">
            <div className="userview-image">
              {loading ? (
                <div className="skeleton skeleton-avatar"></div>
              ) : (
                <img
                  src={
                    user.profilephoto
                      ? `${import.meta.env.VITE_API_URL}/uploads/${user.profilephoto}`
                      : "https://ui-avatars.com/api/?name=User"
                  }
                  alt={user.name}
                  onError={(e) => {
                    e.target.src = "https://ui-avatars.com/api/?name=User";
                  }}
                />
              )}
            </div>

            <h2 className="userview-name">
              {loading ? (
                <div className="skeleton skeleton-name"></div>
              ) : (
                user.name
              )}
            </h2>

            <div className="userview-badges">
              {loading ? (
                <>
                  <div className="skeleton skeleton-badge"></div>
                  <div className="skeleton skeleton-badge"></div>
                </>
              ) : (
                <>
                  {user.isVerified && (
                    <span className="badge verified-badge">
                      <FaCheckCircle />
                      Verified
                    </span>
                  )}

                  <span className="badge joined-badge">
                    <FaCalendarAlt />
                    Joined{" "}
                    {new Date(user.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="userview-info-section">
            {/* Left */}
            <div className="userview-card">
              <h3>Account Information</h3>

              <div className="userview-grid">
                {/* Name */}
                <div className="userview-item">
                  <FaUser />
                  <div>
                    <span>Name</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value"></div>
                      ) : (
                        user.name
                      )}
                    </strong>
                  </div>
                </div>

                {/* Email */}
                <div className="userview-item">
                  <FaEnvelope />
                  <div>
                    <span>Email</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value skeleton-email"></div>
                      ) : (
                        user.email
                      )}
                    </strong>
                  </div>
                </div>

                {/* Phone */}
                <div className="userview-item">
                  <FaPhone />
                  <div>
                    <span>Phone</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value"></div>
                      ) : (
                        user.phone || "Not Added"
                      )}
                    </strong>
                  </div>
                </div>

                {/* Role */}
                <div className="userview-item">
                  <FaUserTag />
                  <div>
                    <span>Role</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-small"></div>
                      ) : user.role ? (
                        user.role.charAt(0).toUpperCase() + user.role.slice(1)
                      ) : (
                        "User"
                      )}
                    </strong>
                  </div>
                </div>

                {/* Status */}
                <div className="userview-item">
                  <FaCheckCircle />
                  <div>
                    <span>Status</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-small"></div>
                      ) : user.isVerified ? (
                        "Verified"
                      ) : (
                        "Not Verified"
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="userview-card">
              <h3>Personal Information</h3>

              <div className="userview-grid">
                {/* Gender */}
                <div className="userview-item">
                  <FaVenusMars />
                  <div>
                    <span>Gender</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-small"></div>
                      ) : (
                        user.gender || "Not Added"
                      )}
                    </strong>
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="userview-item">
                  <FaBirthdayCake />
                  <div>
                    <span>Date of Birth</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value"></div>
                      ) : user.dob ? (
                        new Date(user.dob).toLocaleDateString("en-IN")
                      ) : (
                        "Not Added"
                      )}
                    </strong>
                  </div>
                </div>

                {/* Country */}
                <div className="userview-item">
                  <FaGlobe />
                  <div>
                    <span>Country</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value"></div>
                      ) : (
                        user.country || "Not Added"
                      )}
                    </strong>
                  </div>
                </div>

                {/* State */}
                <div className="userview-item">
                  <FaMapMarkerAlt />
                  <div>
                    <span>State</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value"></div>
                      ) : (
                        user.state || "Not Added"
                      )}
                    </strong>
                  </div>
                </div>

                {/* City */}
                <div className="userview-item">
                  <FaMapMarkerAlt />
                  <div>
                    <span>City</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value"></div>
                      ) : (
                        user.city || "Not Added"
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="userview-card">
            <h3>About Me</h3>

            <div className="userview-about">
              {loading ? (
                <div className="skeleton-bio">
                  <div className="skeleton skeleton-line"></div>

                  <div className="skeleton skeleton-line"></div>

                  <div className="skeleton skeleton-line short"></div>
                </div>
              ) : user.bio ? (
                <p className="userview-bio">{user.bio}</p>
              ) : (
                <p className="empty-bio">This user hasn't added a bio yet.</p>
              )}
            </div>
          </div>
          <div className="userview-bottom-section">
            <div className="userview-card">
              <h3>System Information</h3>

              <div className="userview-grid">
                <div className="userview-item">
                  <FaCalendarAlt />
                  <div>
                    <span>Joined Date</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value"></div>
                      ) : user.createdAt ? (
                        new Date(user.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      ) : (
                        "N/A"
                      )}
                    </strong>
                  </div>
                </div>

                <div className="userview-item">
                  <FaClock />
                  <div>
                    <span>Last Login</span>
                    <strong>
                      {loading ? (
                        <div className="skeleton skeleton-value"></div>
                      ) : user.lastLogin ? (
                        new Date(user.lastLogin).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      ) : (
                        "Never"
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="userview-button-group">
            {loading ? (
              <>
                <div className="skeleton skeleton-btn"></div>

                <div className="skeleton skeleton-btn"></div>
              </>
            ) : (
              <>
                <Link to="/admin/users" className="userview-back-btn">
                  Back
                </Link>

                <Link
                  to={`/admin/users/${user._id}/userEdit`}
                  className="userview-edit-btn"
                >
                  <FaEdit />
                  Edit User
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default observer(ViewUser);
