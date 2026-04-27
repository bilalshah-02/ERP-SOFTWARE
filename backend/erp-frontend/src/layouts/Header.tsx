// src/layouts/Header.tsx
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfile(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      title: "New Purchase Order",
      message: "PO-2025-001 has been created",
      time: "2 minutes ago",
      unread: true,
      type: "purchase",
    },
    {
      id: 2,
      title: "Low Stock Alert",
      message: "Item ABC-123 is below minimum level",
      time: "1 hour ago",
      unread: true,
      type: "inventory",
    },
    {
      id: 3,
      title: "Payment Received",
      message: "Customer payment of PKR 50,000 received",
      time: "3 hours ago",
      unread: false,
      type: "sales",
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  // Mock user data
  const user = {
    name: "Admin User",
    email: "admin@company.com",
    role: "System Administrator",
    avatar: null, // Will show initials if null
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      // Clear session/tokens here
      navigate("/login");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <header className="erp-header">
      <div className="header-container">
        {/* Left: Logo & Company Name */}
        <div className="header-left">
          <div className="logo-section" onClick={() => navigate("/")}>
            <div className="logo-icon">📊</div>
            <div className="company-info">
              <h1 className="company-name">ERP System</h1>
              <span className="environment-badge">DEV</span>
            </div>
          </div>
        </div>

        {/* Center: Search */}
        <div className="header-center">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search orders, items, customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              🔍
            </button>
          </form>
        </div>

        {/* Right: Actions */}
        <div className="header-right">
          {/* Notifications */}
          <div className="header-item" ref={notifRef}>
            <button
              className="icon-button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
              }}
            >
              <span className="icon">🔔</span>
              {unreadCount > 0 && (
                <span className="badge">{unreadCount}</span>
              )}
            </button>

            {showNotifications && (
              <div className="dropdown notifications-dropdown">
                <div className="dropdown-header">
                  <h3>Notifications</h3>
                  <button className="text-link">Mark all as read</button>
                </div>
                <div className="dropdown-body">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`notification-item ${
                        notif.unread ? "unread" : ""
                      }`}
                    >
                      <div className="notif-icon">{getNotifIcon(notif.type)}</div>
                      <div className="notif-content">
                        <div className="notif-title">{notif.title}</div>
                        <div className="notif-message">{notif.message}</div>
                        <div className="notif-time">{notif.time}</div>
                      </div>
                      {notif.unread && <div className="unread-dot"></div>}
                    </div>
                  ))}
                </div>
                <div className="dropdown-footer">
                  <button
                    className="view-all-btn"
                    onClick={() => {
                      navigate("/notifications");
                      setShowNotifications(false);
                    }}
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="header-item">
            <button
              className="icon-button"
              onClick={() => navigate("/settings")}
            >
              <span className="icon">⚙️</span>
            </button>
          </div>

          {/* Profile */}
          <div className="header-item" ref={profileRef}>
            <button
              className="profile-button"
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="avatar" />
              ) : (
                <div className="avatar-initials">{getInitials(user.name)}</div>
              )}
              <span className="user-name">{user.name}</span>
              <span className="dropdown-arrow">▼</span>
            </button>

            {showProfile && (
              <div className="dropdown profile-dropdown">
                <div className="dropdown-header">
                  <div className="profile-header-content">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="avatar-large" />
                    ) : (
                      <div className="avatar-initials-large">
                        {getInitials(user.name)}
                      </div>
                    )}
                    <div>
                      <div className="profile-name">{user.name}</div>
                      <div className="profile-email">{user.email}</div>
                      <div className="profile-role">{user.role}</div>
                    </div>
                  </div>
                </div>
                <div className="dropdown-body">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate("/profile");
                      setShowProfile(false);
                    }}
                  >
                    <span className="item-icon">👤</span>
                    My Profile
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate("/settings");
                      setShowProfile(false);
                    }}
                  >
                    <span className="item-icon">⚙️</span>
                    Settings
                  </button>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate("/help");
                      setShowProfile(false);
                    }}
                  >
                    <span className="item-icon">❓</span>
                    Help & Support
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <span className="item-icon">🚪</span>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .erp-header {
          background: linear-gradient(135deg, #001f4d 0%, #003d82 100%);
          color: white;
          height: 60px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .header-container {
          max-width: 100%;
          height: 100%;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        /* LEFT SECTION */
        .header-left {
          flex-shrink: 0;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .logo-section:hover {
          opacity: 0.9;
        }

        .logo-icon {
          font-size: 32px;
          line-height: 1;
        }

        .company-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .company-name {
          font-size: 18px;
          font-weight: 700;
          margin: 0;
          color: white;
        }

        .environment-badge {
          background: rgba(255, 255, 255, 0.2);
          color: #b3e5ff;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 3px;
          width: fit-content;
        }

        /* CENTER SECTION */
        .header-center {
          flex: 1;
          max-width: 600px;
        }

        .search-form {
          display: flex;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 10px 15px;
          color: white;
          font-size: 14px;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        .search-input:focus {
          outline: none;
        }

        .search-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          padding: 0 15px;
          cursor: pointer;
          font-size: 16px;
          transition: background 0.2s;
        }

        .search-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        /* RIGHT SECTION */
        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }

        .header-item {
          position: relative;
        }

        .icon-button {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: background 0.2s;
        }

        .icon-button:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .icon {
          font-size: 20px;
        }

        .badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: #ff4444;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 10px;
          min-width: 18px;
          text-align: center;
        }

        .profile-button {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          padding: 6px 12px 6px 6px;
          border-radius: 25px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: background 0.2s;
          color: white;
        }

        .profile-button:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .avatar,
        .avatar-initials {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-initials {
          background: #0066cc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          color: white;
        }

        .user-name {
          font-size: 14px;
          font-weight: 500;
        }

        .dropdown-arrow {
          font-size: 10px;
          opacity: 0.7;
        }

        /* DROPDOWNS */
        .dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          min-width: 300px;
          z-index: 1001;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          padding: 15px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dropdown-header h3 {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .text-link {
          background: none;
          border: none;
          color: #0066cc;
          font-size: 13px;
          cursor: pointer;
          padding: 0;
        }

        .text-link:hover {
          text-decoration: underline;
        }

        .dropdown-body {
          max-height: 400px;
          overflow-y: auto;
        }

        .dropdown-footer {
          padding: 10px;
          border-top: 1px solid #e5e7eb;
        }

        .view-all-btn {
          width: 100%;
          padding: 8px;
          background: #f3f4f6;
          border: none;
          border-radius: 4px;
          color: #1f2937;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .view-all-btn:hover {
          background: #e5e7eb;
        }

        /* NOTIFICATIONS */
        .notification-item {
          padding: 12px 15px;
          border-bottom: 1px solid #f3f4f6;
          display: flex;
          gap: 12px;
          cursor: pointer;
          transition: background 0.2s;
          position: relative;
        }

        .notification-item:hover {
          background: #f9fafb;
        }

        .notification-item.unread {
          background: #eff6ff;
        }

        .notif-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .notif-content {
          flex: 1;
          min-width: 0;
        }

        .notif-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 2px;
        }

        .notif-message {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .notif-time {
          font-size: 12px;
          color: #9ca3af;
        }

        .unread-dot {
          width: 8px;
          height: 8px;
          background: #0066cc;
          border-radius: 50%;
          position: absolute;
          top: 18px;
          right: 15px;
        }

        /* PROFILE DROPDOWN */
        .profile-header-content {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .avatar-large,
        .avatar-initials-large {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-initials-large {
          background: #0066cc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 600;
          color: white;
        }

        .profile-name {
          font-size: 15px;
          font-weight: 600;
          color: #1f2937;
        }

        .profile-email {
          font-size: 13px;
          color: #6b7280;
          margin-top: 2px;
        }

        .profile-role {
          font-size: 12px;
          color: #9ca3af;
          margin-top: 2px;
        }

        .dropdown-item {
          width: 100%;
          padding: 10px 15px;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: background 0.2s;
          color: #1f2937;
          font-size: 14px;
        }

        .dropdown-item:hover {
          background: #f3f4f6;
        }

        .dropdown-item.logout {
          color: #dc2626;
        }

        .dropdown-item.logout:hover {
          background: #fee2e2;
        }

        .item-icon {
          font-size: 18px;
        }

        .dropdown-divider {
          height: 1px;
          background: #e5e7eb;
          margin: 8px 0;
        }

        /* Scrollbar */
        .dropdown-body::-webkit-scrollbar {
          width: 6px;
        }

        .dropdown-body::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
      `}</style>
    </header>
  );
}

function getNotifIcon(type: string) {
  const icons: Record<string, string> = {
    purchase: "📦",
    sales: "💰",
    inventory: "📊",
    production: "🏭",
    financial: "💵",
  };
  return icons[type] || "📌";
}