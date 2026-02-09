import React, { useState, useMemo, useEffect } from 'react';
import { 
  User, UserRole, Process, Contact, Note, ProcessType, 
  ProcessStatus, ContactCategory, SearchResult, UserRate, CompanyContact,
  CRMObject, Address, ObjectOwner, SecondPersonData, TimeRange, Invoice
} from '../types';
import { formatDate, formatTime, padId, isValidDate, formatEuroDashboard, convertToExplorerLink } from '../utils';
import { MANUAL_SNIPPETS } from '../constants';
import { 
  LayoutDashboard, FolderKanban, Users, MapPin, Search, Plus, Timer, 
  FileText, X, Filter, ArrowUpDown, Building2, UserCircle, Save, Lock, Unlock, 
  Edit2, ChevronLeft, Coffee, ShieldCheck, UserPlus, Trash2, CheckCircle2,
  Euro, ChevronRight, Play, Briefcase, Info, Home, Building, ExternalLink, Link as LinkIcon, Check, Globe, AlertCircle, Clock, Receipt, TrendingUp, Activity, BarChart3, Settings2
} from 'lucide-react';

// --- SHARED COMPONENTS ---

export const StatusBadge: React.FC<{ status: ProcessStatus }> = ({ status }) => {
  const colors: Record<string, string> = {
    [ProcessStatus.LEAD]: 'bg-sky-50 text-sky-700 border-sky-100',
    [ProcessStatus.POTENTIAL]: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    [ProcessStatus.OFFER]: 'bg-amber-50 text-amber-700 border-amber-100',
    [ProcessStatus.ORDERED]: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    [ProcessStatus.PAUSED]: 'bg-orange-50 text-orange-700 border-orange-100',
    [ProcessStatus.COMPLETED]: 'bg-slate-50 text-slate-700 border-slate-200',
    [ProcessStatus.CANCELLED]: 'bg-rose-50 text-rose-700 border-rose-100',
    [ProcessStatus.APPOINTMENT_TO_ARRANGE]: 'bg-purple-50 text-purple-700 border-purple-100',
    [ProcessStatus.APPOINTMENT_ARRANGED]: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors[status] || 'bg-slate-100'}`}>{status}</span>;
};

export const Modal: React.FC<{ title: string; children: React.ReactNode; onClose: () => void }> = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 text-slate-900">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <h3 className="font-bold text-slate-800">{title}</h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors"><X size={20}/></button>
      </div>
      <div className="p-6 max-h-[85vh] overflow-y-auto">{children}</div>
    </div>
  </div>
);

export const FormField = ({ label, value, onChange, disabled, type = 'text', placeholder = '', autoFocus = false }: any) => (
  <div className="w-full">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{label}</label>
    <input 
      type={type} 
      disabled={disabled} 
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`w-full bg-white border ${disabled ? 'border-slate-100 bg-slate-50 text-slate-500' : 'border-slate-300 focus:border-indigo-500'} px-3 py-2 rounded-xl text-sm outline-none transition-all text-slate-900 shadow-sm`} 
      value={value || ''} 
      onChange={e => onChange(e.target.value)}
    />
  </div>
);

const AddressFields = ({ address, onChange, disabled, label }: { address: Address, onChange: (a: Address) => void, disabled: boolean, label: string }) => (
  <div className="space-y-4">
    <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest border-b pb-1">{label}</h4>
    <div className="grid grid-cols-3 gap-3">
      <div className="col-span-2"><FormField label="Straße" disabled={disabled} value={address.street} onChange={(v:any) => onChange({...address, street: v})}/></div>
      <FormField label="Hnr." disabled={disabled} value={address.houseNumber} onChange={(v:any) => onChange({...address, houseNumber: v})}/>
    </div>
    <div className="grid grid-cols-3 gap-3">
      <FormField label="PLZ" disabled={disabled} value={address.zip} onChange={(v:any) => onChange({...address, zip: v})}/>
      <div className="col-span-2"><FormField label="Ort" disabled={disabled} value={address.city} onChange={(v:any) => onChange({...address, city: v})}/></div>
    </div>
    <FormField label="Land" disabled={disabled} value={address.country} onChange={(v:any) => onChange({...address, country: v})}/>
  </div>
);

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: 'indigo' | 'emerald' | 'sky' | 'rose' | 'amber' | 'slate' }> = ({ title, value, icon, color }) => {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  };
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${colorClasses[color] || colorClasses.indigo}`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-xl font-black text-slate-800 tracking-tight">{value}</p>
    </div>
  );
};

// --- LAYOUT ---
export const Layout: React.FC<{
  children: React.ReactNode;
  currentUser: User;
  setCurrentUser: (u: User) => void;
  allUsers: User[];
  activeTab: string;
  setActiveTab: (t: any) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  searchResults: SearchResult[];
  onSearchResultClick: (res: SearchResult) => void;
  timerDisplay: string;
  timerActive: boolean;
  onStartTimer: (pid: string | null) => void;
  onStopTimer: () => void;
  internalTimerDisplay: string;
  internalTimerActive: boolean;
  internalTimerPaused: boolean;
  onToggleInternalTimer: () => void;
  onTogglePauseInternal: () => void;
  onStopInternalTimer: () => void;
  activeProcessInfo?: Process;
  onBack: () => void;
}> = ({ 
  children, currentUser, setCurrentUser, allUsers, activeTab, setActiveTab, 
  searchQuery, setSearchQuery, searchResults, onSearchResultClick,
  timerDisplay, timerActive, onStartTimer, onStopTimer, 
  internalTimerDisplay, internalTimerActive, internalTimerPaused, onToggleInternalTimer, onTogglePauseInternal, onStopInternalTimer,
  activeProcessInfo, onBack
}) => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl">
        <div className="p-6 flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20"><FolderKanban className="text-white" size={24} /></div>
          <h1 className="text-xl font-bold text-white tracking-tight">KMU CRM <span className="text-indigo-400 font-medium italic">Pro</span></h1>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          <NavItem active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard size={20}/>} label="Dashboard" />
          <NavItem active={activeTab === 'processes'} onClick={() => setActiveTab('processes')} icon={<FolderKanban size={20}/>} label="Vorgänge" />
          <NavItem active={activeTab === 'internal-times'} onClick={() => setActiveTab('internal-times')} icon={<Clock size={20}/>} label="Interne Zeiten" />
          <NavItem active={activeTab === 'contacts'} onClick={() => setActiveTab('contacts')} icon={<Users size={20}/>} label="Kontakte" />
          <NavItem active={activeTab === 'objects'} onClick={() => setActiveTab('objects')} icon={<MapPin size={20}/>} label="Objekte" />
          {currentUser.role === UserRole.ADMIN && (
            <NavItem active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} icon={<Settings2 size={20}/>} label="Benutzer" />
          )}
          <div className="pt-6">
            <button onClick={() => setActiveTab('new-process')} className="group flex items-center justify-center space-x-3 w-full px-4 py-3.5 rounded-2xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-900/40 transition-all active:scale-95">
              <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300"/><span>Neuer Vorgang</span></button>
          </div>
        </nav>
        <div className="p-6 border-t border-slate-800 bg-slate-950/30">
           <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-widest font-black opacity-50">Angemeldet als</div>
           <div className="text-sm font-bold text-white flex items-center">
             <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div>
             {currentUser.name}
           </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-[60] shadow-sm">
          <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2.5 hover:bg-slate-100 rounded-2xl transition-all text-slate-500 active:scale-90"><ChevronLeft size={24}/></button>
            
            <div className="flex flex-col ml-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aktiver Nutzer</label>
              <select 
                className="bg-slate-50 border-none rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 px-2 py-1 shadow-inner"
                value={currentUser.id}
                onChange={(e) => {
                  const selectedUser = allUsers.find(u => u.id === e.target.value);
                  if (selectedUser) setCurrentUser(selectedUser);
                }}
              >
                {allUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div className="relative w-72">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" placeholder="Suche (Name, ID, Tel)..." 
                className="w-full pl-11 pr-4 py-2 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 shadow-inner"
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  {searchResults.map(res => (
                    <button key={`${res.type}-${res.id}`} onClick={() => onSearchResultClick(res)} className="w-full flex items-center p-4 hover:bg-indigo-50 text-left border-b border-slate-50 transition-colors">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl mr-4">
                        {res.type === 'process' ? <FolderKanban size={16}/> : res.type === 'contact' ? <Users size={16}/> : <MapPin size={16}/>}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate">{res.label}</p>
                        <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-tight">{res.sublabel}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center bg-white border border-slate-200 px-4 py-2 rounded-2xl space-x-3 shadow-sm group">
              <div className={`w-2.5 h-2.5 rounded-full ${internalTimerActive && !internalTimerPaused ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
              <span className="font-mono text-sm font-black text-slate-800 tracking-wider">{internalTimerDisplay}</span>
              <div className="flex items-center space-x-1.5 ml-2 border-l border-slate-100 pl-3">
                {!internalTimerActive ? (
                  <button onClick={onToggleInternalTimer} className="p-1.5 bg-emerald-500 text-white rounded-xl hover:scale-110 transition-all shadow-md shadow-emerald-200">
                    <Play size={14} fill="currentColor"/>
                  </button>
                ) : (
                  <>
                    <button onClick={onTogglePauseInternal} className={`p-1.5 rounded-xl transition-all shadow-md active:scale-90 ${internalTimerPaused ? 'bg-indigo-500 text-white shadow-indigo-200' : 'bg-amber-100 text-amber-600 hover:bg-amber-200 shadow-amber-100'}`}>
                      {internalTimerPaused ? <Play size={14} fill="currentColor"/> : <Coffee size={14} fill="currentColor"/>}
                    </button>
                    <button onClick={onStopInternalTimer} className="p-1.5 bg-rose-500 text-white rounded-xl hover:scale-110 transition-all shadow-md shadow-rose-200 active:scale-90">
                      <Save size={14}/>
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center bg-slate-900 text-white px-6 py-2.5 rounded-2xl space-x-5 shadow-xl shadow-slate-200 border border-slate-800">
              <div className="flex items-center space-x-3">
                 <div className={`w-3 h-3 rounded-full ${timerActive ? 'bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.6)]' : 'bg-slate-600'}`}></div>
                 <span className="font-mono text-lg font-black tracking-[0.1em]">{timerDisplay}</span>
              </div>
              <div className="flex-1 overflow-hidden text-right border-l border-slate-800 pl-5">
                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate leading-none mb-1">
                   {activeProcessInfo ? 'AKTIVER VORGANG' : 'BEREIT'}
                 </div>
                 <div className="text-xs font-bold text-indigo-400 truncate">
                   {activeProcessInfo ? activeProcessInfo.processNumber : 'Kein Timer läuft'}
                 </div>
              </div>
              <button 
                onClick={timerActive ? onStopTimer : () => onStartTimer(null)}
                className={`p-2 rounded-xl transition-all active:scale-90 ${timerActive ? 'bg-rose-600 shadow-lg shadow-rose-900/40' : 'bg-indigo-600 shadow-lg shadow-indigo-900/40'}`}
              >
                {timerActive ? <X size={18}/> : <Timer size={18}/>}
              </button>
            </div>
          </div>
        </header>
        <section className="flex-1 overflow-y-auto p-8 scroll-smooth">{children}</section>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center space-x-4 w-full px-5 py-4 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>{icon}<span>{label}</span></button>
);

// --- DASHBOARD ---
export const Dashboard: React.FC<{ 
  stats: { 
    global: { procHours: number, internHours: number, earned: number, costs: number },
    personal: { procHours: number, internHours: number, earned: number, costs: number },
    statusCounts: Record<ProcessStatus, number>,
    activeCount: number, 
    assignedTasks: Note[],
    overdueInvoices: any[],
    activityHistory: Note[]
  },
  timeRange: TimeRange,
  onSetTimeRange: (t: TimeRange) => void,
  onNavigateToProcess: (id: string) => void,
  onStatusClick: (status: ProcessStatus) => void,
  onMarkTaskDone: (id: string) => void
}> = ({ stats, timeRange, onSetTimeRange, onNavigateToProcess, onStatusClick, onMarkTaskDone }) => (
  <div className="space-y-10 animate-in fade-in duration-700 pb-20">
    <div className="flex items-center justify-between">
      <h2 className="text-3xl font-black text-slate-800 tracking-tight">Systemübersicht</h2>
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
        {(['Heute', 'Diese Woche', 'Dieser Monat'] as TimeRange[]).map(t => (
          <button 
            key={t} 
            onClick={() => onSetTimeRange(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${timeRange === t ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>

    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
       <div className="flex items-center justify-between mb-6">
          <h3 className="font-black text-slate-800 flex items-center"><FolderKanban className="mr-2 text-indigo-600" size={20}/> Aktive Vorgänge</h3>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Klick auf Kachel filtert Liste</span>
       </div>
       <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 gap-3">
          {(Object.values(ProcessStatus)).map(status => {
            const count = stats.statusCounts[status] || 0;
            return (
              <button 
                key={status} 
                onClick={() => onStatusClick(status)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${count > 0 ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 opacity-40'}`}
              >
                <span className="text-lg font-black text-indigo-600 mb-0.5">{count}</span>
                <span className="text-[8px] font-black text-slate-500 uppercase text-center leading-tight">{status}</span>
              </button>
            );
          })}
       </div>
    </div>
    
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Requirement 1: No numbering. Requirement 2: No decimals for Euro. */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center"><BarChart3 className="mr-2" size={16}/> Systemleistung (Alle Nutzer)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Gebuchte Stunden (Vorgänge)" value={`${stats.global.procHours.toFixed(1)}h`} icon={<Clock size={20}/>} color="indigo" />
          <StatCard title="Interne Zeit" value={`${stats.global.internHours.toFixed(1)}h`} icon={<Coffee size={20}/>} color="slate" />
          <StatCard title="Erwirtschafteter Umsatz" value={formatEuroDashboard(stats.global.earned)} icon={<Euro size={20}/>} color="emerald" />
          <StatCard title="Kosten" value={formatEuroDashboard(stats.global.costs)} icon={<Receipt size={20}/>} color="rose" />
        </div>
      </div>
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest pl-2 flex items-center"><TrendingUp className="mr-2" size={16}/> Persönliche Produktivität</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Meine Stunden (Vorgänge)" value={`${stats.personal.procHours.toFixed(1)}h`} icon={<TrendingUp size={20}/>} color="sky" />
          <StatCard title="Meine interne Zeit" value={`${stats.personal.internHours.toFixed(1)}h`} icon={<Clock size={20}/>} color="amber" />
          <StatCard title="Mein Umsatz" value={formatEuroDashboard(stats.personal.earned)} icon={<Euro size={20}/>} color="emerald" />
          <StatCard title="Meine Kosten" value={formatEuroDashboard(stats.personal.costs)} icon={<Receipt size={20}/>} color="rose" />
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-[500px]">
         <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center"><Activity size={24} className="mr-3 text-indigo-600"/> Aktivitätsverlauf</h3>
         <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {stats.activityHistory.map(entry => (
              <div 
                key={entry.id} 
                onClick={() => onNavigateToProcess(entry.processId)}
                className="group flex items-center p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-200 hover:bg-white hover:shadow-md transition-all cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-4 text-indigo-600">
                  {entry.duration > 0 ? <Clock size={18}/> : entry.text.includes('Status') ? <Filter size={18}/> : <FileText size={18}/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter truncate">
                      {entry.processNumber || entry.processId} • {entry.userName}
                    </p>
                    <span className="text-[9px] font-bold text-slate-400 ml-2 whitespace-nowrap">{formatTime(entry.timestamp)}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 truncate">{entry.text}</p>
                </div>
              </div>
            ))}
         </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
           <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center"><AlertCircle className="mr-2 text-rose-500" size={18}/> Überfällige Rechnungen</h3>
           <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {stats.overdueInvoices.map(inv => (
                <button 
                  key={inv.id} 
                  onClick={() => onNavigateToProcess(inv.process.id)}
                  className="w-full flex items-center justify-between p-3 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors"
                >
                  <div className="text-left">
                    <p className="text-[9px] font-black text-rose-600 uppercase">{inv.process.processNumber}</p>
                    <p className="text-[11px] font-bold text-slate-700">{inv.amount.toFixed(2)} €</p>
                  </div>
                  <AlertCircle size={14} className="text-rose-400"/>
                </button>
              ))}
              {stats.overdueInvoices.length === 0 && <p className="text-xs text-slate-300 italic text-center py-4">Keine Überfälligkeiten</p>}
           </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex-1">
           <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center"><CheckCircle2 className="mr-2 text-emerald-500" size={18}/> Offene Aufgaben</h3>
           <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {stats.assignedTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <div className="flex-1 cursor-pointer" onClick={() => onNavigateToProcess(task.processId)}>
                    <p className="text-[9px] font-black text-emerald-600 uppercase">{task.processNumber || task.processId}</p>
                    <p className="text-[11px] font-bold text-slate-700 truncate">{task.text}</p>
                  </div>
                  <button onClick={() => onMarkTaskDone(task.id)} className="p-1.5 bg-white border border-emerald-200 rounded-lg text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"><Check size={14}/></button>
                </div>
              ))}
              {stats.assignedTasks.length === 0 && <p className="text-xs text-slate-300 italic text-center py-4">Alle Aufgaben erledigt</p>}
           </div>
        </div>
      </div>
    </div>
  </div>
);

// --- PROCESS LIST ---
export const ProcessList: React.FC<{ processes: Process[], notes: Note[], users: User[], filterStatus: ProcessStatus | null, onSelect: (id: string) => void, onClearFilter: () => void }> = ({ processes, notes, users, filterStatus, onSelect, onClearFilter }) => {
  const filtered = filterStatus ? processes.filter(p => p.status === filterStatus) : processes;
  
  const getProcessFinancials = (p: Process) => {
    const pNotes = notes.filter(n => n.processId === p.id);
    const bookedCosts = pNotes.reduce((sum, n) => {
      const u = users.find(usr => usr.id === n.userId);
      return sum + (n.duration * (u?.costRate || 0));
    }, 0);
    const revenue = (p.invoices || []).reduce((sum, inv) => sum + inv.amount, 0);
    return { bookedCosts, profit: revenue - bookedCosts };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Vorgänge</h2>
          {filterStatus && (
            <div className="flex items-center bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
              Filter: {filterStatus}
              <button onClick={onClearFilter} className="ml-2 hover:text-indigo-900"><X size={14}/></button>
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Vorgang</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Titel / Projekt</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Status</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Kosten (€)</th>
              <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Gewinn (€)</th>
              <th className="px-6 py-5 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(p => {
              const isInactive = p.status === ProcessStatus.COMPLETED || p.status === ProcessStatus.CANCELLED;
              const { bookedCosts, profit } = getProcessFinancials(p);
              return (
                <tr key={p.id} onClick={() => onSelect(p.id)} className={`group cursor-pointer transition-all duration-200 ${isInactive ? 'opacity-40 saturate-50 bg-slate-50/50' : 'hover:bg-indigo-50/40'}`}>
                  <td className="px-6 py-6 font-mono font-black text-indigo-600 text-sm group-hover:translate-x-1 transition-transform">{p.processNumber}</td>
                  <td className="px-6 py-6 text-sm font-bold text-slate-700">{p.title}</td>
                  <td className="px-6 py-6"><StatusBadge status={p.status}/></td>
                  <td className="px-6 py-6 text-xs font-bold text-slate-500">{bookedCosts.toFixed(2)}</td>
                  <td className={`px-6 py-6 text-xs font-black ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{profit.toFixed(2)}</td>
                  <td className="px-6 py-6 text-right"><ChevronRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-all"/></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- PROCESS DETAIL ---
export const ProcessDetail: React.FC<{
  process: Process;
  contacts: Contact[];
  objects: CRMObject[];
  notes: Note[];
  users: User[];
  currentUser: User;
  timerValue: string;
  isTimerActive: boolean;
  onUpdateProcess: (p: Process) => void;
  onUpdateStatus: (processId: string, status: ProcessStatus) => void;
  onAddNote: (n: Note) => void;
  onUpdateNote: (n: Note) => void;
  onDeleteNote: (id: string) => void;
  onAddInvoice: (pid: string, inv: Invoice) => void;
  onUpdateInvoice: (pid: string, invId: string, updates: any) => void;
  onDeleteInvoice: (pid: string, invId: string) => void;
  onBack: () => void;
  onOpenContact: (id: string) => void;
  onOpenObject: (id: string) => void;
  onStartTimer: () => void;
  onStopTimer: () => string;
  onMarkNoteDone: (noteId: string) => void;
}> = ({ process, contacts, objects, notes, users, currentUser, timerValue, isTimerActive, onUpdateProcess, onUpdateStatus, onAddNote, onUpdateNote, onDeleteNote, onAddInvoice, onUpdateInvoice, onDeleteInvoice, onBack, onOpenContact, onOpenObject, onStartTimer, onStopTimer, onMarkNoteDone }) => {
  const [isLocked, setIsLocked] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [noteDuration, setNoteDuration] = useState('');
  const [noteRateId, setNoteRateId] = useState(currentUser.standardRateProfileId);
  const [noteTimestamp, setNoteTimestamp] = useState(new Date().toISOString().slice(0, 16));
  const [noteResubmission, setNoteResubmission] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [assignUserId, setAssignUserId] = useState<string>('');
  
  const [showPickContact, setShowPickContact] = useState(false);
  const [showPickEndContact, setShowPickEndContact] = useState(false);
  const [showPickObject, setShowPickObject] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (timerValue !== "0.00" && !editingNoteId) setNoteDuration(timerValue);
  }, [timerValue]);

  useEffect(() => {
    setNoteRateId(currentUser.standardRateProfileId);
  }, [currentUser]);

  const financialStats = useMemo(() => {
    const bookedCosts = notes.reduce((sum, n) => {
      const userObj = users.find(u => u.id === n.userId);
      return sum + (n.duration * (userObj?.costRate || 0));
    }, 0);
    const invoiced = (process.invoices || []).reduce((sum, inv) => sum + inv.amount, 0);
    const paid = (process.invoices || []).filter(inv => !!inv.paidDate).reduce((sum, inv) => sum + inv.amount, 0);
    return { bookedCosts, invoiced, paid, profit: invoiced - bookedCosts };
  }, [notes, process.invoices, users]);

  const saveNote = () => {
    if (!noteText) return;
    if (!isValidDate(noteTimestamp)) {
      alert("Ungültiger Zeitpunkt ausgewählt.");
      return;
    }
    const dur = parseFloat(noteDuration) || 0;
    const noteData: Note = {
      id: editingNoteId || Math.random().toString(36).substr(2, 9),
      processId: process.id,
      processNumber: process.processNumber,
      userId: currentUser.id,
      userName: currentUser.name,
      text: noteText,
      timestamp: new Date(noteTimestamp).toISOString(),
      duration: dur,
      rateProfileId: noteRateId,
      assignedUserId: assignUserId || undefined,
      resubmissionDate: noteResubmission || undefined,
      isDone: false
    };
    if (editingNoteId) onUpdateNote(noteData);
    else onAddNote(noteData);
    setNoteText('');
    setNoteDuration('');
    setNoteResubmission('');
    setEditingNoteId(null);
    setNoteTimestamp(new Date().toISOString().slice(0, 16));
    setAssignUserId('');
  };

  const startEditNote = (n: Note) => {
    setEditingNoteId(n.id);
    setNoteText(n.text);
    setNoteDuration(n.duration.toString());
    setNoteRateId(n.rateProfileId);
    setNoteTimestamp(isValidDate(n.timestamp) ? n.timestamp.slice(0, 16) : new Date().toISOString().slice(0, 16));
    setAssignUserId(n.assignedUserId || '');
    setNoteResubmission(n.resubmissionDate || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const customer = contacts.find(c => c.id === process.customerId);
  const endCustomer = contacts.find(c => c.id === process.endCustomerId);
  const object = objects.find(o => o.id === process.objectId);

  return (
    <div className="space-y-8 text-slate-900 pb-20 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-3 hover:bg-white rounded-2xl transition-all active:scale-90 shadow-sm border border-slate-100"><ChevronLeft size={24}/></button>
          <div className="flex flex-col">
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-black tracking-tight">{process.processNumber}</h2>
              {/* Requirement 2: Explorer Link logic. convertToExplorerLink masks spaces etc. */}
              {process.storageLink && (
                <a 
                  href={convertToExplorerLink(process.storageLink)} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-lg hover:bg-indigo-700 transition-all"
                >
                  <ExternalLink size={14}/> <span>Ablage öffnen</span>
                </a>
              )}
            </div>
            {!isLocked ? (
              <input className="text-lg font-bold bg-white border-b-2 border-indigo-400 focus:outline-none py-1" value={process.title} onChange={e => onUpdateProcess({...process, title: e.target.value})} />
            ) : (
              <p className="text-slate-500 font-medium">{process.title}</p>
            )}
          </div>
          <div className="flex flex-col ml-4">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-1">Vorgangsstatus</label>
            <select className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold shadow-sm" value={process.status} onChange={(e) => onUpdateStatus(process.id, e.target.value as ProcessStatus)}>
              {Object.values(ProcessStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2 mr-4 bg-slate-50 border border-slate-100 p-2 rounded-2xl">
           <div className="px-3 border-r border-slate-200 text-right">
             <p className="text-[8px] font-black text-slate-400 uppercase">Kosten</p>
             <p className="text-xs font-bold text-rose-600">{financialStats.bookedCosts.toFixed(2)} €</p>
           </div>
           <div className="px-3 border-r border-slate-200 text-right">
             <p className="text-[8px] font-black text-slate-400 uppercase">Rechnung</p>
             <p className="text-xs font-bold text-slate-600">{financialStats.invoiced.toFixed(2)} €</p>
           </div>
           <div className="px-3 border-r border-slate-200 text-right">
             <p className="text-[8px] font-black text-slate-400 uppercase">Bezahlt</p>
             <p className="text-xs font-bold text-emerald-600">{financialStats.paid.toFixed(2)} €</p>
           </div>
           <div className="px-3 text-right">
             <p className="text-[8px] font-black text-slate-400 uppercase">Gewinn</p>
             <p className={`text-xs font-black ${financialStats.profit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>{financialStats.profit.toFixed(2)} €</p>
           </div>
        </div>

        <div className="flex items-center space-x-4">
          <button onClick={() => setIsLocked(!isLocked)} className={`p-3.5 rounded-2xl shadow-lg transition-all active:scale-90 border ${isLocked ? 'bg-white border-slate-200 text-slate-400' : 'bg-indigo-600 text-white border-indigo-500'}`}>
            {isLocked ? <Lock size={22}/> : <Unlock size={22}/>}
          </button>
          <button onClick={isTimerActive ? onStopTimer : onStartTimer} className={`px-10 py-3.5 rounded-2xl font-black transition-all shadow-xl active:scale-95 border ${isTimerActive ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-900 text-white border-slate-800'}`}>
            {isTimerActive ? 'TIMER STOPP' : 'TIMER START'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => !isLocked ? setShowPickContact(true) : (customer && onOpenContact(customer.id))} className={`bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm cursor-pointer hover:bg-indigo-50 transition-all group ${!isLocked ? 'ring-2 ring-indigo-500' : ''}`}>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center"><Users size={12} className="mr-1"/> Auftraggeber</p>
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-800">{customer ? (customer.companyName || `${customer.firstName} ${customer.lastName}`) : 'Nicht gewählt'}</p>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-indigo-600 transition-colors"/>
          </div>
          {customer && <p className="text-[10px] text-slate-400 mt-1 font-mono">ID: {customer.id}</p>}
        </div>

        <div onClick={() => !isLocked ? setShowPickEndContact(true) : (endCustomer && onOpenContact(endCustomer.id))} className={`bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm cursor-pointer hover:bg-indigo-50 transition-all group ${!isLocked ? 'ring-2 ring-purple-500' : ''}`}>
          <div className="flex items-center justify-between mb-1">
             <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest flex items-center"><UserCircle size={12} className="mr-1"/> Kunde (Endkunde)</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-800">{endCustomer ? (endCustomer.companyName || `${endCustomer.firstName} ${endCustomer.lastName}`) : (isLocked ? 'Identisch mit Auftraggeber' : 'Klicken zum Festlegen')}</p>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-purple-600 transition-colors"/>
          </div>
          {endCustomer && <p className="text-[10px] text-slate-400 mt-1 font-mono">ID: {endCustomer.id}</p>}
        </div>

        <div onClick={() => !isLocked ? setShowPickObject(true) : (object && onOpenObject(object.id))} className={`bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm cursor-pointer hover:bg-indigo-50 transition-all group ${!isLocked ? 'ring-2 ring-cyan-500' : ''}`}>
          <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1 flex items-center"><MapPin size={12} className="mr-1"/> Betroffenes Objekt</p>
          <div className="flex items-center justify-between">
            <p className="font-bold text-slate-800">{object ? object.displayName : 'Kein Objekt'}</p>
            <ChevronRight size={14} className="text-slate-300 group-hover:text-cyan-600 transition-colors"/>
          </div>
          {object && <p className="text-[10px] text-slate-400 mt-1 font-mono">ID: {object.id}</p>}
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col space-y-2 shadow-sm">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interne Notiz zum Auftrag</p>
        {!isLocked ? (
          <textarea className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl text-sm h-28 outline-none focus:ring-4 focus:ring-indigo-100 shadow-inner" value={process.internalNotes || ''} onChange={e => onUpdateProcess({...process, internalNotes: e.target.value})} placeholder="Hier bearbeiten..." />
        ) : (
          <p className="text-sm text-slate-700 font-medium leading-relaxed italic">{process.internalNotes || 'Keine internen Notizen hinterlegt.'}</p>
        )}
      </div>

      {!isLocked && (
        <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 space-y-4 shadow-inner animate-in slide-in-from-top-4">
           <h4 className="text-xs font-black uppercase text-indigo-400 tracking-widest">Weitere Einstellungen (Entsperrt)</h4>
           <div className="flex items-center space-x-3 mb-2">
              <input type="checkbox" id="diff-customer" className="w-5 h-5 rounded-lg text-indigo-600" checked={!!process.endCustomerId} onChange={(e) => { if(!e.target.checked) onUpdateProcess({...process, endCustomerId: undefined}); else setShowPickEndContact(true); }} />
              <label htmlFor="diff-customer" className="text-xs font-bold text-indigo-700">Auftraggeber ungleich Kunde</label>
           </div>
           <FormField label="Ablage-Link (URL / Pfad)" value={process.storageLink || ''} onChange={(v:any) => onUpdateProcess({...process, storageLink: v})} placeholder="\\Server\Freigabe oder file://..." />
        </div>
      )}

      {/* Aktenvermerk Form with manual DateTime & Resubmission */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-200 space-y-6">
        <h3 className="text-xl font-black border-b border-slate-100 pb-5 flex items-center text-slate-800"><FileText size={24} className="mr-3 text-indigo-600"/> {editingNoteId ? 'Aktenvermerk editieren' : 'Neuer Aktenvermerk'}</h3>
        <textarea className="w-full border-2 border-slate-100 p-6 rounded-3xl h-44 outline-none focus:ring-4 focus:ring-indigo-50 bg-white shadow-inner text-slate-900 font-medium leading-relaxed" value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Eintrag verfassen..." />
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 items-end">
          <div className="md:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Zeitpunkt</label>
            <input type="datetime-local" className="w-full border border-slate-300 p-3 rounded-2xl bg-white text-xs font-bold outline-none focus:border-indigo-500" value={noteTimestamp} onChange={e => setNoteTimestamp(e.target.value)}/>
          </div>
          <div className="md:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Wiedervorlage</label>
            <input type="date" className="w-full border border-slate-300 p-3 rounded-2xl bg-white text-xs font-bold outline-none focus:border-indigo-500" value={noteResubmission} onChange={e => setNoteResubmission(e.target.value)}/>
          </div>
          <div className="md:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Dauer (h)</label>
            <input type="number" step="0.001" className="w-full border border-slate-200 p-3 rounded-2xl bg-white text-xs font-bold outline-none" value={noteDuration} onChange={e => setNoteDuration(e.target.value)}/>
          </div>
          <div className="md:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Satz / Funktion</label>
            <select className="w-full border border-slate-200 p-3 rounded-2xl bg-white text-xs font-bold outline-none" value={noteRateId} onChange={e => setNoteRateId(e.target.value)}>
              {currentUser.rates.map(r => <option key={r.roleName} value={r.roleName}>{r.roleName}</option>)}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Zuweisen</label>
            <select className="w-full border border-slate-200 p-3 rounded-2xl bg-white text-xs font-bold outline-none" value={assignUserId} onChange={e => setAssignUserId(e.target.value)}>
              <option value="">- Niemand -</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <button onClick={saveNote} className={`w-full py-3.5 rounded-2xl font-black shadow-xl transition-all active:scale-95 ${editingNoteId ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>{editingNoteId ? 'SPEICHERN' : 'VERBUCHEN'}</button>
        </div>
      </div>

      {/* Invoices with editing and deletion */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-5">
           <h3 className="text-xl font-black flex items-center text-slate-800"><Receipt size={24} className="mr-3 text-indigo-600"/> Rechnungen</h3>
           <button onClick={() => setShowAddInvoice(true)} className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-xs font-black border border-emerald-100 hover:bg-emerald-100 transition-all"><Plus size={14}/> <span>NEUE RECHNUNG</span></button>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                 <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="pb-4">Datum</th>
                    <th className="pb-4">Zahlungsziel</th>
                    <th className="pb-4">Betrag</th>
                    <th className="pb-4">Zahldatum</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Aktion</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {(process.invoices || []).map(inv => {
                    const isPaid = !!inv.paidDate;
                    const isOverdue = !isPaid && isValidDate(inv.dueDate) && new Date(inv.dueDate) < new Date();
                    return (
                       <tr key={inv.id} className="text-sm font-bold text-slate-700 group">
                          <td className="py-4">{formatDate(inv.invoiceDate)}</td>
                          <td className="py-4">{formatDate(inv.dueDate)}</td>
                          <td className="py-4">{inv.amount.toFixed(2)} €</td>
                          <td className="py-4">
                             {isPaid ? (
                                <span className="text-emerald-600">{formatDate(inv.paidDate!)}</span>
                             ) : (
                                <button onClick={() => setEditingInvoice(inv)} className="text-[10px] font-black text-indigo-400 hover:text-indigo-600 uppercase">Bezahldatum setzen</button>
                             )}
                          </td>
                          <td className="py-4">
                             {isPaid ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] border border-emerald-100">Bezahlt</span>
                             ) : isOverdue ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] border border-rose-100 flex items-center w-fit"><AlertCircle size={10} className="mr-1"/> Überfällig</span>
                             ) : (
                                <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 text-[10px] border border-slate-100">Offen</span>
                             )}
                          </td>
                          <td className="py-4 text-right">
                             <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all">
                               <button onClick={() => setEditingInvoice(inv)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 size={14}/></button>
                               <button onClick={() => onDeleteInvoice(process.id, inv.id)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={14}/></button>
                             </div>
                          </td>
                       </tr>
                    );
                 })}
                 {(process.invoices || []).length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-300 italic text-xs">Keine Rechnungen dokumentiert.</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 p-6 border-b border-slate-200 font-black text-[10px] text-slate-400 uppercase tracking-widest">Aktenvermerke / Verlauf</div>
        <div className="divide-y divide-slate-100">
          {notes.sort((a,b) => b.timestamp.localeCompare(a.timestamp)).map(n => {
            const isAssignedToActiveUser = n.assignedUserId === currentUser.id && !n.isDone;
            return (
              <div key={n.id} className="group p-8 flex justify-between hover:bg-slate-50 transition-all duration-300">
                 <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-xl uppercase tracking-tighter">{n.userName}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(n.timestamp)} • {formatTime(n.timestamp)}</span>
                      {n.resubmissionDate && (
                        <span className="flex items-center text-[10px] font-black bg-amber-50 text-amber-600 px-3 py-1 rounded-xl border border-amber-100">
                          <AlertCircle size={10} className="mr-1"/> WV: {formatDate(n.resubmissionDate)}
                        </span>
                      )}
                      {n.assignedUserId && <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-3 py-1 rounded-xl uppercase tracking-tighter">Aufgabe für: {users.find(u=>u.id===n.assignedUserId)?.name} {n.isDone && '(Erledigt)'}</span>}
                      {isAssignedToActiveUser && (
                        <button onClick={() => onMarkNoteDone(n.id)} className="flex items-center space-x-1.5 bg-emerald-500 text-white px-3 py-1 rounded-xl text-[10px] font-black hover:bg-emerald-600 shadow-md transition-all active:scale-95"><Check size={12}/> <span>ERLEDIGT</span></button>
                      )}
                    </div>
                    <div className={`text-base font-medium leading-relaxed whitespace-pre-wrap ${n.isDone ? 'text-slate-400 italic' : 'text-slate-700'}`}>{n.text}</div>
                 </div>
                 <div className="text-right ml-10 flex items-center space-x-6">
                    <div>
                      <div className="text-xl font-black text-indigo-600">{n.duration.toFixed(3)}h</div>
                      <div className="text-[9px] uppercase font-black text-slate-400 tracking-widest">{n.rateProfileId}</div>
                    </div>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => startEditNote(n)} className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 shadow-sm transition-all"><Edit2 size={16}/></button>
                      <button onClick={() => { if(confirm("Löschen?")) onDeleteNote(n.id); }} className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-rose-600 shadow-sm transition-all"><Trash2 size={16}/></button>
                    </div>
                 </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAddInvoice && (
        <InvoiceModal 
          onSave={(inv) => { onAddInvoice(process.id, inv); setShowAddInvoice(false); }} 
          onClose={() => setShowAddInvoice(false)} 
        />
      )}
      {editingInvoice && (
        <InvoiceModal 
          invoice={editingInvoice}
          onSave={(inv) => { onUpdateInvoice(process.id, inv.id, inv); setEditingInvoice(null); }} 
          onClose={() => setEditingInvoice(null)} 
        />
      )}
      {showPickContact && <Modal title="Kunden ändern" onClose={() => setShowPickContact(false)}><PickList items={contacts} labelFn={(c) => c.companyName || `${c.firstName} ${c.lastName}`} onPick={(c) => { onUpdateProcess({...process, customerId: c.id}); setShowPickContact(false); }} /></Modal>}
      {showPickEndContact && <Modal title="Endkunden ändern" onClose={() => setShowPickEndContact(false)}><PickList items={contacts} labelFn={(c) => c.companyName || `${c.firstName} ${c.lastName}`} onPick={(c) => { onUpdateProcess({...process, endCustomerId: c.id}); setShowPickEndContact(false); }} /></Modal>}
      {showPickObject && <Modal title="Objekt ändern" onClose={() => setShowPickObject(false)}><PickList items={objects} labelFn={(o) => o.displayName} onPick={(o) => { onUpdateProcess({...process, objectId: o.id}); setShowPickObject(false); }} /></Modal>}
    </div>
  );
};

const InvoiceModal = ({ invoice, onSave, onClose }: { invoice?: Invoice, onSave: (inv: Invoice) => void, onClose: () => void }) => {
  const [date, setDate] = useState(invoice?.invoiceDate || new Date().toISOString().split('T')[0]);
  const [targetDays, setTargetDays] = useState('14');
  const [targetDate, setTargetDate] = useState(invoice?.dueDate || '');
  const [amount, setAmount] = useState(invoice?.amount.toString() || '');
  const [paidDate, setPaidDate] = useState(invoice?.paidDate || '');

  const finalDueDate = useMemo(() => {
    if (targetDate) return targetDate;
    if (!isValidDate(date)) return date;
    const d = new Date(date);
    d.setDate(d.getDate() + (parseInt(targetDays) || 0));
    return d.toISOString().split('T')[0];
  }, [date, targetDays, targetDate]);

  return (
    <Modal title={invoice ? "Rechnung bearbeiten" : "Neue Rechnung erfassen"} onClose={onClose}>
       <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
             <FormField label="Rechnungsdatum" type="date" value={date} onChange={setDate} />
             <FormField label="Rechnungsbetrag (€)" type="number" value={amount} onChange={setAmount} />
          </div>
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
             <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Zahlungsziel (Tage)</label>
                <input className="w-full bg-white border border-slate-300 p-2 rounded-lg outline-none focus:border-indigo-500" type="number" value={targetDays} onChange={e => { setTargetDays(e.target.value); setTargetDate(''); }} />
             </div>
             <FormField label="oder Konkretes Fälligkeitsdatum" type="date" value={targetDate} onChange={v => { setTargetDate(v); setTargetDays(''); }} />
          </div>
          <div className="grid grid-cols-2 gap-4 items-end">
             <FormField label="Zahldatum (falls bezahlt)" type="date" value={paidDate} onChange={setPaidDate} />
             <div className="text-center bg-indigo-50 p-2.5 rounded-xl border border-indigo-100 h-[52px] flex flex-col justify-center">
                <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Fälligkeit berechnet</p>
                <p className="text-xs font-black text-indigo-700">{formatDate(finalDueDate)}</p>
             </div>
          </div>
          <button 
            onClick={() => onSave({ 
              id: invoice?.id || Math.random().toString(), 
              invoiceDate: date, 
              dueDate: finalDueDate, 
              amount: parseFloat(amount) || 0,
              paidDate: paidDate || undefined
            })}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all"
          >{invoice ? 'ÄNDERUNGEN SPEICHERN' : 'RECHNUNG SPEICHERN'}</button>
       </div>
    </Modal>
  );
};

// --- INTERNAL TIMES TAB ---
export const InternalTimesTab: React.FC<{
  notes: Note[],
  onDeleteNote: (id: string) => void,
  onUpdateNote: (note: Note) => void
}> = ({ notes, onDeleteNote, onUpdateNote }) => {
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Interne Zeiten verwalten</h2>
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Datum</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Dauer (h)</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Beschreibung</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aktion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {notes.sort((a,b) => b.timestamp.localeCompare(a.timestamp)).map(n => (
              <tr key={n.id} className="text-sm font-bold text-slate-700 group hover:bg-slate-50">
                <td className="px-6 py-4">{formatDate(n.timestamp)}</td>
                <td className="px-6 py-4">{n.duration.toFixed(3)} h</td>
                <td className="px-6 py-4 truncate max-w-xs">{n.text}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setEditingNote(n)} className="p-2 text-slate-400 hover:text-indigo-600 transition-all"><Edit2 size={16}/></button>
                    <button onClick={() => { if(window.confirm("Eintrag löschen?")) onDeleteNote(n.id); }} className="p-2 text-slate-400 hover:text-rose-600 transition-all"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {notes.length === 0 && (
              <tr><td colSpan={4} className="py-12 text-center text-slate-300 italic text-sm">Keine internen Zeiten erfasst.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editingNote && (
        <Modal title="Interne Zeit bearbeiten" onClose={() => setEditingNote(null)}>
           <div className="space-y-4">
              <FormField label="Beschreibung" value={editingNote.text} onChange={(v:any) => setEditingNote({...editingNote, text: v})} />
              <FormField label="Dauer (h)" type="number" step="0.001" value={editingNote.duration} onChange={(v:any) => setEditingNote({...editingNote, duration: parseFloat(v)})} />
              <FormField label="Zeitpunkt" type="datetime-local" value={editingNote.timestamp.slice(0,16)} onChange={(v:any) => setEditingNote({...editingNote, timestamp: new Date(v).toISOString()})} />
              <button 
                onClick={() => { onUpdateNote(editingNote); setEditingNote(null); }}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg"
              >SPEICHERN</button>
           </div>
        </Modal>
      )}
    </div>
  );
};

// Helper for Picking
const PickList = ({ items, labelFn, onPick }: { items: any[], labelFn: (i: any) => string, onPick: (i: any) => void }) => {
  const [search, setSearch] = useState('');
  const filtered = items.filter(i => labelFn(i).toLowerCase().includes(search.toLowerCase()) || (i.id && i.id.includes(search)));
  return (
    <div className="space-y-4">
      <input className="w-full border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-indigo-500" placeholder="Suchen..." value={search} onChange={e => setSearch(e.target.value)} />
      <div className="max-h-60 overflow-y-auto space-y-2">
        {filtered.map(item => (
          <button key={item.id} onClick={() => onPick(item)} className="w-full p-4 text-left border rounded-xl hover:bg-indigo-50 flex justify-between">
            <span className="font-bold">{labelFn(item)}</span>
            <span className="text-indigo-400 font-mono text-[10px]">ID: {item.id}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- CONTACTS ---
export const ContactList: React.FC<{ contacts: Contact[], onAdd: (c: Contact) => void, onSelect: (id: string) => void, nextId: string }> = ({ contacts, onSelect, onAdd, nextId }) => {
  const [showNew, setShowNew] = useState(false);
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Kontakte</h2>
        <button onClick={() => setShowNew(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black flex items-center shadow-lg active:scale-95 hover:bg-indigo-700"><Plus size={18} className="mr-2"/> Neuer Kontakt</button>
      </div>
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b"><tr><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">ID</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Kategorie</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Name</th><th className="px-8 py-5 w-12"></th></tr></thead>
          <tbody>{contacts.map((c:any) => <tr key={c.id} onClick={() => onSelect(c.id)} className="hover:bg-indigo-50/40 cursor-pointer border-b"><td className="px-8 py-6 font-mono font-black text-indigo-600 text-sm">{c.id}</td><td className="px-8 py-6 text-xs font-bold">{c.category}</td><td className="px-8 py-6 text-sm font-bold">{c.companyName || `${c.firstName} ${c.lastName}`}</td><td className="px-8 py-6 text-right"><ChevronRight size={18} className="text-slate-300"/></td></tr>)}</tbody>
        </table>
      </div>
      {showNew && <ContactModal nextId={nextId} onSave={(c) => { onAdd(c); setShowNew(false); }} onClose={() => setShowNew(false)} />}
    </div>
  );
};

export const ContactDetail: React.FC<{ contact: Contact, onBack: () => void, onUpdate: (c: Contact) => void }> = ({ contact, onBack, onUpdate }) => {
  const [isLocked, setIsLocked] = useState(true);
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-20 text-slate-900 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-5">
          <button onClick={onBack} className="p-3 hover:bg-white rounded-2xl border active:scale-90"><ChevronLeft size={24}/></button>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{contact.category} <span className="text-indigo-400 text-xl font-mono ml-2">#{contact.id}</span></h2>
        </div>
        <button onClick={() => setIsLocked(!isLocked)} className={`p-4 rounded-2xl shadow-xl transition-all active:scale-90 border-2 ${isLocked ? 'bg-white border-slate-200 text-slate-300' : 'bg-indigo-600 text-white border-indigo-500'}`}>
          {isLocked ? <Lock size={24}/> : <Unlock size={24}/>}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
          <h3 className="font-black text-slate-800 border-b pb-4 flex items-center text-lg"><UserCircle className="mr-3 text-indigo-600" size={24}/> Stammdaten</h3>
          {contact.category === ContactCategory.COMPANY ? (
            <div className="space-y-6">
              <FormField label="Firmenname" disabled={isLocked} value={contact.companyName} onChange={v => onUpdate({...contact, companyName: v})}/>
              <FormField label="Internetseite" disabled={isLocked} value={contact.website} onChange={v => onUpdate({...contact, website: v})} placeholder="www.beispiel.de"/>
              <div className="grid grid-cols-2 gap-6">
                <FormField label="Branche" disabled={isLocked} value={contact.industry} onChange={v => onUpdate({...contact, industry: v})}/>
                <FormField label="Rechtsform" disabled={isLocked} value={contact.legalForm} onChange={v => onUpdate({...contact, legalForm: v})}/>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField label="Anrede" disabled={isLocked} value={contact.salutation} onChange={v => onUpdate({...contact, salutation: v})}/>
                <FormField label="Titel" disabled={isLocked} value={contact.title} onChange={v => onUpdate({...contact, title: v})}/>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <FormField label="Vorname" disabled={isLocked} value={contact.firstName} onChange={v => onUpdate({...contact, firstName: v})}/>
                <FormField label="Nachname" disabled={isLocked} value={contact.lastName} onChange={v => onUpdate({...contact, lastName: v})}/>
              </div>
            </div>
          )}
        </section>
        <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
          <h3 className="font-black text-slate-800 border-b pb-4 flex items-center text-lg"><MapPin className="mr-3 text-indigo-600" size={24}/> Adresse</h3>
          <AddressFields label="Standardadresse" disabled={isLocked} address={contact.address} onChange={a => onUpdate({...contact, address: a})} />
          <div className="pt-4 border-t">
            <div className="flex items-center space-x-3 mb-6">
              <input type="checkbox" id="billing-check" disabled={isLocked} className="w-5 h-5 rounded-lg text-indigo-600" checked={contact.billingAddressActive} onChange={e => onUpdate({...contact, billingAddressActive: e.target.checked, billingAddress: e.target.checked ? { street: '', houseNumber: '', zip: '', city: '', country: 'Deutschland' } : undefined})} />
              <label htmlFor="billing-check" className="text-xs font-black text-slate-600 uppercase tracking-widest cursor-pointer">Abweichende Rechnungsadresse</label>
            </div>
            {contact.billingAddressActive && contact.billingAddress && (
              <div className="animate-in slide-in-from-top-4 space-y-4">
                <AddressFields label="Rechnungsadresse" disabled={isLocked} address={contact.billingAddress} onChange={a => onUpdate({...contact, billingAddress: a})} />
              </div>
            )}
          </div>
        </section>

        <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8 col-span-2">
           <h3 className="font-black text-slate-800 border-b pb-4 flex items-center text-lg"><Play size={22} className="mr-3 text-indigo-600"/> Kommunikation</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FormField label="UC-ID" disabled={isLocked} value={contact.ucId} onChange={v => onUpdate({...contact, ucId: v})}/>
              <FormField label="E-Mail Beruflich" disabled={isLocked} value={contact.emailBusiness} onChange={v => onUpdate({...contact, emailBusiness: v})}/>
              <FormField label="E-Mail Privat" disabled={isLocked} value={contact.emailPrivate} onChange={v => onUpdate({...contact, emailPrivate: v})}/>
              <FormField label="Telefon Mobil" disabled={isLocked} value={contact.phoneMobile} onChange={v => onUpdate({...contact, phoneMobile: v})}/>
              <FormField label="Telefon Festnetz" disabled={isLocked} value={contact.phoneLandline} onChange={v => onUpdate({...contact, phoneLandline: v})}/>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Kontaktweg</label>
                <select disabled={isLocked} className="w-full border p-3 rounded-2xl text-sm font-bold bg-white outline-none shadow-inner" value={contact.preferredContactWay} onChange={e => onUpdate({...contact, preferredContactWay: e.target.value as any})}>
                  <option>Mobil</option><option>Festnetz</option><option>Email</option><option>Telefon</option>
                </select>
              </div>
           </div>
        </section>

        {contact.category === ContactCategory.PERSON && (
          <section className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8 col-span-2">
            <div className="flex items-center space-x-4 border-b pb-4">
              <input type="checkbox" id="2nd-check" disabled={isLocked} className="w-6 h-6 rounded-xl text-indigo-600" checked={contact.secondPersonActive} onChange={e => onUpdate({...contact, secondPersonActive: e.target.checked, secondPersonData: e.target.checked ? { lastName: '', address: {...contact.address}, preferredContactWay: 'Mobil' } : undefined})} />
              <label htmlFor="2nd-check" className="text-lg font-black text-slate-800">Zweite Person aktiv</label>
            </div>
            {contact.secondPersonActive && contact.secondPersonData && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-top-4">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border-b pb-1">Personendaten (2. Person)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Vorname" disabled={isLocked} value={contact.secondPersonData.firstName} onChange={v => onUpdate({...contact, secondPersonData: {...contact.secondPersonData!, firstName: v}})}/>
                    <FormField label="Nachname" disabled={isLocked} value={contact.secondPersonData.lastName} onChange={v => onUpdate({...contact, secondPersonData: {...contact.secondPersonData!, lastName: v}})}/>
                    <FormField label="UC-ID" disabled={isLocked} value={contact.secondPersonData.ucId} onChange={v => onUpdate({...contact, secondPersonData: {...contact.secondPersonData!, ucId: v}})}/>
                    <FormField label="E-Mail Privat" disabled={isLocked} value={contact.secondPersonData.emailPrivate} onChange={v => onUpdate({...contact, secondPersonData: {...contact.secondPersonData!, emailPrivate: v}})}/>
                    <FormField label="Festnetz" disabled={isLocked} value={contact.secondPersonData.phoneLandline} onChange={v => onUpdate({...contact, secondPersonData: {...contact.secondPersonData!, phoneLandline: v}})}/>
                    <FormField label="Mobil" disabled={isLocked} value={contact.secondPersonData.phoneMobile} onChange={v => onUpdate({...contact, secondPersonData: {...contact.secondPersonData!, phoneMobile: v}})}/>
                  </div>
                </div>
                <div className="space-y-6">
                  <AddressFields label="Adresse (2. Person)" disabled={isLocked} address={contact.secondPersonData.address!} onChange={a => onUpdate({...contact, secondPersonData: {...contact.secondPersonData!, address: a}})} />
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Kontaktweg (2. Person)</label>
                    <select disabled={isLocked} className="w-full border p-3 rounded-2xl text-sm font-bold bg-white outline-none shadow-inner" value={contact.secondPersonData.preferredContactWay} onChange={e => onUpdate({...contact, secondPersonData: {...contact.secondPersonData!, preferredContactWay: e.target.value as any}})}>
                      <option>Mobil</option><option>Festnetz</option><option>Email</option><option>Telefon</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

// --- OBJECTS ---
export const ObjectList: React.FC<{ objects: CRMObject[], onAdd: (o: CRMObject) => void, onSelect: (id: string) => void, nextId: string }> = ({ objects, onSelect, onAdd, nextId }) => {
  const [showNew, setShowNew] = useState(false);
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Objekte</h2>
        <button onClick={() => setShowNew(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-black flex items-center shadow-lg active:scale-95 hover:bg-indigo-700"><Plus size={18} className="mr-2"/> Neuer Objekt</button>
      </div>
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b"><tr><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">ID</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Bezeichnung</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Ort</th><th className="px-8 py-5 w-12"></th></tr></thead>
          <tbody>{objects.map((o:any) => <tr key={o.id} onClick={() => onSelect(o.id)} className="hover:bg-indigo-50/40 cursor-pointer border-b"><td className="px-8 py-6 font-mono font-black text-indigo-600 text-sm">{o.id}</td><td className="px-8 py-6 text-sm font-bold">{o.displayName}</td><td className="px-8 py-6 text-xs font-bold">{o.address.city}</td><td className="px-8 py-6 text-right"><ChevronRight size={18} className="text-slate-300"/></td></tr>)}</tbody>
        </table>
      </div>
      {showNew && <ObjectModal nextId={nextId} onSave={(o:any) => { onAdd(o); setShowNew(false); }} onClose={() => setShowNew(false)} />}
    </div>
  );
};

export const ObjectDetail: React.FC<{ object: CRMObject, contacts: Contact[], onBack: () => void, onUpdate: (o: CRMObject) => void }> = ({ object, contacts, onBack, onUpdate }) => {
  const [isLocked, setIsLocked] = useState(true);
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20 animate-in fade-in">
       <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-3 hover:bg-white rounded-2xl border active:scale-90"><ChevronLeft size={24}/></button>
          <button onClick={() => setIsLocked(!isLocked)} className={`p-4 rounded-2xl shadow-xl transition-all active:scale-90 border-2 ${isLocked ? 'bg-white border-slate-200 text-slate-300' : 'bg-indigo-600 text-white border-indigo-500'}`}>{isLocked ? <Lock size={24}/> : <Unlock size={24}/>}</button>
       </div>
       <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-8">
          <h3 className="font-black text-slate-800 border-b pb-4 flex items-center text-lg"><Building className="mr-3 text-indigo-600" size={24}/> Objekt: {object.displayName}</h3>
          <div className="grid grid-cols-2 gap-8">
             <FormField label="Objekttyp" disabled={isLocked} value={object.objectType} onChange={(v:any) => onUpdate({...object, objectType: v})}/>
             <FormField label="Baujahr" disabled={isLocked} value={object.buildYear} onChange={(v:any) => onUpdate({...object, buildYear: v})}/>
             <FormField label="Wohneinheiten" disabled={isLocked} type="number" value={object.units} onChange={(v:any) => onUpdate({...object, units: parseInt(v)})}/>
          </div>
          <AddressFields label="Objektadresse" disabled={isLocked} address={object.address} onChange={a => onUpdate({...object, address: a})} />
       </div>
    </div>
  );
};

// --- PROCESS FORM ---
export const ProcessForm: React.FC<{
  contacts: Contact[];
  objects: CRMObject[];
  processes: Process[];
  onAddContact: (c: Contact) => void;
  onAddObject: (o: CRMObject) => void;
  onSubmit: (p: Process) => void;
  onCancel: () => void;
  nextContactId: string;
  nextObjectId: string;
}> = ({ contacts, objects, processes, onSubmit, onCancel, nextContactId, nextObjectId, onAddContact, onAddObject }) => {
  const [type, setType] = useState(ProcessType.EB);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [vsProvider, setVsProvider] = useState<'FC'|'STP'>('FC');
  const [vsNumber, setVsNumber] = useState('');
  const [storageLink, setStorageLink] = useState('');
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [objectSearch, setObjectSearch] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showObjectModal, setShowObjectModal] = useState(false);

  const previewId = useMemo(() => {
    if (type === ProcessType.VS) return `VS-${vsProvider}-${vsNumber || '______'}`;
    const cId = selectedContact ? padId(selectedContact, 4) : '0000';
    const oId = selectedObject ? padId(selectedObject, 4) : '0000';
    const prefix = `${type}-${cId}-${oId}-`;
    const count = processes.filter(p => p.processNumber.startsWith(prefix)).length;
    return `${prefix}${padId(count + 1, 2)}`;
  }, [type, vsProvider, vsNumber, selectedContact, selectedObject, processes]);

  const filteredContacts = useMemo(() => {
    if (!customerSearch) return [];
    const q = customerSearch.toLowerCase();
    return contacts.filter(c => (c.companyName || `${c.firstName} ${c.lastName}`).toLowerCase().includes(q));
  }, [customerSearch, contacts]);

  const filteredObjects = useMemo(() => {
    if (!objectSearch) return [];
    const q = objectSearch.toLowerCase();
    return objects.filter(o => o.displayName.toLowerCase().includes(q) || o.address.street.toLowerCase().includes(q));
  }, [objectSearch, objects]);

  const handleCreate = () => {
    if (type === ProcessType.VS && (!vsNumber || vsNumber.length !== 6)) return alert("VS-Nummer ungültig");
    if (type !== ProcessType.VS && (!title || !selectedContact || !selectedObject)) return alert("Bitte alle Felder ausfüllen.");
    onSubmit({ id: Math.random().toString(36).substr(2, 9), processNumber: previewId, type, customerId: selectedContact || '0000', objectId: selectedObject || '0000', title: type === ProcessType.VS ? `VS-Auftrag ${vsNumber}` : title, status: ProcessStatus.LEAD, dateCreated: new Date().toISOString(), serviceProvider: type === ProcessType.VS ? vsProvider : undefined, vsNumber: type === ProcessType.VS ? vsNumber : undefined, invoices: [], storageLink });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 text-slate-900 animate-in slide-in-from-bottom-6">
      <h2 className="text-3xl font-black text-slate-800 tracking-tight">Vorgang anlegen</h2>
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-2xl space-y-10">
        <div className="bg-slate-950 p-7 rounded-3xl mb-2 text-center shadow-2xl border-4 border-slate-900 ring-8 ring-slate-100">
           <p className="text-[10px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em]">Live-Vorschau Vorgangsnummer</p>
           <p className="font-mono text-3xl font-black tracking-[0.25em] text-indigo-400">{previewId}</p>
        </div>
        <div className="grid grid-cols-5 gap-3">
          {Object.values(ProcessType).map(t => <button key={t} onClick={() => setType(t)} className={`py-4 rounded-2xl font-black border-2 transition-all active:scale-90 ${type === t ? 'bg-indigo-600 text-white shadow-xl border-indigo-600' : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'}`}>{t}</button>)}
        </div>
        {type === ProcessType.VS ? (
          <div className="space-y-6 animate-in fade-in">
             <div className="flex space-x-3">{['FC', 'STP'].map(p => <button key={p} onClick={() => setVsProvider(p as any)} className={`flex-1 py-3.5 rounded-2xl border-2 font-black transition-all active:scale-95 ${vsProvider === p ? 'bg-slate-900 text-white border-slate-800' : 'bg-slate-50 text-slate-400'}`}>{p}</button>)}</div>
             <FormField label="VS-Nummer (6-stellig)" value={vsNumber} onChange={(v:any) => setVsNumber(v.replace(/\D/g, '').slice(0,6))} />
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in">
            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Auftraggeber angeben</label>
              <div className="flex space-x-3">
                <input className="flex-1 border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500" placeholder="Suche..." value={customerSearch} onChange={e => { setCustomerSearch(e.target.value); setSelectedContact(null); }} />
                <button onClick={() => setShowCustomerModal(true)} className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100"><Plus size={24}/></button>
              </div>
              {customerSearch && filteredContacts.length > 0 && !selectedContact && (
                <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-2xl mt-2 shadow-2xl z-50 max-h-60 overflow-y-auto">
                   {filteredContacts.map(c => <button key={c.id} onClick={() => { setSelectedContact(c.id); setCustomerSearch(c.companyName || `${c.firstName} ${c.lastName}`); }} className="w-full p-4 text-left text-xs font-black text-slate-700 hover:bg-indigo-50 border-b flex justify-between"><span>{c.companyName || `${c.firstName} ${c.lastName}`}</span><span className="text-indigo-400">ID: {c.id}</span></button>)}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Objekt angeben</label>
              <div className="flex space-x-3">
                <input className="flex-1 border-2 border-slate-100 p-4 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500" placeholder="Suche..." value={objectSearch} onChange={e => { setObjectSearch(e.target.value); setSelectedObject(null); }} />
                <button onClick={() => setShowObjectModal(true)} className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100"><Plus size={24}/></button>
              </div>
              {objectSearch && filteredObjects.length > 0 && !selectedObject && (
                <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-2xl mt-2 shadow-2xl z-50 max-h-60 overflow-y-auto">
                   {filteredObjects.map(o => <button key={o.id} onClick={() => { setSelectedObject(o.id); setObjectSearch(o.displayName); }} className="w-full p-4 text-left text-xs font-black text-slate-700 hover:bg-indigo-50 border-b flex justify-between"><span>{o.displayName}</span><span className="text-indigo-400">ID: {o.id}</span></button>)}
                </div>
              )}
            </div>
            <FormField label="Titel / Vorgangsbeschreibung" value={title} onChange={(v:any) => setTitle(v)} />
            <FormField label="Ablage-Link (UNC oder Pfad)" value={storageLink} onChange={(v:any) => setStorageLink(v)} placeholder="\\Server\Freigabe\Ordner" />
          </div>
        )}
        <div className="flex space-x-5 pt-6 border-t">
          <button onClick={onCancel} className="flex-1 py-4 border-2 rounded-2xl font-black text-slate-400">ABBRECHEN</button>
          <button onClick={handleCreate} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl">VORGANG ERSTELLEN</button>
        </div>
      </div>
      {showCustomerModal && <ContactModal nextId={nextContactId} onSave={(c:any) => { onAddContact(c); setShowCustomerModal(false); setSelectedContact(c.id); setCustomerSearch(c.companyName || `${c.firstName} ${c.lastName}`); }} onClose={() => setShowCustomerModal(false)} />}
      {showObjectModal && <ObjectModal nextId={nextObjectId} onSave={(o:any) => { onAddObject(o); setShowObjectModal(false); setSelectedObject(o.id); setObjectSearch(o.displayName); }} onClose={() => setShowObjectModal(false)} />}
    </div>
  );
};

// --- MODALS ---
export const ContactModal: React.FC<{ nextId: string, onSave: (c: Contact) => void, onClose: () => void }> = ({ nextId, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<Contact>>({ 
    id: nextId, category: ContactCategory.PERSON, 
    address: { street: '', houseNumber: '', zip: '', city: '', country: 'Deutschland' }, 
    billingAddressActive: false, secondPersonActive: false, 
    internalNotes: '', preferredContactWay: 'Mobil', 
    phoneMobile: '', phoneLandline: '', emailBusiness: '' 
  });
  return (
    <Modal title={`Neuer Kontakt #${nextId}`} onClose={onClose}>
      <div className="space-y-8">
        <div className="flex space-x-4">
          {Object.values(ContactCategory).map(cat => <button key={cat} onClick={() => setForm({...form, category: cat})} className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all ${form.category === cat ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-400 border-transparent'}`}>{cat}</button>)}
        </div>
        <div className="grid grid-cols-2 gap-8">
          {form.category === ContactCategory.COMPANY ? (
            <div className="space-y-4">
              <FormField label="Firmenname" value={form.companyName} onChange={(v:any) => setForm({...form, companyName: v})} />
              <FormField label="Internetseite" value={form.website} onChange={(v:any) => setForm({...form, website: v})} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Vorname" value={form.firstName} onChange={(v:any) => setForm({...form, firstName: v})} />
              <FormField label="Nachname" value={form.lastName} onChange={(v:any) => setForm({...form, lastName: v})} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4"><FormField label="E-Mail" value={form.emailBusiness} onChange={(v:any) => setForm({...form, emailBusiness: v})} /><FormField label="Telefon Mobil" value={form.phoneMobile} onChange={(v:any) => setForm({...form, phoneMobile: v})} /></div>
        </div>
        <button onClick={() => onSave(form as Contact)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">KONTAKT SPEICHERN</button>
      </div>
    </Modal>
  );
};

export const ObjectModal: React.FC<{ nextId: string, onSave: (o: CRMObject) => void, onClose: () => void }> = ({ nextId, onSave, onClose }) => {
  const [form, setForm] = useState<Partial<CRMObject>>({ id: nextId, displayName: '', objectType: 'Gebäude', address: { street: '', houseNumber: '', zip: '', city: '', country: 'Deutschland' }, owners: [], notes: '' });
  return (
    <Modal title={`Neues Objekt #${nextId}`} onClose={onClose}>
      <div className="space-y-8">
        <FormField label="Objekt-Bezeichnung" value={form.displayName} onChange={(v:any) => setForm({...form, displayName: v})} />
        <AddressFields label="Adresse" disabled={false} address={form.address!} onChange={a => setForm({...form, address: a})} />
        <button onClick={() => onSave(form as CRMObject)} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all">OBJEKT SPEICHERN</button>
      </div>
    </Modal>
  );
};

export const AdminView: React.FC<{ users: User[], onSaveUser: (u: any, isNew: boolean) => void, onDeleteUser: (id: string) => void }> = ({ users, onSaveUser, onDeleteUser }) => {
  const [showModal, setShowModal] = useState<User | 'new' | null>(null);
  const saveUser = (u: any) => {
    onSaveUser(u, showModal === 'new');
    setShowModal(null);
  };
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-black text-slate-800 tracking-tight">Benutzerverwaltung</h2><button onClick={() => setShowModal('new')} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center shadow-lg"><UserPlus size={18} className="mr-2"/> Nutzer erstellen</button></div>
      <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase">Nutzer</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase">Benutzername</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase">Rolle</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase">Kosten (€/h)</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase">Status</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase">Aktion</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-slate-50">
                <td className="px-8 py-5 text-sm font-bold text-slate-700">{u.name || '-'}</td>
                <td className="px-8 py-5 text-xs font-bold text-slate-500">{u.username || '-'}</td>
                <td className="px-8 py-5 text-xs font-bold text-indigo-500">{u.role || '-'}</td>
                <td className="px-8 py-5 text-xs font-bold text-slate-600">{(Number(u.costRate) || 0).toFixed(2)}</td>
                <td className="px-8 py-5">{u.isLocked ? <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-full border border-rose-100"><Lock size={12} className="inline mr-1"/>Gesperrt</span> : <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100"><Unlock size={12} className="inline mr-1"/>Aktiv</span>}</td>
                <td className="px-8 py-5 flex items-center space-x-2">
                  <button onClick={() => setShowModal(u)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit2 size={16}/></button>
                  <button onClick={() => { if (window.confirm('Benutzer wirklich löschen?')) onDeleteUser(u.id); }} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showModal && <UserEditModal user={showModal === 'new' ? undefined : showModal} onSave={saveUser} onClose={() => setShowModal(null)} />}
    </div>
  );
};

const UserEditModal: React.FC<{ user?: User, onSave: (u: any) => void, onClose: () => void }> = ({ user, onSave, onClose }) => {
  const [form, setForm] = useState<User>(user || {
    id: Math.random().toString(36).substr(2, 9),
    name: '',
    username: '',
    role: UserRole.STANDARD,
    failedAttempts: 0,
    isLocked: false,
    costRate: 0,
    rates: [{ roleName: 'Intern', rate: 0 }],
    standardRateProfileId: 'Intern'
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const addRate = () => setForm({...form, rates: [...form.rates, { roleName: '', rate: 0 }]});
  const updateRate = (idx: number, field: keyof UserRate, val: any) => {
    const newRates = [...form.rates];
    newRates[idx] = { ...newRates[idx], [field]: val };
    setForm({...form, rates: newRates});
  };

  const handleSave = () => {
    if (!form.name || !form.username) { setError('Name und Benutzername sind erforderlich'); return; }
    if (!user && !password) { setError('Passwort ist für neue Benutzer erforderlich'); return; }
    onSave({ ...form, password: password || undefined });
  };

  return (
    <Modal title={user ? "Nutzer editieren" : "Neuer Nutzer"} onClose={onClose}>
      <div className="space-y-8">
        {error && <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-2xl text-sm font-bold border border-rose-100">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="font-bold text-slate-800 border-b pb-2 flex items-center"><UserCircle size={18} className="mr-2 text-indigo-600"/> Stammdaten</h4>
            <FormField label="Name" value={form.name} onChange={(v:any) => setForm({...form, name: v})} autoFocus />
            <FormField label="Benutzername" value={form.username} onChange={(v:any) => setForm({...form, username: v})} />
            <FormField label={user ? "Neues Passwort (leer = unverändert)" : "Passwort"} type="password" value={password} onChange={(v:any) => setPassword(v)} placeholder={user ? "Nur bei Änderung eingeben" : "Passwort vergeben"} />
            <FormField label="Kosten pro Stunde (€)" type="number" value={form.costRate} onChange={(v:any) => setForm({...form, costRate: parseFloat(v) || 0})} />
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Systemrolle</label>
              <select className="w-full bg-white border border-slate-300 px-3 py-2 rounded-xl text-sm font-bold" value={form.role} onChange={e => setForm({...form, role: e.target.value as UserRole})}>
                {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-center space-x-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Konto gesperrt</label>
              <button
                onClick={() => setForm({...form, isLocked: !form.isLocked})}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${form.isLocked ? 'bg-rose-100 text-rose-600 border border-rose-200' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'}`}
              >
                {form.isLocked ? <><Lock size={14} className="inline mr-1"/>Gesperrt</> : <><Unlock size={14} className="inline mr-1"/>Aktiv</>}
              </button>
            </div>
          </div>
          <div className="space-y-6">
            <h4 className="font-bold text-slate-800 border-b pb-2 flex justify-between items-center">
              <span className="flex items-center"><Euro size={18} className="mr-2 text-indigo-600"/> Stundensätze (Verrechnung)</span>
              <button onClick={addRate} className="text-indigo-600 hover:bg-indigo-50 p-1.5 rounded-full transition-all"><Plus size={18}/></button>
            </h4>
            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {form.rates.map((r, idx) => (
                <div key={idx} className="flex items-center space-x-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 shadow-sm">
                  <input className="flex-1 bg-transparent text-xs font-bold outline-none text-slate-800" placeholder="Bezeichnung" value={r.roleName} onChange={e => updateRate(idx, 'roleName', e.target.value)}/>
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
                    <input className="w-16 text-right text-xs font-bold outline-none text-indigo-600" type="number" value={r.rate} onChange={e => updateRate(idx, 'rate', parseFloat(e.target.value))}/>
                    <span className="text-[10px] ml-1.5 font-bold text-slate-400">€/h</span>
                  </div>
                  <input type="radio" name="default-rate" checked={form.standardRateProfileId === r.roleName} onChange={() => setForm({...form, standardRateProfileId: r.roleName})} />
                  <button onClick={() => setForm({...form, rates: form.rates.filter((_, i) => i !== idx)})} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all active:scale-95">NUTZER SPEICHERN</button>
      </div>
    </Modal>
  );
};

// --- LOGIN SCREEN ---
export const LoginScreen: React.FC<{ onLogin: (u: string, p: string) => void }> = ({ onLogin }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  return (
    <div className="h-screen flex items-center justify-center login-gradient p-4">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-12 space-y-10 animate-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <div className="bg-indigo-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200 rotate-6 transform hover:rotate-0 transition-all">
            <ShieldCheck className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">KMU CRM <span className="text-indigo-600 italic">Pro</span></h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Raspberry Pi Instance Secured</p>
        </div>
        <div className="space-y-4">
          <input
            type="text" placeholder="Benutzername"
            className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700"
            value={user} onChange={e => setUser(e.target.value)}
          />
          <input
            type="password" placeholder="Passwort"
            className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700"
            value={pass} onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onLogin(user, pass)}
          />
          <button
            onClick={() => onLogin(user, pass)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-3xl font-black shadow-2xl shadow-indigo-900/20 transition-all active:scale-95 flex items-center justify-center space-x-2"
          >
            <span>SYSTEM BETRETEN</span> <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
