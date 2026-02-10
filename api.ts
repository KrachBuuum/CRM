
import { User, Process, Contact, CRMObject, Note } from './types';

const API_BASE = '/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('crm_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...options?.headers,
      },
    });
  } catch (networkErr: any) {
    if (networkErr.name === 'AbortError') {
      throw new Error('Server-Timeout (15s)');
    }
    throw new Error('Server nicht erreichbar: ' + (networkErr.message || 'Netzwerkfehler'));
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('crm_token');
    window.location.reload();
    throw new Error('Session abgelaufen');
  }

  if (!response.ok) {
    let msg = `Server-Fehler (${response.status})`;
    try {
      const text = await response.text();
      try {
        const err = JSON.parse(text);
        msg = err.error || msg;
      } catch {
        if (text.includes('502')) msg = 'Backend nicht erreichbar (502)';
        else if (text.includes('504')) msg = 'Backend-Timeout (504)';
        else msg = `Server-Fehler (${response.status}): ${text.slice(0, 100)}`;
      }
    } catch {}
    throw new Error(msg);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const ApiService = {
  login: async (username: string, password: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error('Login fehlgeschlagen');
      const data = await res.json();
      localStorage.setItem('crm_token', data.token);
      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') throw new Error('Login-Timeout');
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  },

  logout: () => {
    localStorage.removeItem('crm_token');
    window.location.reload();
  },

  getUsers: () => request<User[]>('/users'),
  createUser: (u: any) => request<User>('/users', { method: 'POST', body: JSON.stringify(u) }),
  updateUser: (id: string, u: any) => request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(u) }),
  deleteUser: (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),

  getContacts: () => request<Contact[]>('/contacts'),
  createContact: (c: any) => request<Contact>('/contacts', { method: 'POST', body: JSON.stringify(c) }),
  updateContact: (id: string, c: any) => request<Contact>(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(c) }),
  deleteContact: (id: string) => request<void>(`/contacts/${id}`, { method: 'DELETE' }),

  getProcesses: () => request<Process[]>('/processes'),
  createProcess: (p: any) => request<Process>('/processes', { method: 'POST', body: JSON.stringify(p) }),
  updateProcess: (id: string, p: any) => request<Process>(`/processes/${id}`, { method: 'PUT', body: JSON.stringify(p) }),
  deleteProcess: (id: string) => request<void>(`/processes/${id}`, { method: 'DELETE' }),

  getObjects: () => request<CRMObject[]>('/objects'),
  createObject: (o: any) => request<CRMObject>('/objects', { method: 'POST', body: JSON.stringify(o) }),
  updateObject: (id: string, o: any) => request<CRMObject>(`/objects/${id}`, { method: 'PUT', body: JSON.stringify(o) }),

  getNotes: () => request<Note[]>('/notes'),
  createNote: (n: Partial<Note>) => request<Note>('/notes', { method: 'POST', body: JSON.stringify(n) }),
  updateNote: (id: string, n: Partial<Note>) => request<Note>(`/notes/${id}`, { method: 'PUT', body: JSON.stringify(n) }),
  deleteNote: (id: string) => request<void>(`/notes/${id}`, { method: 'DELETE' }),
};
