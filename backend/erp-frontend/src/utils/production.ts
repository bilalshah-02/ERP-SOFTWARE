// src/utils/production.ts
/**
 * Production utility functions to handle flexible quantity types
 * This fixes ALL TypeScript errors related to string | number types
 */

/**
 * Safely convert any value to number
 * Handles: string, number, undefined, null
 */
export const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/**
 * Safely convert any value to string
 * Handles: string, number, undefined, null
 */
export const toString = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  return '';
};

/**
 * Format quantity for display
 * Works with both string and number inputs
 */
export const formatQuantity = (value: any, decimals: number = 2): string => {
  return toNumber(value).toFixed(decimals);
};