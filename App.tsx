
import React, { useState, useMemo, useEffect } from 'react';
import {
  User, Process, Contact, CRMObject, Note,
  ProcessStatus, ProcessType, UserRole, SearchResult, TimeRange, Invoice
} from './types';
import {
  Layout, Dashboard, ProcessList, ProcessDetail, ContactList, ContactDetail,
  ObjectList, ObjectDetail, ProcessForm, AdminView, InternalTimesTab, Modal, FormField, LoginScreen
} from './components/UIComponents';
import { ApiService } from './api';
import { padId, isValidDate, convertToExplorerLink } from './utils';

const normalizePhone = (phone: string) => phone.replace(/\s+/g, '');

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- DATA STATE ---
  const [users, setUsers] = useState<User[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [objects, setObjects] = useState<CRMObject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // --- UI STATE ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'processes' | 'contacts' | 'objects' | 'new-process' | 'admin' | 'internal-times'>('dashboard');
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [processFilterStatus, setProcessFilterStatus] = useState<ProcessStatus | null>(null);
  const [history, setHistory] = useState<any[]>(['dashboard']);
  const [dashboardTimeRange, setDashboardTimeRange] = useState<TimeRange>('Heute');
  const [prefilledDuration, setPrefilledDuration] = useState<string>("0.00");

  // --- TIMER STATE ---
  const [timerActive, setTimerActive] = useState(false);
  const [timerProcessId, setTimerProcessId] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [internalTimerActive, setInternalTimerActive] = useState(false);
  const [internalTimerPaused, setInternalTimerPaused] = useState(false);
  const [internalSeconds, setInternalSeconds] = useState(0);
  const [showTimerPopup, setShowTimerPopup] = useState(false);
  const [internalTimeDescriptionModal, setInternalTimeDescriptionModal] = useState<{ active: boolean, seconds: number } | null>(null);
  const [internalTimeDescription, setInternalTimeDescription] = useState('');

  // --- SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState('');

  // === AUTH & DATA LOADING ===
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

  // === TIMERS ===
  useEffect(() => {
    let interval: any;
    if (timerActive) {
      interval = setInterval(() => setTimerSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  useEffect(() => {
    let interval: any;
    if (internalTimerActive && !internalTimerPaused) {
      interval = setInterval(() => setInternalSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [internalTimerActive, internalTimerPaused]);

  const formatTimerDisplay = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleStartProcessTimer = (pid: string | null) => {
    if (internalTimerActive) setInternalTimerPaused(true);
    setTimerProcessId(pid);
    setTimerActive(true);
  };

  const handleStopProcessTimer = () => {
    const dur = Math.max(0.001, timerSeconds / 3600).toFixed(3);
    setTimerActive(false);
    setTimerSeconds(0);
    const pid = timerProcessId;
    setTimerProcessId(null);
    if (internalTimerActive) setShowTimerPopup(true);
    if (pid) {
      setPrefilledDuration(dur);
      navigateTo('processes', pid);
    }
    return dur;
  };

  const handleStopInternalTimer = () => {
    setInternalTimeDescriptionModal({ active: true, seconds: internalSeconds });
    setInternalTimeDescription('');
    setInternalTimerActive(false);
    setInternalTimerPaused(false);
    setInternalSeconds(0);
  };

  const finalizeInternalTimeBooking = async () => {
    if (!internalTimeDescriptionModal || !currentUser) return;
    const dur = Math.max(0.001, internalTimeDescriptionModal.seconds / 3600);
    const newNote: Partial<Note> = {
      id: Math.random().toString(36).substr(2, 9),
      processId: 'INTERNAL',
      userId: currentUser.id,
      userName: currentUser.name,
      text: internalTimeDescription.trim() || 'Interne Arbeit',
      timestamp: new Date().toISOString(),
      duration: dur,
      rateProfileId: 'Intern'
    };
    try {
      const saved = await ApiService.createNote(newNote);
      setNotes(prev => [...prev, saved]);
    } catch (e) {
      console.error('Interne Zeit speichern fehlgeschlagen', e);
    }
    setInternalTimeDescriptionModal(null);
  };

  // === NAVIGATION ===
  const navigateTo = (tab: any, procId: string | null = null, contId: string | null = null, objId: string | null = null) => {
    setHistory(prev => [...prev, { tab, procId, contId, objId }]);
    setActiveTab(tab);
    setSelectedProcessId(procId);
    setSelectedContactId(contId);
    setSelectedObjectId(objId);
    if (tab !== 'processes') setProcessFilterStatus(null);
  };

  const goBack = () => {
    if (history.length <= 1) return;
    const newHistory = [...history];
    newHistory.pop();
    const last = newHistory[newHistory.length - 1];
    if (typeof last === 'string') {
      setActiveTab(last as any);
      setSelectedProcessId(null);
      setSelectedContactId(null);
      setSelectedObjectId(null);
    } else {
      setActiveTab(last.tab);
      setSelectedProcessId(last.procId);
      setSelectedContactId(last.contId);
      setSelectedObjectId(last.objId);
    }
    setHistory(newHistory);
  };

  // === SEARCH ===
  const searchResults = useMemo((): SearchResult[] => {
    if (searchQuery.length < 1) return [];
    const q = searchQuery.toLowerCase();
    const qNorm = normalizePhone(q);
    const results: SearchResult[] = [];
    processes.forEach(p => {
      if (p.processNumber.toLowerCase().includes(q) || p.title.toLowerCase().includes(q))
        results.push({ type: 'process', id: p.id, label: p.processNumber, sublabel: p.title });
    });
    contacts.forEach(c => {
      const name = c.companyName || `${c.firstName} ${c.lastName}`;
      const phones = [normalizePhone(c.phoneMobile), normalizePhone(c.phoneLandline)].join(' ');
      if (name.toLowerCase().includes(q) || c.id.includes(q) || phones.includes(qNorm))
        results.push({ type: 'contact', id: c.id, label: name, sublabel: `ID: ${c.id} | Tel: ${c.phoneMobile || c.phoneLandline}` });
    });
    objects.forEach(o => {
      if (o.displayName.toLowerCase().includes(q) || o.address.street.toLowerCase().includes(q) || o.id.includes(q))
        results.push({ type: 'object', id: o.id, label: o.displayName, sublabel: `ID: ${o.id}` });
    });
    return results.slice(0, 10);
  }, [searchQuery, processes, contacts, objects]);

  // === DASHBOARD STATS ===
  const stats = useMemo(() => {
    if (!currentUser) return null;
    const getRangeFilter = (range: TimeRange) => {
      const now = new Date();
      if (range === 'Heute') return (ts: string) => ts.startsWith(now.toISOString().split('T')[0]);
      if (range === 'Diese Woche') {
        const start = new Date(now.setDate(now.getDate() - now.getDay() + 1));
        start.setHours(0,0,0,0);
        return (ts: string) => new Date(ts) >= start;
      }
      if (range === 'Dieser Monat') return (ts: string) => ts.startsWith(new Date().toISOString().slice(0, 7));
      return () => true;
    };

    const isMatch = getRangeFilter(dashboardTimeRange);
    const inRangeNotes = notes.filter(n => isMatch(n.timestamp));
    const userNotes = inRangeNotes.filter(n => n.userId === currentUser.id);

    const calcFinance = (ns: Note[]) => {
      const dur = (n: Note) => Number(n.duration) || 0;
      const procHours = ns.filter(n => n.processId !== 'INTERNAL').reduce((s, n) => s + dur(n), 0);
      const internHours = ns.filter(n => n.processId === 'INTERNAL').reduce((s, n) => s + dur(n), 0);
      const earned = ns.filter(n => n.processId !== 'INTERNAL').reduce((sum, n) => {
        const userObj = users.find(u => u.id === n.userId);
        const userRate = userObj?.rates.find(r => r.roleName === n.rateProfileId)?.rate || 0;
        return sum + (dur(n) * userRate);
      }, 0);
      const costs = ns.reduce((sum, n) => {
        const userObj = users.find(u => u.id === n.userId);
        const costRate = Number(userObj?.costRate) || 0;
        return sum + (dur(n) * costRate);
      }, 0);
      return { procHours, internHours, earned, costs };
    };

    const statusCounts = Object.values(ProcessStatus).reduce((acc, status) => {
      acc[status] = processes.filter(p => p.status === status).length;
      return acc;
    }, {} as Record<ProcessStatus, number>);

    const activeProcesses = processes.filter(p => p.status !== ProcessStatus.COMPLETED && p.status !== ProcessStatus.CANCELLED);
    const overdueInvoices = processes.flatMap(p =>
      (p.invoices || []).filter(inv => !inv.paidDate && isValidDate(inv.dueDate) && new Date(inv.dueDate) < new Date()).map(inv => ({ ...inv, process: p }))
    );

    return {
      global: calcFinance(inRangeNotes),
      personal: calcFinance(userNotes),
      statusCounts,
      activeCount: activeProcesses.length,
      assignedTasks: notes.filter(n => n.assignedUserId === currentUser.id && !n.isDone),
      overdueInvoices,
      activityHistory: [...notes].sort((a,b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 15)
    };
  }, [notes, currentUser, processes, dashboardTimeRange, users]);

  // === API-PERSISTED HANDLERS ===

  // -- Notes --
  const handleAddNote = async (n: Note) => {
    try {
      const saved = await ApiService.createNote(n);
      setNotes(prev => [...prev, saved]);
      setPrefilledDuration("0.00");
    } catch (e: any) { alert('Notiz speichern fehlgeschlagen: ' + (e.message || '')); }
  };

  const handleUpdateNote = async (n: Note) => {
    try {
      const saved = await ApiService.updateNote(n.id, n);
      setNotes(prev => prev.map(item => item.id === saved.id ? saved : item));
    } catch (e) { console.error('Notiz aktualisieren fehlgeschlagen', e); }
  };

  const handleDeleteNote = async (nid: string) => {
    try {
      await ApiService.deleteNote(nid);
      setNotes(prev => prev.filter(n => n.id !== nid));
    } catch (e) { console.error('Notiz löschen fehlgeschlagen', e); }
  };

  const handleMarkNoteDone = async (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const updated = { ...note, isDone: true };
    try {
      const saved = await ApiService.updateNote(noteId, updated);
      setNotes(prev => prev.map(n => n.id === noteId ? saved : n));
    } catch (e) { console.error('Aufgabe erledigen fehlgeschlagen', e); }
  };

  // -- Processes --
  const handleCreateProcess = async (p: Process) => {
    const proc = { ...p, storageLink: p.storageLink ? convertToExplorerLink(p.storageLink) : '' };
    try {
      const saved = await ApiService.createProcess(proc);
      setProcesses(prev => [saved, ...prev]);
      navigateTo('processes', saved.id);
    } catch (e: any) { alert('Vorgang erstellen fehlgeschlagen: ' + (e.message || 'Unbekannter Fehler')); }
  };

  const handleUpdateProcess = async (p: Process) => {
    const proc = { ...p, storageLink: p.storageLink ? convertToExplorerLink(p.storageLink) : '' };
    try {
      const saved = await ApiService.updateProcess(p.id, proc);
      setProcesses(prev => prev.map(item => item.id === saved.id ? saved : item));
    } catch (e) { console.error('Vorgang aktualisieren fehlgeschlagen', e); }
  };

  const handleUpdateProcessStatus = async (processId: string, newStatus: ProcessStatus) => {
    if (!currentUser) return;
    const proc = processes.find(p => p.id === processId);
    if (!proc) return;
    const updatedProc = { ...proc, status: newStatus };
    try {
      const savedProc = await ApiService.updateProcess(processId, updatedProc);
      setProcesses(prev => prev.map(p => p.id === processId ? savedProc : p));
      const historyNote: Partial<Note> = {
        id: Math.random().toString(36).substr(2, 9),
        processId: proc.id,
        processNumber: proc.processNumber,
        userId: currentUser.id,
        userName: currentUser.name,
        text: `Status geändert auf: ${newStatus}`,
        timestamp: new Date().toISOString(),
        duration: 0,
        rateProfileId: 'Intern',
        isDone: true
      };
      const savedNote = await ApiService.createNote(historyNote);
      setNotes(prev => [...prev, savedNote]);
    } catch (e) { console.error('Status ändern fehlgeschlagen', e); }
  };

  const handleAddInvoice = async (processId: string, invoice: Invoice) => {
    const proc = processes.find(p => p.id === processId);
    if (!proc) return;
    const updated = { ...proc, invoices: [...(proc.invoices || []), invoice] };
    try {
      const saved = await ApiService.updateProcess(processId, updated);
      setProcesses(prev => prev.map(p => p.id === processId ? saved : p));
    } catch (e) { console.error('Rechnung hinzufügen fehlgeschlagen', e); }
  };

  const handleUpdateInvoice = async (processId: string, invoiceId: string, updates: Partial<Invoice>) => {
    const proc = processes.find(p => p.id === processId);
    if (!proc) return;
    const updated = { ...proc, invoices: (proc.invoices || []).map(inv => inv.id === invoiceId ? { ...inv, ...updates } : inv) };
    try {
      const saved = await ApiService.updateProcess(processId, updated);
      setProcesses(prev => prev.map(p => p.id === processId ? saved : p));
    } catch (e) { console.error('Rechnung aktualisieren fehlgeschlagen', e); }
  };

  const handleDeleteInvoice = async (processId: string, invoiceId: string) => {
    if (!window.confirm("Soll diese Rechnung wirklich unwiderruflich gelöscht werden?")) return;
    const proc = processes.find(p => p.id === processId);
    if (!proc) return;
    const updated = { ...proc, invoices: (proc.invoices || []).filter(inv => inv.id !== invoiceId) };
    try {
      const saved = await ApiService.updateProcess(processId, updated);
      setProcesses(prev => prev.map(p => p.id === processId ? saved : p));
    } catch (e) { console.error('Rechnung löschen fehlgeschlagen', e); }
  };

  // -- Contacts --
  const handleCreateContact = async (c: Contact) => {
    try {
      const saved = await ApiService.createContact(c);
      setContacts(prev => [...prev, saved]);
    } catch (e: any) { alert('Kontakt erstellen fehlgeschlagen: ' + (e.message || '')); }
  };

  const handleUpdateContact = async (c: Contact) => {
    try {
      const saved = await ApiService.updateContact(c.id, c);
      setContacts(prev => prev.map(item => item.id === saved.id ? saved : item));
    } catch (e) { console.error('Kontakt aktualisieren fehlgeschlagen', e); }
  };

  // -- Objects --
  const handleCreateObject = async (o: CRMObject) => {
    try {
      const saved = await ApiService.createObject(o);
      setObjects(prev => [...prev, saved]);
    } catch (e: any) { alert('Objekt erstellen fehlgeschlagen: ' + (e.message || '')); }
  };

  const handleUpdateObject = async (o: CRMObject) => {
    try {
      const saved = await ApiService.updateObject(o.id, o);
      setObjects(prev => prev.map(item => item.id === saved.id ? saved : item));
    } catch (e) { console.error('Objekt aktualisieren fehlgeschlagen', e); }
  };

  // -- Users (Admin) --
  const handleSaveUser = async (u: any, isNew: boolean) => {
    try {
      if (isNew) {
        const saved = await ApiService.createUser(u);
        setUsers(prev => [...prev, saved]);
      } else {
        const saved = await ApiService.updateUser(u.id, u);
        setUsers(prev => prev.map(item => item.id === saved.id ? saved : item));
      }
    } catch (e: any) {
      alert(e.message || 'Benutzer speichern fehlgeschlagen');
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await ApiService.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e: any) {
      alert(e.message || 'Benutzer löschen fehlgeschlagen');
    }
  };

  // === RENDER ===
  if (loading || !isInitialized) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white text-lg font-bold">Lade System...</div>;
  if (!currentUser) return <LoginScreen onLogin={handleLogin} />;
  if (!stats) return null;

  return (
    <Layout
      currentUser={currentUser}
      setCurrentUser={setCurrentUser}
      allUsers={users}
      activeTab={activeTab}
      setActiveTab={(t) => navigateTo(t)}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      searchResults={searchResults}
      onSearchResultClick={(res) => {
        if (res.type === 'process') navigateTo('processes', res.id);
        else if (res.type === 'contact') navigateTo('contacts', null, res.id);
        else if (res.type === 'object') navigateTo('objects', null, null, res.id);
        setSearchQuery('');
      }}
      timerDisplay={formatTimerDisplay(timerSeconds)}
      timerActive={timerActive}
      onStartTimer={handleStartProcessTimer}
      onStopTimer={handleStopProcessTimer}
      internalTimerDisplay={formatTimerDisplay(internalSeconds)}
      internalTimerActive={internalTimerActive}
      internalTimerPaused={internalTimerPaused}
      onToggleInternalTimer={() => {
        if (!internalTimerActive) setInternalTimerActive(true);
        else setInternalTimerActive(false);
      }}
      onTogglePauseInternal={() => setInternalTimerPaused(!internalTimerPaused)}
      onStopInternalTimer={handleStopInternalTimer}
      activeProcessInfo={timerProcessId ? processes.find(p => p.id === timerProcessId) : undefined}
      onBack={goBack}
      onLogout={ApiService.logout}
    >
      {activeTab === 'dashboard' && (
        <Dashboard
          stats={stats}
          timeRange={dashboardTimeRange}
          onSetTimeRange={setDashboardTimeRange}
          onNavigateToProcess={(id) => navigateTo('processes', id)}
          onStatusClick={(status) => {
            setProcessFilterStatus(status);
            setActiveTab('processes');
          }}
          onMarkTaskDone={handleMarkNoteDone}
        />
      )}

      {activeTab === 'internal-times' && (
        <InternalTimesTab
          notes={notes.filter(n => n.processId === 'INTERNAL')}
          onDeleteNote={handleDeleteNote}
          onUpdateNote={handleUpdateNote}
        />
      )}

      {activeTab === 'processes' && selectedProcessId ? (
        <ProcessDetail
          process={processes.find(p => p.id === selectedProcessId)!}
          contacts={contacts}
          objects={objects}
          notes={notes.filter(n => n.processId === selectedProcessId)}
          currentUser={currentUser}
          users={users}
          timerValue={prefilledDuration}
          isTimerActive={timerActive && timerProcessId === selectedProcessId}
          onUpdateProcess={handleUpdateProcess}
          onUpdateStatus={handleUpdateProcessStatus}
          onAddNote={handleAddNote}
          onUpdateNote={handleUpdateNote}
          onDeleteNote={handleDeleteNote}
          onAddInvoice={handleAddInvoice}
          onUpdateInvoice={handleUpdateInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onBack={goBack}
          onOpenContact={id => navigateTo('contacts', null, id)}
          onOpenObject={id => navigateTo('objects', null, null, id)}
          onStartTimer={() => handleStartProcessTimer(selectedProcessId)}
          onStopTimer={handleStopProcessTimer}
          onMarkNoteDone={handleMarkNoteDone}
        />
      ) : activeTab === 'processes' && (
        <ProcessList
          processes={processes}
          notes={notes}
          users={users}
          filterStatus={processFilterStatus}
          onSelect={id => navigateTo('processes', id)}
          onClearFilter={() => setProcessFilterStatus(null)}
        />
      )}

      {activeTab === 'contacts' && selectedContactId ? (
        <ContactDetail
          contact={contacts.find(c => c.id === selectedContactId)!}
          onBack={goBack}
          onUpdate={handleUpdateContact}
        />
      ) : activeTab === 'contacts' && (
        <ContactList
          contacts={contacts}
          onAdd={handleCreateContact}
          onSelect={id => navigateTo('contacts', null, id)}
          nextId={padId(contacts.length + 1, 4)}
        />
      )}

      {activeTab === 'objects' && selectedObjectId ? (
        <ObjectDetail
          object={objects.find(o => o.id === selectedObjectId)!}
          contacts={contacts}
          onBack={goBack}
          onUpdate={handleUpdateObject}
        />
      ) : activeTab === 'objects' && (
        <ObjectList
          objects={objects}
          onAdd={handleCreateObject}
          onSelect={id => navigateTo('objects', null, null, id)}
          nextId={padId(objects.length + 1, 4)}
        />
      )}

      {activeTab === 'admin' && currentUser.role === UserRole.ADMIN && (
        <AdminView
          users={users}
          onSaveUser={handleSaveUser}
          onDeleteUser={handleDeleteUser}
        />
      )}

      {activeTab === 'new-process' && (
        <ProcessForm
          contacts={contacts}
          objects={objects}
          processes={processes}
          onSubmit={handleCreateProcess}
          onAddContact={handleCreateContact}
          onAddObject={handleCreateObject}
          onCancel={goBack}
          nextContactId={padId(contacts.length + 1, 4)}
          nextObjectId={padId(objects.length + 1, 4)}
        />
      )}

      {showTimerPopup && (
        <Modal title="Interne Zeiterfassung fortführen?" onClose={() => setShowTimerPopup(false)}>
          <div className="space-y-4">
            <p className="text-sm">Vorgangs-Timer wurde beendet. Die interne Zeiterfassung war zuvor aktiv.</p>
            <p className="font-bold text-sm">Möchten Sie die interne Zeiterfassung fortführen (Pause beendet)?</p>
            <div className="flex space-x-4 pt-4">
              <button
                onClick={() => { setInternalTimerPaused(false); setShowTimerPopup(false); }}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95"
              >
                Ja, fortführen
              </button>
              <button
                onClick={() => { handleStopInternalTimer(); setShowTimerPopup(false); }}
                className="flex-1 bg-rose-600 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95"
              >
                Nein, verbuchen &amp; nullen
              </button>
            </div>
          </div>
        </Modal>
      )}

      {internalTimeDescriptionModal && (
        <Modal title="Interne Zeit dokumentieren" onClose={() => finalizeInternalTimeBooking()}>
          <div className="space-y-4">
             <p className="text-xs text-slate-500 italic">Dokumentieren Sie Ihre interne Arbeit (optional).</p>
             <FormField
                label="Beschreibung / Bemerkung"
                placeholder="Interne Arbeit"
                value={internalTimeDescription}
                onChange={setInternalTimeDescription}
                autoFocus
             />
             <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => finalizeInternalTimeBooking()}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
                >OK / SPEICHERN</button>
             </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
};

export default App;
