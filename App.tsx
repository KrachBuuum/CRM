
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
      // Simulierter currentUser aus Token-Payload oder erstem User
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

  if (loading || !isInitialized) return <div className="h-screen flex items-center justify-center login-gradient text-white">Lade System...</div>;
  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;

  return (
    <Layout 
      currentUser={currentUser} 
      setCurrentUser={() => {}} // In Auth-Umgebung deaktiviert
      allUsers={users}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={ApiService.logout}
      // ... restliche Props wie zuvor
    >
      {activeTab === 'dashboard' && <Dashboard processes={processes} contacts={contacts} />}
      {/* ... restliche Tabs ... */}
    </Layout>
  );
};

export default App;
