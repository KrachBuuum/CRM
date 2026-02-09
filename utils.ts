import { ProcessType } from './types';

export const padId = (id: string | number, length: number = 4): string => {
  return String(id).padStart(length, '0');
};

export const generateProcessNumber = (
  type: ProcessType, contactId: string, objectId: string, seq: number, vsId?: string
): string => {
  if (type === ProcessType.VS) {
    const vsPrefix = vsId || 'FC';
    return `VS-${vsPrefix}-${padId(seq, 6)}`;
  }
  return `${type}-${padId(contactId, 4)}-${padId(objectId, 4)}-${padId(seq, 2)}`;
};

export const formatDuration = (hours: number): string => {
  return (Number(hours) || 0).toFixed(3) + ' h';
};

export const isValidDate = (dateStr: any): boolean => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d.getTime());
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('de-DE');
};

export const formatTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};

export const convertToExplorerLink = (path: string): string => {
  if (!path) return '';
  let clean = path.trim();
  if (clean.startsWith('\\\\')) {
    clean = 'file://///' + clean.substring(2).replace(/\\/g, '/');
  } else if (!clean.startsWith('file://') && !clean.startsWith('http')) {
    clean = 'file:///' + clean.replace(/\\/g, '/');
  }
  return clean.replace(/ /g, '%20');
};

export const formatEuroDashboard = (amount: number): string => {
  return Math.round(Number(amount) || 0).toLocaleString('de-DE') + ' \u20AC';
};
