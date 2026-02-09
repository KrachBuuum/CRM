
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

  const finalizeInternalTimeBooking = () => {
    if (!internalTimeDescriptionModal || !currentUser) return;
    const dur = Math.max(0.001, internalTimeDescriptionModal.seconds / 3600);
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      processId: 'INTERNAL',
      userId: currentUser.id,
      userName: currentUser.name,
      text: internalTimeDescription.trim() || 'Interne Arbeit',
      timestamp: new Date().toISOString(),
      duration: dur,
      rateProfileId: 'Intern'
    };
    setNotes(prev => [...prev, newNote]);
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
      const procHours = ns.filter(n => n.processId !== 'INTERNAL').reduce((s, n) => s + n.duration, 0);
      const internHours = ns.filter(n => n.processId === 'INTERNAL').reduce((s, n) => s + n.duration, 0);
      const earned = ns.filter(n => n.processId !== 'INTERNAL').reduce((sum, n) => {
        const userObj = users.find(u => u.id === n.userId);
        const userRate = userObj?.rates.find(r => r.roleName === n.rateProfileId)?.rate || 0;
        return sum + (n.duration * userRate);
      }, 0);
      const costs = ns.reduce((sum, n) => {
        const userObj = users.find(u => u.id === n.userId);
        const costRate = userObj?.costRate || 0;
        return sum + (n.duration * costRate);
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

  // === HANDLERS ===
  const handleUpdateProcessStatus = (processId: string, newStatus: ProcessStatus) => {
    if (!currentUser) return;
    setProcesses(prev => prev.map(p => {
      if (p.id === processId) {
        const historyNote: Note = {
          id: Math.random().toString(36).substr(2, 9),
          processId: p.id,
          processNumber: p.processNumber,
          userId: currentUser.id,
          userName: currentUser.name,
          text: `Status geändert auf: ${newStatus}`,
          timestamp: new Date().toISOString(),
          duration: 0,
          rateProfileId: 'Intern',
          isDone: true
        };
        setNotes(prevNotes => [...prevNotes, historyNote]);
        return { ...p, status: newStatus };
      }
      return p;
    }));
  };

  const handleAddInvoice = (processId: string, invoice: any) => {
    setProcesses(prev => prev.map(p => p.id === processId ? { ...p, invoices: [...(p.invoices || []), invoice] } : p));
  };

  const handleUpdateInvoice = (processId: string, invoiceId: string, updates: any) => {
    setProcesses(prev => prev.map(p => {
      if (p.id === processId) {
        return { ...p, invoices: (p.invoices || []).map(inv => inv.id === invoiceId ? { ...inv, ...updates } : inv) };
      }
      return p;
    }));
  };

  const handleDeleteInvoice = (processId: string, invoiceId: string) => {
    if (!window.confirm("Soll diese Rechnung wirklich unwiderruflich gelöscht werden?")) return;
    setProcesses(prev => prev.map(p => {
      if (p.id === processId) {
        return { ...p, invoices: (p.invoices || []).filter(inv => inv.id !== invoiceId) };
      }
      return p;
    }));
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
          onMarkTaskDone={(noteId) => {
            setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isDone: true } : n));
          }}
        />
      )}

      {activeTab === 'internal-times' && (
        <InternalTimesTab
          notes={notes.filter(n => n.processId === 'INTERNAL')}
          onDeleteNote={(id) => setNotes(prev => prev.filter(n => n.id !== id))}
          onUpdateNote={(updated) => setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))}
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
          onUpdateProcess={p => setProcesses(prev => prev.map(item => item.id === p.id ? { ...p, storageLink: p.storageLink ? convertToExplorerLink(p.storageLink) : '' } : item))}
          onUpdateStatus={handleUpdateProcessStatus}
          onAddNote={n => { setNotes(prev => [...prev, n]); setPrefilledDuration("0.00"); }}
          onUpdateNote={n => setNotes(prev => prev.map(item => item.id === n.id ? n : item))}
          onDeleteNote={nid => setNotes(prev => prev.filter(n => n.id !== nid))}
          onAddInvoice={handleAddInvoice}
          onUpdateInvoice={handleUpdateInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onBack={goBack}
          onOpenContact={id => navigateTo('contacts', null, id)}
          onOpenObject={id => navigateTo('objects', null, null, id)}
          onStartTimer={() => handleStartProcessTimer(selectedProcessId)}
          onStopTimer={handleStopProcessTimer}
          onMarkNoteDone={(noteId) => {
            setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isDone: true } : n));
          }}
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
          onUpdate={updated => setContacts(prev => prev.map(c => c.id === updated.id ? updated : c))}
        />
      ) : activeTab === 'contacts' && (
        <ContactList
          contacts={contacts}
          onAdd={c => setContacts(p => [...p, c])}
          onSelect={id => navigateTo('contacts', null, id)}
          nextId={padId(contacts.length + 1, 4)}
        />
      )}

      {activeTab === 'objects' && selectedObjectId ? (
        <ObjectDetail
          object={objects.find(o => o.id === selectedObjectId)!}
          contacts={contacts}
          onBack={goBack}
          onUpdate={updated => setObjects(prev => prev.map(o => o.id === updated.id ? updated : o))}
        />
      ) : activeTab === 'objects' && (
        <ObjectList
          objects={objects}
          onAdd={o => setObjects(p => [...p, o])}
          onSelect={id => navigateTo('objects', null, null, id)}
          nextId={padId(objects.length + 1, 4)}
        />
      )}

      {activeTab === 'admin' && currentUser.role === UserRole.ADMIN && (
        <AdminView
          users={users}
          onUpdateUsers={setUsers}
        />
      )}

      {activeTab === 'new-process' && (
        <ProcessForm
          contacts={contacts}
          objects={objects}
          processes={processes}
          onSubmit={p => { setProcesses(prev => [{ ...p, storageLink: p.storageLink ? convertToExplorerLink(p.storageLink) : '' }, ...prev]); navigateTo('processes', p.id); }}
          onAddContact={(c: Contact) => setContacts(prev => [...prev, c])}
          onAddObject={(o: CRMObject) => setObjects(prev => [...prev, o])}
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
