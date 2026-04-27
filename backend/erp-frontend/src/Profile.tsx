// src/pages/Profile.tsx
import { useState } from "react";

export default function Profile() {
  const [activeTab, setActiveTab] = useState("info");
  const [editing, setEditing] = useState(false);

  const [profile, setProfile] = useState({
    name: "Admin User",
    email: "admin@company.com",
    phone: "+92 300 1234567",
    role: "System Administrator",
    department: "IT Department",
    joinDate: "2024-01-01",
    location: "Lahore, Pakistan",
    bio: "Experienced system administrator with 5+ years in ERP systems.",
  });

  const [password, setPassword] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const handleProfileUpdate = () => {
    // Update profile API call
    alert("Profile updated successfully!");
    setEditing(false);
  };

  const handlePasswordChange = () => {
    if (password.new !== password.confirm) {
      alert("New passwords don't match!");
      return;
    }
    // Password change API call
    alert("Password changed successfully!");
    setPassword({ current: "", new: "", confirm: "" });
  };

  const recentActivity = [
    {
      action: "Created Purchase Order",
      ref: "PO-2025-001",
      timestamp: "2 hours ago",
      icon: "📦",
    },
    {
      action: "Approved Sales Order",
      ref: "SO-2025-045",
      timestamp: "5 hours ago",
      icon: "✅",
    },
    {
      action: "Updated Inventory Item",
      ref: "ITEM-123",
      timestamp: "1 day ago",
      icon: "📊",
    },
    {
      action: "Posted Journal Entry",
      ref: "JE-2025-089",
      timestamp: "2 days ago",
      icon: "💰",
    },
  ];

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <h2 className="fw-bold mb-1">My Profile</h2>
          <div className="text-muted">Manage your account information</div>
        </div>
      </div>

      {/* Profile Card */}
      <div className="col-md-4">
        <div className="card-box text-center">
          {/* Avatar */}
          <div className="profile-avatar-container">
            <div className="profile-avatar-large">
              {profile.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
            </div>
            <button className="avatar-upload-btn">
              📷 Change Photo
            </button>
          </div>

          {/* Name & Role */}
          <h3 className="profile-name mt-3">{profile.name}</h3>
          <div className="profile-role">{profile.role}</div>
          <div className="profile-email">{profile.email}</div>

          {/* Stats */}
          <div className="profile-stats mt-4">
            <div className="stat-item">
              <div className="stat-value">156</div>
              <div className="stat-label">Orders Created</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">89</div>
              <div className="stat-label">Items Modified</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">42</div>
              <div className="stat-label">Reports Generated</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-4">
            <button className="btn btn-outline-primary w-100 mb-2">
              Download My Data
            </button>
            <button className="btn btn-outline-danger w-100">
              Deactivate Account
            </button>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="col-md-8">
        <div className="card-box p-0">
          {/* Tabs */}
          <div className="profile-tabs">
            <button
              className={`profile-tab ${activeTab === "info" ? "active" : ""}`}
              onClick={() => setActiveTab("info")}
            >
              Personal Info
            </button>
            <button
              className={`profile-tab ${activeTab === "security" ? "active" : ""}`}
              onClick={() => setActiveTab("security")}
            >
              Security
            </button>
            <button
              className={`profile-tab ${activeTab === "activity" ? "active" : ""}`}
              onClick={() => setActiveTab("activity")}
            >
              Activity Log
            </button>
          </div>

          {/* Tab Content */}
          <div className="profile-content">
            {/* PERSONAL INFO TAB */}
            {activeTab === "info" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h4 className="mb-0">Personal Information</h4>
                  {!editing ? (
                    <button
                      className="btn btn-primary"
                      onClick={() => setEditing(true)}
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => setEditing(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleProfileUpdate}
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>

                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      disabled={!editing}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({ ...profile, email: e.target.value })
                      }
                      disabled={!editing}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      disabled={!editing}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Department</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.department}
                      onChange={(e) =>
                        setProfile({ ...profile, department: e.target.value })
                      }
                      disabled={!editing}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Role</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.role}
                      disabled
                    />
                    <small className="text-muted">
                      Contact admin to change role
                    </small>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Join Date</label>
                    <input
                      type="text"
                      className="form-control"
                      value={new Date(profile.joinDate).toLocaleDateString()}
                      disabled
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile.location}
                      onChange={(e) =>
                        setProfile({ ...profile, location: e.target.value })
                      }
                      disabled={!editing}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Bio</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={profile.bio}
                      onChange={(e) =>
                        setProfile({ ...profile, bio: e.target.value })
                      }
                      disabled={!editing}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === "security" && (
              <div>
                <h4 className="mb-4">Security Settings</h4>

                <div className="security-section">
                  <h5>Change Password</h5>
                  <div className="row g-3 mt-2">
                    <div className="col-12">
                      <label className="form-label">Current Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={password.current}
                        onChange={(e) =>
                          setPassword({ ...password, current: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={password.new}
                        onChange={(e) =>
                          setPassword({ ...password, new: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Confirm New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={password.confirm}
                        onChange={(e) =>
                          setPassword({ ...password, confirm: e.target.value })
                        }
                      />
                    </div>

                    <div className="col-12">
                      <button
                        className="btn btn-primary"
                        onClick={handlePasswordChange}
                      >
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>

                <hr className="my-4" />

                <div className="security-section">
                  <h5>Two-Factor Authentication</h5>
                  <p className="text-muted">
                    Add an extra layer of security to your account
                  </p>
                  <button className="btn btn-outline-primary">
                    Enable 2FA
                  </button>
                </div>

                <hr className="my-4" />

                <div className="security-section">
                  <h5>Login History</h5>
                  <div className="login-history">
                    <div className="login-item">
                      <div className="login-info">
                        <strong>Windows • Chrome</strong>
                        <div className="text-muted small">
                          Lahore, Pakistan • 192.168.1.100
                        </div>
                        <div className="text-muted small">
                          January 1, 2026 at 6:58 AM
                        </div>
                      </div>
                      <span className="badge bg-success">Current</span>
                    </div>
                    <div className="login-item">
                      <div className="login-info">
                        <strong>Windows • Chrome</strong>
                        <div className="text-muted small">
                          Lahore, Pakistan • 192.168.1.100
                        </div>
                        <div className="text-muted small">
                          December 31, 2025 at 11:30 PM
                        </div>
                      </div>
                      <span className="badge bg-secondary">Past</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVITY LOG TAB */}
            {activeTab === "activity" && (
              <div>
                <h4 className="mb-4">Recent Activity</h4>

                <div className="activity-list">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon">{activity.icon}</div>
                      <div className="activity-content">
                        <div className="activity-action">{activity.action}</div>
                        <div className="activity-ref">
                          Reference: <strong>{activity.ref}</strong>
                        </div>
                        <div className="activity-time">{activity.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="btn btn-outline-primary w-100 mt-3">
                  Load More Activity
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .profile-avatar-container {
          position: relative;
          display: inline-block;
        }

        .profile-avatar-large {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0066cc, #0052a3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: 600;
          color: white;
          margin: 0 auto;
        }

        .avatar-upload-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 20px;
          padding: 6px 12px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .avatar-upload-btn:hover {
          background: #f9fafb;
          border-color: #0066cc;
        }

        .profile-name {
          font-size: 22px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .profile-role {
          color: #0066cc;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .profile-email {
          color: #6b7280;
          font-size: 14px;
        }

        .profile-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 700;
          color: #0066cc;
        }

        .stat-label {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }

        .profile-tabs {
          display: flex;
          border-bottom: 2px solid #e5e7eb;
        }

        .profile-tab {
          flex: 1;
          padding: 16px;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s;
          margin-bottom: -2px;
        }

        .profile-tab:hover {
          color: #1f2937;
          background: #f9fafb;
        }

        .profile-tab.active {
          color: #0066cc;
          border-bottom-color: #0066cc;
        }

        .profile-content {
          padding: 24px;
        }

        .security-section {
          margin-bottom: 24px;
        }

        .security-section h5 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .login-history {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .login-item {
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e5e7eb;
        }

        .login-item:last-child {
          border-bottom: none;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .activity-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .activity-icon {
          font-size: 32px;
          flex-shrink: 0;
        }

        .activity-content {
          flex: 1;
        }

        .activity-action {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .activity-ref {
          color: #6b7280;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .activity-time {
          color: #9ca3af;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}