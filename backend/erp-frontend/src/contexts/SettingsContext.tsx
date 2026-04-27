// src/contexts/SettingsContext.tsx
import { createContext, useContext, useState, useEffect,  } from "react";
import type { ReactNode } from "react";
import { http } from "../api/http";

export interface UserSettings {
  // General
  language: string;
  timezone: string;
  dateFormat: string;
  currency: string;
  
  // Display
  theme: "light" | "dark" | "auto";
  sidebarCollapsed: boolean;
  compactMode: boolean;
  
  // Notifications
  emailNotifications: boolean;
  pushNotifications: boolean;
  notifyPurchaseOrders: boolean;
  notifySalesOrders: boolean;
  notifyLowStock: boolean;
  notifyPayments: boolean;
  
  // System
  autoSave: boolean;
  confirmDelete: boolean;
  showTutorials: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  language: "en",
  timezone: "Asia/Karachi",
  dateFormat: "DD/MM/YYYY",
  currency: "PKR",
  theme: "light",
  sidebarCollapsed: false,
  compactMode: false,
  emailNotifications: true,
  pushNotifications: true,
  notifyPurchaseOrders: true,
  notifySalesOrders: true,
  notifyLowStock: true,
  notifyPayments: true,
  autoSave: true,
  confirmDelete: true,
  showTutorials: true,
};

interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  // Load settings from backend or localStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Try to load from backend first
        const res = await http.get("/api/user/settings/");
        setSettings({ ...DEFAULT_SETTINGS, ...res.data });
      } catch (error) {
        // Fallback to localStorage
        const savedSettings = localStorage.getItem("userSettings");
        if (savedSettings) {
          setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Apply theme when it changes
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  // Apply compact mode when it changes
  useEffect(() => {
    if (settings.compactMode) {
      document.body.classList.add("compact-mode");
    } else {
      document.body.classList.remove("compact-mode");
    }
  }, [settings.compactMode]);

  // Apply sidebar collapsed state
  useEffect(() => {
    // Dispatch custom event for sidebar to listen
    window.dispatchEvent(
      new CustomEvent("sidebarCollapse", {
        detail: { collapsed: settings.sidebarCollapsed },
      })
    );
  }, [settings.sidebarCollapsed]);

  const applyTheme = (theme: "light" | "dark" | "auto") => {
    let effectiveTheme = theme;

    if (theme === "auto") {
      // Check system preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      effectiveTheme = prefersDark ? "dark" : "light";
    }

    document.documentElement.setAttribute("data-theme", effectiveTheme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        "content",
        effectiveTheme === "dark" ? "#1f2937" : "#001f4d"
      );
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };

    try {
      // Try to save to backend
      await http.put("/api/user/settings/", updatedSettings);
    } catch (error) {
      console.log("Backend not available, saving to localStorage");
    }

    // Always save to localStorage as backup
    localStorage.setItem("userSettings", JSON.stringify(updatedSettings));

    // Update state
    setSettings(updatedSettings);
  };

  const resetSettings = async () => {
    try {
      // Try to reset on backend
      await http.post("/api/user/settings/reset/");
    } catch (error) {
      console.log("Backend not available");
    }

    // Reset to defaults
    localStorage.setItem("userSettings", JSON.stringify(DEFAULT_SETTINGS));
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider
      value={{ settings, updateSettings, resetSettings, loading }}
    >
      {!loading && children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}