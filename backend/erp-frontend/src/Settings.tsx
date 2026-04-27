// src/pages/Settings.tsx
import { useState } from "react";
import { useSettings } from "./contexts/SettingsContext";

export default function Settings() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = async (key: string, value: any) => {
    await updateSettings({ [key]: value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(settings);
      alert("✅ Settings saved successfully!");
    } catch (error) {
      alert("❌ Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm("Reset all settings to default? This cannot be undone.")) {
      setIsSaving(true);
      try {
        await resetSettings();
        alert("✅ Settings reset to default!");
      } catch (error) {
        alert("❌ Error resetting settings");
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="row g-4">
      {/* Header */}
      <div className="col-12">
        <div className="card-box">
          <h2 className="fw-bold mb-1">Settings</h2>
          <div className="text-muted">
            Customize your ERP experience • Changes are saved automatically
          </div>
        </div>
      </div>

      {/* Settings Container */}
      <div className="col-12">
        <div className="card-box p-0">
          <div className="settings-container">
            {/* Tabs Sidebar */}
            <div className="settings-sidebar">
              <button
                className={`settings-tab ${
                  activeTab === "general" ? "active" : ""
                }`}
                onClick={() => setActiveTab("general")}
              >
                <span className="tab-icon">⚙️</span>
                General
              </button>
              <button
                className={`settings-tab ${
                  activeTab === "display" ? "active" : ""
                }`}
                onClick={() => setActiveTab("display")}
              >
                <span className="tab-icon">🎨</span>
                Display
              </button>
              <button
                className={`settings-tab ${
                  activeTab === "notifications" ? "active" : ""
                }`}
                onClick={() => setActiveTab("notifications")}
              >
                <span className="tab-icon">🔔</span>
                Notifications
              </button>
              <button
                className={`settings-tab ${
                  activeTab === "system" ? "active" : ""
                }`}
                onClick={() => setActiveTab("system")}
              >
                <span className="tab-icon">💻</span>
                System
              </button>
              <button
                className={`settings-tab ${
                  activeTab === "security" ? "active" : ""
                }`}
                onClick={() => setActiveTab("security")}
              >
                <span className="tab-icon">🔒</span>
                Security
              </button>
            </div>

            {/* Settings Content */}
            <div className="settings-content">
              {/* GENERAL TAB */}
              {activeTab === "general" && (
                <div className="settings-section">
                  <h3 className="section-title">General Settings</h3>

                  <div className="settings-group">
                    <label className="setting-label">Language</label>
                    <select
                      className="form-select"
                      value={settings.language}
                      onChange={(e) => handleChange("language", e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="ur">Urdu (اردو)</option>
                      <option value="ar">Arabic (العربية)</option>
                    </select>
                    <small className="setting-help">
                      Select your preferred language
                      {settings.language !== "en" && (
                        <span className="text-warning">
                          {" "}• Translation in progress
                        </span>
                      )}
                    </small>
                  </div>

                  <div className="settings-group">
                    <label className="setting-label">Timezone</label>
                    <select
                      className="form-select"
                      value={settings.timezone}
                      onChange={(e) => handleChange("timezone", e.target.value)}
                    >
                      <option value="Asia/Karachi">
                        Pakistan Standard Time (PKT, UTC+5)
                      </option>
                      <option value="Asia/Dubai">
                        Gulf Standard Time (GST, UTC+4)
                      </option>
                      <option value="Asia/Riyadh">
                        Arabia Standard Time (AST, UTC+3)
                      </option>
                      <option value="UTC">
                        Coordinated Universal Time (UTC)
                      </option>
                    </select>
                    <small className="setting-help">
                      All timestamps will be displayed in this timezone
                    </small>
                  </div>

                  <div className="settings-group">
                    <label className="setting-label">Date Format</label>
                    <select
                      className="form-select"
                      value={settings.dateFormat}
                      onChange={(e) => handleChange("dateFormat", e.target.value)}
                    >
                      <option value="DD/MM/YYYY">
                        DD/MM/YYYY (31/12/2025)
                      </option>
                      <option value="MM/DD/YYYY">
                        MM/DD/YYYY (12/31/2025)
                      </option>
                      <option value="YYYY-MM-DD">
                        YYYY-MM-DD (2025-12-31)
                      </option>
                    </select>
                    <small className="setting-help">
                      How dates are displayed throughout the system
                    </small>
                  </div>

                  <div className="settings-group">
                    <label className="setting-label">Currency</label>
                    <select
                      className="form-select"
                      value={settings.currency}
                      onChange={(e) => handleChange("currency", e.target.value)}
                    >
                      <option value="PKR">Pakistani Rupee (PKR)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="AED">UAE Dirham (AED)</option>
                      <option value="SAR">Saudi Riyal (SAR)</option>
                      <option value="EUR">Euro (EUR)</option>
                      <option value="GBP">British Pound (GBP)</option>
                    </select>
                    <small className="setting-help">
                      Default currency for financial transactions
                    </small>
                  </div>

                  {/* Preview */}
                  <div className="alert alert-info mt-4">
                    <strong>Preview:</strong>
                    <div className="mt-2">
                      Date: {new Date().toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }).replace(/\//g, settings.dateFormat.includes("-") ? "-" : "/")}
                      <br />
                      Amount: {settings.currency}{" "}
                      {(50000).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* DISPLAY TAB */}
              {activeTab === "display" && (
                <div className="settings-section">
                  <h3 className="section-title">Display Settings</h3>

                  <div className="settings-group">
                    <label className="setting-label">Theme</label>
                    <div className="theme-selector">
                      <button
                        className={`theme-option ${
                          settings.theme === "light" ? "active" : ""
                        }`}
                        onClick={() => handleChange("theme", "light")}
                      >
                        <div className="theme-preview light"></div>
                        <span>☀️ Light</span>
                      </button>
                      <button
                        className={`theme-option ${
                          settings.theme === "dark" ? "active" : ""
                        }`}
                        onClick={() => handleChange("theme", "dark")}
                      >
                        <div className="theme-preview dark"></div>
                        <span>🌙 Dark</span>
                      </button>
                      <button
                        className={`theme-option ${
                          settings.theme === "auto" ? "active" : ""
                        }`}
                        onClick={() => handleChange("theme", "auto")}
                      >
                        <div className="theme-preview auto"></div>
                        <span>🔄 Auto</span>
                      </button>
                    </div>
                    <small className="setting-help">
                      {settings.theme === "auto" && "Automatically switches based on system preference"}
                      {settings.theme === "dark" && "⚠️ Dark theme is experimental"}
                    </small>
                  </div>

                  <div className="settings-group">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={settings.sidebarCollapsed}
                        onChange={(e) =>
                          handleChange("sidebarCollapsed", e.target.checked)
                        }
                      />
                      <label className="form-check-label">
                        <strong>Collapse Sidebar by Default</strong>
                        <div className="setting-help">
                          Start with a collapsed sidebar for more screen space
                          {settings.sidebarCollapsed && " • Refresh page to see effect"}
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="settings-group">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={settings.compactMode}
                        onChange={(e) =>
                          handleChange("compactMode", e.target.checked)
                        }
                      />
                      <label className="form-check-label">
                        <strong>Compact Mode</strong>
                        <div className="setting-help">
                          Reduce spacing for a more compact interface • See more data on screen
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="alert alert-success mt-4">
                    <strong>✨ Active Display Settings:</strong>
                    <ul className="mb-0 mt-2">
                      <li>Theme: {settings.theme}</li>
                      <li>Sidebar: {settings.sidebarCollapsed ? "Collapsed" : "Expanded"}</li>
                      <li>Mode: {settings.compactMode ? "Compact" : "Regular"}</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* NOTIFICATIONS TAB */}
              {activeTab === "notifications" && (
                <div className="settings-section">
                  <h3 className="section-title">Notification Preferences</h3>

                  <div className="settings-group">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={settings.emailNotifications}
                        onChange={(e) =>
                          handleChange("emailNotifications", e.target.checked)
                        }
                      />
                      <label className="form-check-label">
                        <strong>📧 Email Notifications</strong>
                        <div className="setting-help">
                          Receive notifications via email
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="settings-group">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={settings.pushNotifications}
                        onChange={(e) =>
                          handleChange("pushNotifications", e.target.checked)
                        }
                      />
                      <label className="form-check-label">
                        <strong>🔔 Push Notifications</strong>
                        <div className="setting-help">
                          Receive browser push notifications
                        </div>
                      </label>
                    </div>
                  </div>

                  <hr className="my-4" />

                  <h4 className="subsection-title">Notify Me About:</h4>

                  <div className="settings-group">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={settings.notifyPurchaseOrders}
                        onChange={(e) =>
                          handleChange("notifyPurchaseOrders", e.target.checked)
                        }
                      />
                      <label className="form-check-label">
                        📦 Purchase Orders (Created, Approved, Received)
                      </label>
                    </div>
                  </div>

                  <div className="settings-group">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={settings.notifySalesOrders}
                        onChange={(e) =>
                          handleChange("notifySalesOrders", e.target.checked)
                        }
                      />
                      <label className="form-check-label">
                        💼 Sales Orders (Created, Shipped, Invoiced)
                      </label>
                    </div>
                  </div>

                  <div className="settings-group">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={settings.notifyLowStock}
                        onChange={(e) =>
                          handleChange("notifyLowStock", e.target.checked)
                        }
                      />
                      <label className="form-check-label">
                        ⚠️ Low Stock Alerts (Items below minimum level)
                      </label>
                    </div>
                  </div>

                  <div className="settings-group">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={settings.notifyPayments}
                        onChange={(e) =>
                          handleChange("notifyPayments", e.target.checked)
                        }
                      />
                      <label className="form-check-label">
                        💰 Payment Confirmations (Received & Made)
                      </label>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="alert alert-info mt-4">
                    <strong>📊 You will receive notifications for:</strong>
                    <div className="mt-2">
                      {[
                        settings.notifyPurchaseOrders && "Purchase Orders",
                        settings.notifySalesOrders && "Sales Orders",
                        settings.notifyLowStock && "Low Stock",
                        settings.notifyPayments && "Payments",
                      ]
                        .filter(Boolean)
                        .join(", ") || "None"}
                    </div>
                  </div>
                </div>
              )}

              {/* SYSTEM TAB */}
              {activeTab === "system" && (
                <div className="settings-section">
                  <h3 className="section-title">System Settings</h3>

                  <div className="settings-group">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={settings.autoSave}
                        onChange={(e) =>
                          handleChange("autoSave", e.target.checked)
                        }
                      />
                      <label className="form-check-label">
                        <strong>💾 Auto-Save Drafts</strong>
                        <div className="setting-help">
                          Automatically save form data as you type (prevents data loss)
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="settings-group">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={settings.confirmDelete}
                        onChange={(e) =>
                          handleChange("confirmDelete", e.target.checked)
                        }
                      />
                      <label className="form-check-label">
                        <strong>⚠️ Confirm Before Delete</strong>
                        <div className="setting-help">
                          Show confirmation dialog before deleting items
                          {!settings.confirmDelete && (
                            <span className="text-danger">
                              {" "}• Disabled: Items will delete immediately!
                            </span>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="settings-group">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={settings.showTutorials}
                        onChange={(e) =>
                          handleChange("showTutorials", e.target.checked)
                        }
                      />
                      <label className="form-check-label">
                        <strong>💡 Show Tutorials</strong>
                        <div className="setting-help">
                          Display helpful tooltips and tutorials for new features
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="alert alert-warning mt-4">
                    <strong>🔒 System Behavior:</strong>
                    <ul className="mb-0 mt-2">
                      <li>Auto-save: {settings.autoSave ? "Enabled ✓" : "Disabled ✗"}</li>
                      <li>Delete Confirmation: {settings.confirmDelete ? "Enabled ✓" : "Disabled ✗"}</li>
                      <li>Tutorials: {settings.showTutorials ? "Shown ✓" : "Hidden ✗"}</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* SECURITY TAB */}
              {activeTab === "security" && (
                <div className="settings-section">
                  <h3 className="section-title">Security Settings</h3>

                  <div className="settings-group">
                    <label className="setting-label">Change Password</label>
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => alert("Password change functionality coming soon!")}
                    >
                      🔐 Update Password
                    </button>
                    <small className="setting-help">
                      Change your account password
                    </small>
                  </div>

                  <div className="settings-group">
                    <label className="setting-label">Two-Factor Authentication</label>
                    <button 
                      className="btn btn-outline-primary"
                      onClick={() => alert("2FA setup coming soon!")}
                    >
                      🔒 Enable 2FA
                    </button>
                    <small className="setting-help">
                      Add an extra layer of security to your account
                    </small>
                  </div>

                  <div className="settings-group">
                    <label className="setting-label">Active Sessions</label>
                    <div className="session-list">
                      <div className="session-item">
                        <div className="session-info">
                          <strong>💻 Current Session</strong>
                          <div className="text-muted small">
                            {navigator.userAgent.includes("Windows") ? "Windows" : "Other OS"} • 
                            {navigator.userAgent.includes("Chrome") ? " Chrome" : 
                             navigator.userAgent.includes("Firefox") ? " Firefox" : 
                             navigator.userAgent.includes("Safari") ? " Safari" : " Other Browser"} • 
                            Lahore, Pakistan
                          </div>
                          <div className="text-muted small">
                            Last active: Just now
                          </div>
                        </div>
                        <span className="badge bg-success">Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="alert alert-info mt-4">
                    <strong>🔐 Security Status:</strong>
                    <ul className="mb-0 mt-2">
                      <li>Password: Set ✓</li>
                      <li>Two-Factor Auth: Not enabled ✗</li>
                      <li>Active Sessions: 1</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="settings-actions">
                <button 
                  className="btn btn-primary" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "💾 Save All Changes"}
                </button>
                <button 
                  className="btn btn-outline-secondary" 
                  onClick={handleReset}
                  disabled={isSaving}
                >
                  🔄 Reset to Default
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .settings-container {
          display: flex;
          min-height: 500px;
        }

        .settings-sidebar {
          width: 240px;
          border-right: 1px solid #e5e7eb;
          padding: 20px 0;
          flex-shrink: 0;
        }

        .settings-tab {
          width: 100%;
          padding: 12px 20px;
          background: none;
          border: none;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #6b7280;
          font-size: 14px;
          transition: all 0.2s;
          border-left: 3px solid transparent;
        }

        .settings-tab:hover {
          background: #f9fafb;
          color: #1f2937;
        }

        .settings-tab.active {
          background: #eff6ff;
          color: #0066cc;
          border-left-color: #0066cc;
          font-weight: 500;
        }

        .tab-icon {
          font-size: 18px;
        }

        .settings-content {
          flex: 1;
          padding: 30px;
        }

        .settings-section {
          max-width: 600px;
        }

        .section-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 24px;
        }

        .subsection-title {
          font-size: 15px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 16px;
        }

        .settings-group {
          margin-bottom: 24px;
        }

        .setting-label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .setting-help {
          display: block;
          color: #6b7280;
          font-size: 13px;
          margin-top: 4px;
        }

        .theme-selector {
          display: flex;
          gap: 12px;
        }

        .theme-option {
          flex: 1;
          padding: 12px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .theme-option:hover {
          border-color: #cbd5e1;
        }

        .theme-option.active {
          border-color: #0066cc;
          background: #eff6ff;
        }

        .theme-preview {
          width: 60px;
          height: 40px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
        }

        .theme-preview.light {
          background: linear-gradient(to bottom, #f9fafb 50%, white 50%);
        }

        .theme-preview.dark {
          background: linear-gradient(to bottom, #1f2937 50%, #111827 50%);
        }

        .theme-preview.auto {
          background: linear-gradient(135deg, #f9fafb 50%, #1f2937 50%);
        }

        .session-list {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
        }

        .session-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .settings-actions {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
        }

        /* Compact mode styles */
        body.compact-mode .card-box {
          padding: 12px !important;
        }

        body.compact-mode .table td,
        body.compact-mode .table th {
          padding: 6px !important;
          font-size: 13px !important;
        }

        body.compact-mode h2 {
          font-size: 20px !important;
          margin-bottom: 8px !important;
        }

        body.compact-mode .form-control,
        body.compact-mode .form-select {
          padding: 6px 10px !important;
          font-size: 13px !important;
        }
      `}</style>
    </div>
  );
}