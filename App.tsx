import React, { useState, useEffect, useMemo } from 'react';
import { User, Process, Contact, CRMObject, Note, ProcessType, ProcessStatus, ContactCategory } from './types';
import {
  Layout, Dashboard, ProcessList, ProcessDetail, ContactList, ContactDetail,
  ObjectList, ObjectDetail, ProcessForm, AdminView, InternalTimesTab, LoginScreen
} from './components/UIComponents';
import { ApiService } from './api';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState(true);

  const [users, setUsers] = useState<User[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [objects, setObjects] = useState<CRMObject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedObject, setSelectedObject] = useState<CRMObject | null>(null);
  const [showProcessForm, setShowProcessForm] = useState(false);

  // Reset selections on tab change
  useEffect(() => {
    setSelectedProcess(null);
    setSelectedContact(null);
    setSelectedObject(null);
    setShowProcessForm(false);
  }, [activeTab]);

  useEffect(() => {
    const token = localStorage.getItem('crm_token');
    if (token) {
      loadData();
    } else {
      // Auto-login as admin for quick access
      (async () => {
        try {
          await ApiService.login('admin', 'admin123');
          await loadData();
        } catch {
          // Login or data loading failed - show login screen
          localStorage.removeItem('crm_token');
          setCurrentUser(null);
          setLoading(false);
          setIsInitialized(true);
        }
      })();
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [u, p, c, o, n] = await Promise.all([
        ApiService.getUsers(),
        ApiService.getProcesses(),
        ApiService.getContacts(),
        ApiService.getObjects(),
        ApiService.getNotes()
      ]);
      setUsers(u);
      setProcesses(p);
      setContacts(c);
      setObjects(o);
      setNotes(n);
      setCurrentUser(u[0]);
      setIsInitialized(true);
    } catch (err) {
      console.error('Fehler beim Laden', err);
      // Clear invalid token and show login screen - no reload loop
      localStorage.removeItem('crm_token');
      setCurrentUser(null);
      setIsInitialized(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (u: string, p: string) => {
    try {
      await ApiService.login(u, p);
      await loadData();
    } catch (e) {
      alert('Login fehlgeschlagen. Bitte Daten pruefen.');
    }
  };

  // ─── Process Handlers ────────────────────────────────────────────────────
  const handleCreateProcess = async (data: any) => {
    try {
      const created = await ApiService.createProcess(data);
      setProcesses(prev => [created, ...prev]);
      setShowProcessForm(false);
      setSelectedProcess(created);
    } catch (err: any) {
      alert('Fehler beim Erstellen: ' + err.message);
    }
  };

  const handleUpdateProcess = async (id: string, data: any) => {
    try {
      const updated = await ApiService.updateProcess(id, data);
      setProcesses(prev => prev.map(p => p.id === id ? updated : p));
      setSelectedProcess(updated);
    } catch (err: any) {
      alert('Fehler beim Speichern: ' + err.message);
    }
  };

  const handleDeleteProcess = async (id: string) => {
    const proc = processes.find(p => p.id === id);
    if (!confirm(`Vorgang ${proc?.processNumber || id} wirklich loeschen? Alle zugehoerigen Aktenvermerke werden ebenfalls geloescht.`)) return;
    try {
      await ApiService.deleteProcess(id);
      setProcesses(prev => prev.filter(p => p.id !== id));
      setNotes(prev => prev.filter(n => n.processId !== id));
      setSelectedProcess(null);
    } catch (err: any) {
      alert('Fehler beim Loeschen: ' + err.message);
    }
  };

  // ─── Contact Handlers ────────────────────────────────────────────────────
  const handleCreateContact = async (data: any) => {
    try {
      const created = await ApiService.createContact(data);
      setContacts(prev => [created, ...prev]);
      setSelectedContact(created);
    } catch (err: any) {
      alert('Fehler beim Erstellen: ' + err.message);
    }
  };

  const handleUpdateContact = async (id: string, data: any) => {
    try {
      const updated = await ApiService.updateContact(id, data);
      setContacts(prev => prev.map(c => c.id === id ? updated : c));
      setSelectedContact(updated);
    } catch (err: any) {
      alert('Fehler beim Speichern: ' + err.message);
    }
  };

  // ─── Object Handlers ─────────────────────────────────────────────────────
  const handleCreateObject = async (data: any) => {
    try {
      const created = await ApiService.createObject(data);
      setObjects(prev => [created, ...prev]);
      setSelectedObject(created);
    } catch (err: any) {
      alert('Fehler beim Erstellen: ' + err.message);
    }
  };

  const handleUpdateObject = async (id: string, data: any) => {
    try {
      const updated = await ApiService.updateObject(id, data);
      setObjects(prev => prev.map(o => o.id === id ? updated : o));
      setSelectedObject(updated);
    } catch (err: any) {
      alert('Fehler beim Speichern: ' + err.message);
    }
  };

  // ─── Note Handlers ───────────────────────────────────────────────────────
  const handleSaveNote = async (noteData: any) => {
    try {
      const payload = {
        ...noteData,
        userId: currentUser!.id,
        userName: currentUser!.name,
        timestamp: new Date().toISOString(),
      };
      const created = await ApiService.createNote(payload);
      setNotes(prev => [created, ...prev]);
    } catch (err: any) {
      alert('Fehler beim Speichern der Notiz: ' + err.message);
    }
  };

  const handleSaveInternalTime = async (noteData: any) => {
    try {
      const payload = {
        processId: 'INTERNAL',
        processNumber: '',
        userId: currentUser!.id,
        userName: currentUser!.name,
        timestamp: new Date().toISOString(),
        ...noteData,
      };
      const created = await ApiService.createNote(payload);
      setNotes(prev => [created, ...prev]);
    } catch (err: any) {
      alert('Fehler beim Speichern der internen Zeit: ' + err.message);
    }
  };

  // ─── User Handlers ───────────────────────────────────────────────────────
  const handleSaveUser = async (userData: any) => {
    try {
      if (userData.id) {
        const updated = await ApiService.updateUser(userData.id, userData);
        setUsers(prev => prev.map(u => u.id === userData.id ? updated : u));
      } else {
        const created = await ApiService.createUser(userData);
        setUsers(prev => [...prev, created]);
      }
    } catch (err: any) {
      alert('Fehler: ' + err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Benutzer wirklich loeschen?')) return;
    try {
      await ApiService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err: any) {
      alert('Fehler: ' + err.message);
    }
  };

  // ─── Computed ────────────────────────────────────────────────────────────
  const processNotes = useMemo(() => {
    if (!selectedProcess) return [];
    return notes.filter(n => String(n.processId) === String(selectedProcess.id));
  }, [notes, selectedProcess]);

  const internalNotes = useMemo(() => {
    return notes.filter(n => n.processId === 'INTERNAL' || (!n.processId && !n.processNumber));
  }, [notes]);

  // ─── Render ──────────────────────────────────────────────────────────────
  if (loading || !isInitialized) {
    return <div className="h-screen flex items-center justify-center login-gradient text-white text-xl font-bold">Lade System...</div>;
  }
  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  return (
    <Layout
      currentUser={currentUser}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={ApiService.logout}
    >
      {activeTab === 'dashboard' && (
        <Dashboard
          processes={processes}
          contacts={contacts}
          notes={notes}
          users={users}
          objects={objects}
        />
      )}

      {activeTab === 'processes' && !selectedProcess && !showProcessForm && (
        <ProcessList
          processes={processes}
          contacts={contacts}
          onSelect={(p: Process) => setSelectedProcess(p)}
          onNew={() => setShowProcessForm(true)}
        />
      )}
      {activeTab === 'processes' && selectedProcess && (
        <ProcessDetail
          process={selectedProcess}
          notes={processNotes}
          users={users}
          contacts={contacts}
          objects={objects}
          currentUser={currentUser}
          onBack={() => setSelectedProcess(null)}
          onSaveNote={handleSaveNote}
          onDelete={() => handleDeleteProcess(selectedProcess.id)}
          onUpdate={(data: any) => handleUpdateProcess(selectedProcess.id, data)}
        />
      )}
      {activeTab === 'processes' && showProcessForm && (
        <ProcessForm
          contacts={contacts}
          objects={objects}
          processes={processes}
          onClose={() => setShowProcessForm(false)}
          onSave={handleCreateProcess}
        />
      )}

      {activeTab === 'contacts' && !selectedContact && (
        <ContactList
          contacts={contacts}
          onSelect={(c: Contact) => setSelectedContact(c)}
          onNew={handleCreateContact}
        />
      )}
      {activeTab === 'contacts' && selectedContact && (
        <ContactDetail
          contact={selectedContact}
          currentUser={currentUser}
          onBack={() => setSelectedContact(null)}
          onSave={(data: any) => handleUpdateContact(selectedContact.id, data)}
        />
      )}

      {activeTab === 'objects' && !selectedObject && (
        <ObjectList
          objects={objects}
          onSelect={(o: CRMObject) => setSelectedObject(o)}
          onNew={handleCreateObject}
        />
      )}
      {activeTab === 'objects' && selectedObject && (
        <ObjectDetail
          object={selectedObject}
          onBack={() => setSelectedObject(null)}
          onSave={(data: any) => handleUpdateObject(selectedObject.id, data)}
        />
      )}

      {activeTab === 'internal' && (
        <InternalTimesTab
          notes={internalNotes}
          users={users}
          currentUser={currentUser}
          onSave={handleSaveInternalTime}
        />
      )}

      {activeTab === 'admin' && (
        <AdminView
          users={users}
          currentUser={currentUser}
          onSaveUser={handleSaveUser}
          onDeleteUser={handleDeleteUser}
        />
      )}
    </Layout>
  );
};

export default App;
