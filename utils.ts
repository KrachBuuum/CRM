
import { ProcessType } from './types';

/**
 * Formats a number to a specific string length with leading zeros
 */
export const padId = (id: string | number, length: number = 4): string => {
  return String(id).padStart(length, '0');
};

/**
 * Generates a process number based on business logic
 */
export const generateProcessNumber = (
  type: ProcessType,
  contactId: string,
  objectId: string,
  seq: number,
  vsId?: string
): string => {
  if (type === ProcessType.VS) {
    const vsPrefix = vsId || 'FC';
    return `VS-${vsPrefix}-${padId(seq, 6)}`;
  }
  return `${type}-${padId(contactId, 4)}-${padId(objectId, 4)}-${padId(seq, 2)}`;
};

/**
 * Formats decimal hours into a readable string
 */
export const formatDuration = (hours: number): string => {
  return (hours || 0).toFixed(3) + ' h';
};

/**
 * Checks if a date string is valid
 */
export const isValidDate = (dateStr: any): boolean => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Formats a date string for display (German locale)
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('de-DE');
};

/**
 * Formats a time string for display (German locale)
 */
export const formatTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Converts UNC paths or file paths to functional file:// URLs for Windows Explorer
 */
export const convertToExplorerLink = (path: string): string => {
  if (!path) return '';
  let clean = path.trim();
  if (clean.startsWith('\\\\')) {
    // UNC Path: \\Server\Share -> file://///Server/Share
    clean = 'file://///' + clean.substring(2).replace(/\\/g, '/');
  } else if (!clean.startsWith('file://') && !clean.startsWith('http')) {
    // Normal windows path or relative
    clean = 'file:///' + clean.replace(/\\/g, '/');
  }
  // Encode spaces to %20
  return clean.replace(/ /g, '%20');
};

/**
 * Commercial rounding for Euro amounts (no decimals)
 */
export const formatEuroDashboard = (amount: number): string => {
  return Math.round(amount).toLocaleString('de-DE') + ' €';
};
