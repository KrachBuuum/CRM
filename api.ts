
import { User, Process, Contact, CRMObject, Note } from './types';

const API_BASE = '/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('crm_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options?.headers,
    },
  });

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('crm_token');
    window.location.reload();
    throw new Error('Session abgelaufen');
  }

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || 'Netzwerkfehler');
  }

  return response.json();
}

export const ApiService = {
  login: async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Login fehlgeschlagen');
    const data = await res.json();
    localStorage.setItem('crm_token', data.token);
    return data;
  },

  logout: () => {
    localStorage.removeItem('crm_token');
    window.location.reload();
  },

  getUsers: () => request<User[]>('/users'),
  getContacts: () => request<Contact[]>('/contacts'),
  getProcesses: () => request<Process[]>('/processes'),
  getObjects: () => request<CRMObject[]>('/objects'),
  getNotes: () => request<Note[]>('/notes'),
  createNote: (n: Note) => request<Note>('/notes', { method: 'POST', body: JSON.stringify(n) }),
  deleteNote: (id: string) => request<void>(`/notes/${id}`, { method: 'DELETE' }),
};
