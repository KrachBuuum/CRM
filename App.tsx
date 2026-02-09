
import React, { useState, useEffect } from 'react';
import { User, Process, Contact, CRMObject, Note, ProcessStatus, SearchResult, TimeRange } from './types';
import { Layout, Dashboard, ProcessList, ProcessDetail, ContactList, ContactDetail, ObjectList, ObjectDetail, ProcessForm, AdminView, InternalTimesTab, Modal, LoginScreen } from './components/UIComponents';
import { ApiService } from './api';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<any>('dashboard');
  const [loading, setLoading] = useState(true);

  // Daten-States
  const [users, setUsers] = useState<User[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [objects, setObjects] = useState<CRMObject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // UI-States
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showProcessForm, setShowProcessForm] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('crm_token');
    if (token) {
      loadData();
    } else {
      setLoading(false);
      setIsInitialized(true);
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
      console.error("Fehler beim Laden", err);
      ApiService.logout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (u: string, p: string) => {
    try {
      await ApiService.login(u, p);
      await loadData();
    } catch (e) {
      alert("Login fehlgeschlagen. Bitte Daten prüfen.");
    }
  };

  const handleCreateProcess = async (data: any) => {
    try {
      const created = await ApiService.createProcess(data);
      setProcesses(prev => [created, ...prev]);
      setShowProcessForm(false);
    } catch (e: any) {
      alert('Vorgang erstellen fehlgeschlagen: ' + e.message);
    }
  };

  const handleSaveNote = async (noteData: any) => {
    try {
      const created = await ApiService.createNote(noteData);
      setNotes(prev => [created, ...prev]);
    } catch (e: any) {
      alert('Speichern fehlgeschlagen: ' + e.message);
    }
  };

  // Reset detail view when switching tabs
  const handleSetActiveTab = (tab: string) => {
    setActiveTab(tab);
    setSelectedProcess(null);
    setSelectedContact(null);
  };

  if (loading || !isInitialized) return <div className="h-screen flex items-center justify-center login-gradient text-white">Lade System...</div>;
  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  return (
    <Layout
      currentUser={currentUser}
      setCurrentUser={() => {}}
      allUsers={users}
      activeTab={activeTab}
      setActiveTab={handleSetActiveTab}
      onLogout={ApiService.logout}
    >
      {activeTab === 'dashboard' && <Dashboard processes={processes} contacts={contacts} />}

      {activeTab === 'processes' && !selectedProcess && (
        <ProcessList processes={processes} onSelect={setSelectedProcess} onNew={() => setShowProcessForm(true)} />
      )}
      {activeTab === 'processes' && selectedProcess && (
        <ProcessDetail
          process={selectedProcess}
          notes={notes.filter((n: any) => String(n.process_id) === String(selectedProcess.id))}
          onBack={() => setSelectedProcess(null)}
          onSaveNote={handleSaveNote}
        />
      )}

      {activeTab === 'contacts' && !selectedContact && (
        <ContactList contacts={contacts} onSelect={setSelectedContact} onNew={() => {}} />
      )}
      {activeTab === 'contacts' && selectedContact && (
        <ContactDetail contact={selectedContact} onBack={() => setSelectedContact(null)} />
      )}

      {showProcessForm && (
        <ProcessForm contacts={contacts} onClose={() => setShowProcessForm(false)} onSave={handleCreateProcess} />
      )}
    </Layout>
  );
};

export default App;
