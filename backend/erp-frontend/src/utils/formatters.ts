// src/utils/formatters.ts
import { format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export interface FormatSettings {
  dateFormat: string;
  timezone: string;
  currency: string;
}

/**
 * Format date according to user settings
 */
export const formatDate = (
  date: string | Date,
  settings: FormatSettings
): string => {
  if (!date) return "—";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  // Convert format pattern
  let pattern = "dd/MM/yyyy"; // default

  switch (settings.dateFormat) {
    case "DD/MM/YYYY":
      pattern = "dd/MM/yyyy";
      break;
    case "MM/DD/YYYY":
      pattern = "MM/dd/yyyy";
      break;
    case "YYYY-MM-DD":
      pattern = "yyyy-MM-dd";
      break;
  }

  try {
    return formatInTimeZone(dateObj, settings.timezone, pattern);
  } catch (error) {
    return format(dateObj, pattern);
  }
};

/**
 * Format datetime according to user settings
 */
export const formatDateTime = (
  date: string | Date,
  settings: FormatSettings
): string => {
  if (!date) return "—";

  const dateObj = typeof date === "string" ? new Date(date) : date;

  let pattern = "dd/MM/yyyy HH:mm"; // default

  switch (settings.dateFormat) {
    case "DD/MM/YYYY":
      pattern = "dd/MM/yyyy HH:mm";
      break;
    case "MM/DD/YYYY":
      pattern = "MM/dd/yyyy hh:mm a";
      break;
    case "YYYY-MM-DD":
      pattern = "yyyy-MM-dd HH:mm";
      break;
  }

  try {
    return formatInTimeZone(dateObj, settings.timezone, pattern);
  } catch (error) {
    return format(dateObj, pattern);
  }
};

/**
 * Format currency according to user settings
 */
export const formatCurrency = (
  amount: number,
  settings: FormatSettings,
  showSymbol: boolean = true
): string => {
  if (amount === null || amount === undefined) return "—";

  const formatter = new Intl.NumberFormat("en-US", {
    style: showSymbol ? "currency" : "decimal",
    currency: settings.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formatted = formatter.format(amount);

  // For currencies without native symbol support
  if (showSymbol && !formatted.includes(settings.currency)) {
    return `${settings.currency} ${formatted}`;
  }

  return formatted;
};

/**
 * Format number according to locale
 */
export const formatNumber = (
  value: number,
  decimals: number = 0
): string => {
  if (value === null || value === undefined) return "—";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }

  return format(dateObj, "MMM d, yyyy");
};

/**
 * Hook to use formatters with settings
 */
import { useSettings } from "../contexts/SettingsContext";

export const useFormatters = () => {
  const { settings } = useSettings();

  return {
    formatDate: (date: string | Date) => formatDate(date, settings),
    formatDateTime: (date: string | Date) => formatDateTime(date, settings),
    formatCurrency: (amount: number, showSymbol?: boolean) =>
      formatCurrency(amount, settings, showSymbol),
    formatNumber,
    getRelativeTime,
  };
};

/**
 * Example usage in components:
 * 
 * const { formatDate, formatCurrency } = useFormatters();
 * 
 * <td>{formatDate(order.order_date)}</td>
 * <td>{formatCurrency(order.total_amount)}</td>
 */