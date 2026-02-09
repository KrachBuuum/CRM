
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
    let message = 'Netzwerkfehler';
    try {
      const err = await response.json();
      message = err.error || message;
    } catch {
      message = `Server-Fehler (${response.status})`;
    }
    throw new Error(message);
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
  updateUser: (id: string, u: Partial<User>) => request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(u) }),

  getContacts: () => request<Contact[]>('/contacts'),
  createContact: (c: Partial<Contact>) => request<Contact>('/contacts', { method: 'POST', body: JSON.stringify(c) }),
  updateContact: (id: string, c: Partial<Contact>) => request<Contact>(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(c) }),

  getProcesses: () => request<Process[]>('/processes'),
  createProcess: (p: Partial<Process>) => request<Process>('/processes', { method: 'POST', body: JSON.stringify(p) }),
  updateProcess: (id: string, p: Partial<Process>) => request<Process>(`/processes/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  deleteProcess: (id: string) => request<void>(`/processes/${id}`, { method: 'DELETE' }),

  deleteContact: (id: string) => request<void>(`/contacts/${id}`, { method: 'DELETE' }),

  getObjects: () => request<CRMObject[]>('/objects'),
  createObject: (o: Partial<CRMObject>) => request<CRMObject>('/objects', { method: 'POST', body: JSON.stringify(o) }),
  updateObject: (id: string, o: Partial<CRMObject>) => request<CRMObject>(`/objects/${id}`, { method: 'PUT', body: JSON.stringify(o) }),

  getNotes: () => request<Note[]>('/notes'),
  createNote: (n: Partial<Note>) => request<Note>('/notes', { method: 'POST', body: JSON.stringify(n) }),
  deleteNote: (id: string) => request<void>(`/notes/${id}`, { method: 'DELETE' }),
};
