import React, { useState, useMemo } from 'react';
import {
  LogOut, ShieldCheck, LayoutDashboard, FolderOpen, Users, Home, Plus,
  ChevronRight, FileText, Clock, User as UserIcon, Phone, Mail, ArrowLeft,
  Lock, Unlock, MapPin, Play, Building, Trash2, Globe, Settings
} from 'lucide-react';
import { formatDate, formatDuration, formatEuroDashboard } from '../utils';
import { ContactCategory, ProcessType, ProcessStatus } from '../types';

// ─── Shared Helpers ──────────────────────────────────────────────────────────
const Lbl: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{children}</label>
);

const Inp: React.FC<any> = ({ label, value, onChange, readOnly, type, placeholder, className, ...rest }) => (
  <div className={className || ''}>
    {label && <Lbl>{label}</Lbl>}
    <input
      type={type || 'text'}
      className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-medium outline-none transition-all ${readOnly ? 'opacity-60 cursor-not-allowed' : 'focus:ring-2 focus:ring-indigo-100'}`}
      value={value || ''}
      onChange={e => onChange?.(e.target.value)}
      readOnly={readOnly}
      placeholder={placeholder}
      {...rest}
    />
  </div>
);

const Sel: React.FC<any> = ({ label, value, onChange, options, readOnly, className }) => (
  <div className={className || ''}>
    {label && <Lbl>{label}</Lbl>}
    <select
      className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-medium outline-none appearance-none transition-all ${readOnly ? 'opacity-60 pointer-events-none' : ''}`}
      value={value || ''}
      onChange={e => onChange?.(e.target.value)}
      disabled={readOnly}
    >
      {options?.map((o: any) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
    </select>
  </div>
);

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 ${className || ''}`}>{children}</div>
);

const SectionHead: React.FC<{ icon: any; label: string }> = ({ icon: Icon, label }) => (
  <div className="flex items-center space-x-3 mb-6">
    <Icon size={20} className="text-indigo-600" />
    <h3 className="text-lg font-black text-slate-900">{label}</h3>
  </div>
);

const AddressBlock: React.FC<{ title: string; address: any; onChange: (a: any) => void; readOnly: boolean }> = ({ title, address, onChange, readOnly }) => {
  const a = address || { street: '', houseNumber: '', zip: '', city: '', country: 'Deutschland' };
  const set = (k: string, v: string) => onChange({ ...a, [k]: v });
  return (
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{title}</p>
      <div className="grid grid-cols-4 gap-4">
        <Inp className="col-span-3" label="Strasse" value={a.street} onChange={(v: string) => set('street', v)} readOnly={readOnly} />
        <Inp label="Hnr." value={a.houseNumber} onChange={(v: string) => set('houseNumber', v)} readOnly={readOnly} />
      </div>
      <div className="grid grid-cols-4 gap-4 mt-3">
        <Inp label="PLZ" value={a.zip} onChange={(v: string) => set('zip', v)} readOnly={readOnly} />
        <Inp className="col-span-3" label="Ort" value={a.city} onChange={(v: string) => set('city', v)} readOnly={readOnly} />
      </div>
      <div className="mt-3">
        <Inp label="Land" value={a.country} onChange={(v: string) => set('country', v)} readOnly={readOnly} />
      </div>
    </div>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; variant?: string }> = ({ children, variant = 'indigo' }) => {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    red: 'bg-rose-50 text-rose-700 border-rose-100',
    yellow: 'bg-amber-50 text-amber-700 border-amber-100',
    gray: 'bg-slate-50 text-slate-600 border-slate-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border tracking-wider ${colors[variant] || colors.indigo}`}>
      {children}
    </span>
  );
};

// ─── Layout ──────────────────────────────────────────────────────────────────
export const Layout: React.FC<any> = ({ children, onLogout, currentUser, activeTab, setActiveTab }) => {
  const menu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'processes', label: 'Vorgaenge', icon: FolderOpen },
    { id: 'contacts', label: 'Kontakte', icon: Users },
    { id: 'objects', label: 'Objekte', icon: Home },
    { id: 'internal', label: 'Interne Zeiten', icon: Clock },
  ];
  if (currentUser?.role === 'ADMIN') {
    menu.push({ id: 'admin', label: 'Administration', icon: Settings });
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 shadow-sm">
        <div className="p-8 flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-2xl"><ShieldCheck size={24} className="text-white" /></div>
          <span className="text-xl font-black text-slate-900">CRM <span className="text-indigo-600">Pro</span></span>
        </div>
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {menu.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl font-bold transition-all ${
                activeTab === item.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <item.icon size={20} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-slate-100">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">{currentUser?.name?.charAt(0)}</div>
            <div>
              <p className="text-sm font-black text-slate-900">{currentUser?.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentUser?.role}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center space-x-2 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs">
            <LogOut size={16} /><span>ABMELDEN</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-72 p-12 overflow-auto">{children}</main>
    </div>
  );
};

// ─── Dashboard ───────────────────────────────────────────────────────────────
export const Dashboard: React.FC<any> = ({ processes, contacts, notes, users, objects }) => {
  const stats = useMemo(() => {
    const totalHours = (notes || []).reduce((sum: number, n: any) => sum + (Number(n.duration) || 0), 0);
    const totalRevenue = (notes || []).reduce((sum: number, n: any) => {
      const user = (users || []).find((u: any) => u.id === n.userId);
      const rate = (user?.rates || [])[0]?.rate || 0;
      return sum + (Number(n.duration) || 0) * (Number(rate) || 0);
    }, 0);
    const totalCost = (notes || []).reduce((sum: number, n: any) => {
      const user = (users || []).find((u: any) => u.id === n.userId);
      return sum + (Number(n.duration) || 0) * (Number(user?.costRate) || 0);
    }, 0);
    return { totalHours, totalRevenue, totalCost };
  }, [notes, users]);

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Systemuebersicht</h2>
        <p className="text-slate-500 font-medium">Willkommen zurueck in Ihrem CRM.</p>
      </header>
      <div className="grid grid-cols-3 gap-8">
        <Card>
          <FolderOpen className="text-indigo-600 mb-4" size={32} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktive Vorgaenge</p>
          <p className="text-4xl font-black text-slate-900">{(processes || []).length}</p>
        </Card>
        <Card>
          <Users className="text-green-600 mb-4" size={32} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kontakte</p>
          <p className="text-4xl font-black text-slate-900">{(contacts || []).length}</p>
        </Card>
        <Card>
          <Home className="text-amber-600 mb-4" size={32} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objekte</p>
          <p className="text-4xl font-black text-slate-900">{(objects || []).length}</p>
        </Card>
      </div>
      <div className="grid grid-cols-3 gap-8">
        <Card>
          <Clock className="text-indigo-600 mb-4" size={32} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gesamtstunden</p>
          <p className="text-4xl font-black text-slate-900">{(Number(stats.totalHours) || 0).toFixed(1)} h</p>
        </Card>
        <Card>
          <FileText className="text-green-600 mb-4" size={32} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Umsatz</p>
          <p className="text-4xl font-black text-slate-900">{formatEuroDashboard(stats.totalRevenue)}</p>
        </Card>
        <Card>
          <UserIcon className="text-rose-500 mb-4" size={32} />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kosten</p>
          <p className="text-4xl font-black text-slate-900">{formatEuroDashboard(stats.totalCost)}</p>
        </Card>
      </div>
    </div>
  );
};

// ─── ProcessList ─────────────────────────────────────────────────────────────
export const ProcessList: React.FC<any> = ({ processes, contacts, onSelect, onNew }) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <h2 className="text-3xl font-black text-slate-900">Vorgaenge</h2>
      <button onClick={onNew} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 flex items-center space-x-2">
        <Plus size={18} /><span>NEU</span>
      </button>
    </div>
    <Card className="!p-0 overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Nr.</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Titel</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Status</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Typ</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-right">Aktion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {(processes || []).map((p: any) => (
            <tr key={p.id} onClick={() => onSelect(p)} className="hover:bg-slate-50 transition-all cursor-pointer group">
              <td className="px-8 py-6 font-bold text-indigo-600 text-sm">{p.processNumber}</td>
              <td className="px-8 py-6">
                <p className="text-sm font-black text-slate-900">{p.title}</p>
                <p className="text-[11px] font-bold text-slate-400">{formatDate(p.dateCreated)}</p>
              </td>
              <td className="px-8 py-6"><Badge variant={p.status === 'Abgeschlossen' ? 'green' : p.status === 'Abgebrochen' ? 'red' : 'indigo'}>{p.status}</Badge></td>
              <td className="px-8 py-6 text-sm font-bold text-slate-500">{p.type}</td>
              <td className="px-8 py-6 text-right"><ChevronRight size={18} className="inline text-slate-200 group-hover:text-indigo-600" /></td>
            </tr>
          ))}
          {(!processes || processes.length === 0) && (
            <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-bold">Keine Vorgaenge vorhanden</td></tr>
          )}
        </tbody>
      </table>
    </Card>
  </div>
);

// ─── ProcessDetail ───────────────────────────────────────────────────────────
export const ProcessDetail: React.FC<any> = ({ process, notes, users, contacts, objects, currentUser, onBack, onSaveNote, onDelete, onUpdate }) => {
  const [text, setText] = useState('');
  const [dur, setDur] = useState('0.25');
  const [rateProfileId, setRateProfileId] = useState(currentUser?.standardRateProfileId || '');

  const customer = (contacts || []).find((c: any) => String(c.id) === String(process.customerId));
  const obj = (objects || []).find((o: any) => String(o.id) === String(process.objectId));

  const totalHours = (notes || []).reduce((s: number, n: any) => s + (Number(n.duration) || 0), 0);
  const totalRevenue = (notes || []).reduce((s: number, n: any) => {
    const u = (users || []).find((u: any) => u.id === n.userId);
    const rate = (u?.rates || []).find((r: any) => r.roleName === n.rateProfileId)?.rate || (u?.rates || [])[0]?.rate || 0;
    return s + (Number(n.duration) || 0) * (Number(rate) || 0);
  }, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 font-bold hover:text-slate-900">
          <ArrowLeft size={18} /><span>ZURUECK</span>
        </button>
        <button onClick={onDelete} className="flex items-center space-x-2 text-rose-500 font-bold hover:text-rose-700 bg-rose-50 px-4 py-2 rounded-xl">
          <Trash2 size={16} /><span>LOESCHEN</span>
        </button>
      </div>
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-black text-slate-900">{process.title}</h2>
          <p className="text-indigo-600 font-bold">{process.processNumber}</p>
          {customer && <p className="text-sm text-slate-500 mt-1">Kunde: {customer.companyName || `${customer.lastName}, ${customer.firstName}`}</p>}
          {obj && <p className="text-sm text-slate-500">Objekt: {obj.displayName}</p>}
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="green">{process.status}</Badge>
          <Badge>{process.type}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stunden</p><p className="text-2xl font-black text-slate-900">{(Number(totalHours) || 0).toFixed(1)} h</p></Card>
        <Card><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Umsatz</p><p className="text-2xl font-black text-slate-900">{formatEuroDashboard(totalRevenue)}</p></Card>
        <Card><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktenvermerke</p><p className="text-2xl font-black text-slate-900">{(notes || []).length}</p></Card>
      </div>

      <div className="grid grid-cols-3 gap-10">
        <Card className="col-span-2 space-y-8">
          <SectionHead icon={FileText} label="Aktenvermerke" />
          <div className="space-y-4">
            <textarea
              className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl min-h-[120px] outline-none font-medium"
              placeholder="Was ist passiert?" value={text} onChange={e => setText(e.target.value)}
            />
            <div className="flex items-center space-x-4">
              <input type="number" step="0.25" className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 w-24 font-bold"
                value={dur} onChange={e => setDur(e.target.value)} />
              <Sel
                label="" value={rateProfileId}
                onChange={(v: string) => setRateProfileId(v)}
                options={[
                  ...(currentUser?.rates || []).map((r: any) => ({ value: r.roleName, label: r.roleName })),
                  ...(!(currentUser?.rates || []).length ? [{ value: 'Standard', label: 'Standard' }] : []),
                ]}
                className="flex-1"
              />
              <button
                onClick={() => {
                  if (!text.trim()) return;
                  onSaveNote({ processId: process.id, processNumber: process.processNumber, text, duration: parseFloat(dur) || 0, rateProfileId });
                  setText(''); setDur('0.25');
                }}
                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100"
              >SPEICHERN</button>
            </div>
          </div>
          <div className="space-y-6 pt-6 border-t border-slate-50">
            {(notes || []).map((n: any) => (
              <div key={n.id} className="flex space-x-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-bold text-slate-400 uppercase tracking-tighter shrink-0">{(n.userName || '?').charAt(0)}</div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-black text-slate-900">{n.userName}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(n.timestamp)} &bull; {formatDuration(n.duration)}</span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{n.text}</p>
                </div>
              </div>
            ))}
            {(!notes || notes.length === 0) && <p className="text-slate-400 text-sm font-medium text-center py-8">Noch keine Aktenvermerke</p>}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionHead icon={UserIcon} label="Details" />
            <div className="space-y-3 text-sm">
              <div><Lbl>Typ</Lbl><p className="font-bold">{process.type}</p></div>
              <div><Lbl>Status</Lbl><p className="font-bold">{process.status}</p></div>
              <div><Lbl>Erstellt</Lbl><p className="font-bold">{formatDate(process.dateCreated)}</p></div>
              {process.storageLink && <div><Lbl>Ablage</Lbl><a href={process.storageLink} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline">Ordner oeffnen</a></div>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ─── ContactList ─────────────────────────────────────────────────────────────
export const ContactList: React.FC<any> = ({ contacts, onSelect, onNew }) => {
  const handleNew = (category: string) => {
    onNew({
      category,
      companyName: category === 'Unternehmen' ? 'Neues Unternehmen' : '',
      firstName: category === 'Privatperson' ? '' : '',
      lastName: category === 'Privatperson' ? 'Neu' : '',
      phoneMobile: '', phoneLandline: '', emailBusiness: '',
      address: { street: '', houseNumber: '', zip: '', city: '', country: 'Deutschland' },
      internalNotes: '',
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900">Kontakte</h2>
        <div className="flex space-x-3">
          <button onClick={() => handleNew('Privatperson')} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 flex items-center space-x-2">
            <Plus size={16} /><span>PRIVAT</span>
          </button>
          <button onClick={() => handleNew('Unternehmen')} className="bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 flex items-center space-x-2">
            <Plus size={16} /><span>GEWERBL.</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {(contacts || []).map((c: any) => (
          <div key={c.id} onClick={() => onSelect(c)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                {(c.lastName || c.companyName || '?').charAt(0)}
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">{c.companyName || `${c.lastName}, ${c.firstName}`}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{c.category}</p>
              </div>
            </div>
            <ChevronRight className="text-slate-200 group-hover:text-indigo-600" />
          </div>
        ))}
        {(!contacts || contacts.length === 0) && (
          <div className="col-span-2 text-center py-12 text-slate-400 font-bold">Keine Kontakte vorhanden</div>
        )}
      </div>
    </div>
  );
};

// ─── ContactDetail ───────────────────────────────────────────────────────────
export const ContactDetail: React.FC<any> = ({ contact, currentUser, onBack, onSave }) => {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({ ...contact });
  const isCompany = form.category === 'Unternehmen';

  const set = (key: string, val: any) => setForm((p: any) => ({ ...p, [key]: val }));
  const ro = !editMode;

  const companyContacts = form.contacts || [];
  const setCompanyContacts = (newContacts: any[]) => set('contacts', newContacts);
  const addContact = () => setCompanyContacts([...companyContacts, { id: 'cc-' + Date.now(), firstName: '', lastName: '', role: '', email: '', phoneLandline: '', phoneMobile: '', internalNotes: '' }]);
  const removeContact = (idx: number) => setCompanyContacts(companyContacts.filter((_: any, i: number) => i !== idx));
  const updateCompanyContact = (idx: number, key: string, val: string) => {
    const updated = [...companyContacts];
    updated[idx] = { ...updated[idx], [key]: val };
    setCompanyContacts(updated);
  };

  const sp = form.secondPersonData || { firstName: '', lastName: '', ucId: '', emailPrivate: '', phoneLandline: '', phoneMobile: '', address: { street: '', houseNumber: '', zip: '', city: '', country: 'Deutschland' }, preferredContactWay: 'Email' };
  const setSp = (key: string, val: any) => set('secondPersonData', { ...sp, [key]: val });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 font-bold hover:text-slate-900">
          <ArrowLeft size={18} /><span>ZURUECK</span>
        </button>
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-black text-slate-900">{isCompany ? 'Unternehmen' : 'Privatperson'} #{form.id}</h2>
          <button onClick={() => setEditMode(!editMode)} className={`p-2 rounded-xl transition-all ${editMode ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
            {editMode ? <Unlock size={20} /> : <Lock size={20} />}
          </button>
        </div>
      </div>

      {/* Stammdaten + Adresse */}
      <div className="grid grid-cols-2 gap-8">
        <Card>
          <SectionHead icon={UserIcon} label="Stammdaten" />
          <div className="border-t border-slate-100 pt-6 space-y-4">
            {isCompany ? (
              <>
                <Inp label="Firmenname" value={form.companyName} onChange={(v: string) => set('companyName', v)} readOnly={ro} />
                <Inp label="Internetseite" value={form.website} onChange={(v: string) => set('website', v)} readOnly={ro} />
                <div className="grid grid-cols-2 gap-4">
                  <Inp label="Branche" value={form.industry} onChange={(v: string) => set('industry', v)} readOnly={ro} />
                  <Inp label="Rechtsform" value={form.legalForm} onChange={(v: string) => set('legalForm', v)} readOnly={ro} />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Sel label="Anrede" value={form.salutation} onChange={(v: string) => set('salutation', v)} readOnly={ro}
                    options={[{ value: '', label: '--' }, { value: 'Herr', label: 'Herr' }, { value: 'Frau', label: 'Frau' }]} />
                  <Inp label="Titel" value={form.title} onChange={(v: string) => set('title', v)} readOnly={ro} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Inp label="Vorname" value={form.firstName} onChange={(v: string) => set('firstName', v)} readOnly={ro} />
                  <Inp label="Nachname" value={form.lastName} onChange={(v: string) => set('lastName', v)} readOnly={ro} />
                </div>
              </>
            )}
          </div>
        </Card>

        <Card>
          <SectionHead icon={MapPin} label="Adresse" />
          <div className="border-t border-slate-100 pt-6 space-y-6">
            <AddressBlock title="STANDARDADRESSE" address={form.address} onChange={(a: any) => set('address', a)} readOnly={ro} />
            <label className="flex items-center space-x-3 cursor-pointer mt-4">
              <input type="checkbox" checked={form.billingAddressActive || false}
                onChange={e => set('billingAddressActive', e.target.checked)} disabled={ro}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Abweichende Rechnungsadresse</span>
            </label>
            {form.billingAddressActive && (
              <AddressBlock title="RECHNUNGSADRESSE" address={form.billingAddress || {}} onChange={(a: any) => set('billingAddress', a)} readOnly={ro} />
            )}
          </div>
        </Card>
      </div>

      {/* Kommunikation */}
      {isCompany ? (
        <>
          {companyContacts.map((cc: any, idx: number) => (
            <Card key={cc.id || idx}>
              <div className="flex items-center justify-between mb-6">
                <SectionHead icon={Play} label={`Kommunikation ${cc.firstName || cc.lastName ? '- ' + (cc.firstName || '') + ' ' + (cc.lastName || '') : '- Neuer Ansprechpartner'}`} />
                {editMode && (
                  <button onClick={() => removeContact(idx)} className="text-rose-500 font-black text-xs bg-rose-50 px-3 py-1.5 rounded-xl hover:bg-rose-100">ENTFERNEN</button>
                )}
              </div>
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Sel label="Anrede" value={cc.salutation || ''} onChange={(v: string) => updateCompanyContact(idx, 'salutation', v)} readOnly={ro}
                    options={[{ value: '', label: '--' }, { value: 'Herr', label: 'Herr' }, { value: 'Frau', label: 'Frau' }]} />
                  <Inp label="Vorname" value={cc.firstName} onChange={(v: string) => updateCompanyContact(idx, 'firstName', v)} readOnly={ro} />
                  <Inp label="Nachname" value={cc.lastName} onChange={(v: string) => updateCompanyContact(idx, 'lastName', v)} readOnly={ro} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Inp label="Rolle/Funktion" value={cc.role} onChange={(v: string) => updateCompanyContact(idx, 'role', v)} readOnly={ro} />
                  <Inp label="UC-ID" value={cc.ucId} onChange={(v: string) => updateCompanyContact(idx, 'ucId', v)} readOnly={ro} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Inp label="E-Mail" value={cc.email} onChange={(v: string) => updateCompanyContact(idx, 'email', v)} readOnly={ro} />
                  <Inp label="Telefon Festnetz" value={cc.phoneLandline} onChange={(v: string) => updateCompanyContact(idx, 'phoneLandline', v)} readOnly={ro} />
                  <Inp label="Telefon Mobil" value={cc.phoneMobile} onChange={(v: string) => updateCompanyContact(idx, 'phoneMobile', v)} readOnly={ro} />
                </div>
                <Inp label="Interne Notizen" value={cc.internalNotes} onChange={(v: string) => updateCompanyContact(idx, 'internalNotes', v)} readOnly={ro} />
              </div>
            </Card>
          ))}
          {editMode && (
            <button onClick={addContact} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-sm hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center space-x-2">
              <Plus size={18} /><span>ANSPRECHPARTNER HINZUFUEGEN</span>
            </button>
          )}
        </>
      ) : (
        <>
          <Card>
            <SectionHead icon={Play} label="Kommunikation" />
            <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Inp label="UC-ID" value={form.ucId} onChange={(v: string) => set('ucId', v)} readOnly={ro} />
                <Inp label="E-Mail Beruflich" value={form.emailBusiness} onChange={(v: string) => set('emailBusiness', v)} readOnly={ro} />
                <Inp label="E-Mail Privat" value={form.emailPrivate} onChange={(v: string) => set('emailPrivate', v)} readOnly={ro} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Inp label="Telefon Mobil" value={form.phoneMobile} onChange={(v: string) => set('phoneMobile', v)} readOnly={ro} />
                <Inp label="Telefon Festnetz" value={form.phoneLandline} onChange={(v: string) => set('phoneLandline', v)} readOnly={ro} />
                <Sel label="Kontaktweg" value={form.preferredContactWay} onChange={(v: string) => set('preferredContactWay', v)} readOnly={ro}
                  options={['Mobil', 'Festnetz', 'Email', 'Telefon'].map(v => ({ value: v, label: v }))} />
              </div>
            </div>
          </Card>

          <Card>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" checked={form.secondPersonActive || false}
                onChange={e => set('secondPersonActive', e.target.checked)} disabled={ro}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600" />
              <span className="text-lg font-black text-slate-900">Zweite Person aktiv</span>
            </label>
            {form.secondPersonActive && (
              <div className="grid grid-cols-2 gap-8 mt-6 pt-6 border-t border-slate-100">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personendaten (2. Person)</p>
                  <Inp label="Vorname" value={sp.firstName} onChange={(v: string) => setSp('firstName', v)} readOnly={ro} />
                  <Inp label="Nachname" value={sp.lastName} onChange={(v: string) => setSp('lastName', v)} readOnly={ro} />
                  <Inp label="UC-ID" value={sp.ucId} onChange={(v: string) => setSp('ucId', v)} readOnly={ro} />
                  <Inp label="E-Mail Privat" value={sp.emailPrivate} onChange={(v: string) => setSp('emailPrivate', v)} readOnly={ro} />
                  <Inp label="Festnetz" value={sp.phoneLandline} onChange={(v: string) => setSp('phoneLandline', v)} readOnly={ro} />
                  <Inp label="Mobil" value={sp.phoneMobile} onChange={(v: string) => setSp('phoneMobile', v)} readOnly={ro} />
                </div>
                <div className="space-y-4">
                  <AddressBlock title="ADRESSE (2. PERSON)" address={sp.address} onChange={(a: any) => setSp('address', a)} readOnly={ro} />
                </div>
                <Sel label="Kontaktweg (2. Person)" value={sp.preferredContactWay} onChange={(v: string) => setSp('preferredContactWay', v)} readOnly={ro}
                  options={['Mobil', 'Festnetz', 'Email', 'Telefon'].map(v => ({ value: v, label: v }))} className="col-span-2" />
              </div>
            )}
          </Card>
        </>
      )}

      {/* Internal Notes */}
      <Card>
        <SectionHead icon={FileText} label="Interne Notizen" />
        <textarea
          className={`w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl min-h-[80px] outline-none font-medium ${ro ? 'opacity-60 cursor-not-allowed' : ''}`}
          value={form.internalNotes || ''} onChange={e => set('internalNotes', e.target.value)} readOnly={ro}
        />
      </Card>

      {editMode && (
        <div className="flex justify-end">
          <button onClick={() => onSave(form)} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 text-sm">
            SPEICHERN
          </button>
        </div>
      )}
    </div>
  );
};

// ─── ObjectList ──────────────────────────────────────────────────────────────
export const ObjectList: React.FC<any> = ({ objects, onSelect, onNew }) => {
  const handleNew = () => {
    onNew({
      displayName: 'Neues Objekt',
      objectType: '',
      buildYear: '',
      units: 0,
      address: { street: '', houseNumber: '', zip: '', city: '', country: 'Deutschland' },
      owners: [],
      notes: '',
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900">Objekte</h2>
        <button onClick={handleNew} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 flex items-center space-x-2">
          <Plus size={18} /><span>NEU</span>
        </button>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {(objects || []).map((o: any) => (
          <div key={o.id} onClick={() => onSelect(o)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Building size={24} />
              </div>
              <div>
                <p className="text-lg font-black text-slate-900">{o.displayName}</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{o.objectType} {o.address?.city ? `- ${o.address.city}` : ''}</p>
              </div>
            </div>
            <ChevronRight className="text-slate-200 group-hover:text-indigo-600" />
          </div>
        ))}
        {(!objects || objects.length === 0) && (
          <div className="col-span-2 text-center py-12 text-slate-400 font-bold">Keine Objekte vorhanden</div>
        )}
      </div>
    </div>
  );
};

// ─── ObjectDetail ────────────────────────────────────────────────────────────
export const ObjectDetail: React.FC<any> = ({ object, onBack, onSave }) => {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<any>({ ...object });
  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));
  const ro = !editMode;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 font-bold hover:text-slate-900">
          <ArrowLeft size={18} /><span>ZURUECK</span>
        </button>
        <button onClick={() => setEditMode(!editMode)} className={`p-2 rounded-xl transition-all ${editMode ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
          {editMode ? <Unlock size={20} /> : <Lock size={20} />}
        </button>
      </div>

      <Card>
        <SectionHead icon={Building} label={`Objekt: ${form.displayName}`} />
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <Inp label="Bezeichnung" value={form.displayName} onChange={(v: string) => set('displayName', v)} readOnly={ro} />
          <div className="grid grid-cols-2 gap-4">
            <Inp label="Objekttyp" value={form.objectType} onChange={(v: string) => set('objectType', v)} readOnly={ro} />
            <Inp label="Baujahr" value={form.buildYear} onChange={(v: string) => set('buildYear', v)} readOnly={ro} />
          </div>
          <Inp label="Wohneinheiten" type="number" value={form.units} onChange={(v: string) => set('units', parseInt(v) || 0)} readOnly={ro} />

          <div className="mt-6">
            <AddressBlock title="OBJEKTADRESSE" address={form.address} onChange={(a: any) => set('address', a)} readOnly={ro} />
          </div>

          <div className="mt-4">
            <Lbl>Notizen</Lbl>
            <textarea className={`w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl min-h-[80px] outline-none font-medium ${ro ? 'opacity-60' : ''}`}
              value={form.notes || ''} onChange={e => set('notes', e.target.value)} readOnly={ro} />
          </div>
        </div>
      </Card>

      {editMode && (
        <div className="flex justify-end">
          <button onClick={() => onSave(form)} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 text-sm">SPEICHERN</button>
        </div>
      )}
    </div>
  );
};

// ─── InternalTimesTab ────────────────────────────────────────────────────────
export const InternalTimesTab: React.FC<any> = ({ notes, users, currentUser, onSave }) => {
  const [text, setText] = useState('');
  const [dur, setDur] = useState('0.25');

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black text-slate-900">Interne Zeiten</h2>

      <Card>
        <SectionHead icon={Clock} label="Neue interne Zeit erfassen" />
        <div className="border-t border-slate-100 pt-6 space-y-4">
          <textarea className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl min-h-[80px] outline-none font-medium"
            placeholder="Beschreibung..." value={text} onChange={e => setText(e.target.value)} />
          <div className="flex items-center space-x-4">
            <div>
              <Lbl>Dauer (h)</Lbl>
              <input type="number" step="0.25" className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 w-24 font-bold"
                value={dur} onChange={e => setDur(e.target.value)} />
            </div>
            <button onClick={() => {
              if (!text.trim()) return;
              onSave({ text, duration: parseFloat(dur) || 0, rateProfileId: currentUser?.standardRateProfileId || 'Standard' });
              setText(''); setDur('0.25');
            }} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100 mt-5">SPEICHERN</button>
          </div>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Datum</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Nutzer</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Dauer</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Beschreibung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {(notes || []).map((n: any) => (
              <tr key={n.id} className="hover:bg-slate-50">
                <td className="px-8 py-5 text-sm font-bold text-slate-600">{formatDate(n.timestamp)}</td>
                <td className="px-8 py-5 text-sm font-black text-slate-900">{n.userName}</td>
                <td className="px-8 py-5 text-sm font-bold text-indigo-600">{formatDuration(n.duration)}</td>
                <td className="px-8 py-5 text-sm text-slate-600">{n.text}</td>
              </tr>
            ))}
            {(!notes || notes.length === 0) && (
              <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold">Keine internen Zeiten erfasst</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ─── ProcessForm ─────────────────────────────────────────────────────────────
export const ProcessForm: React.FC<any> = ({ contacts, objects, processes, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('EB');
  const [cid, setCid] = useState('');
  const [oid, setOid] = useState('');
  const [status, setStatus] = useState('Lead');

  const processNumber = useMemo(() => {
    const count = (processes || []).filter((p: any) => p.type === type).length + 1;
    return `${type}-${String(cid || '0').padStart(4, '0')}-${String(oid || '0').padStart(4, '0')}-${String(count).padStart(2, '0')}`;
  }, [type, cid, oid, processes]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
      <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 space-y-8">
        <h3 className="text-2xl font-black text-slate-900">Neuer Vorgang</h3>
        <div className="space-y-4">
          <Inp label="Titel" value={title} onChange={setTitle} placeholder="Projektbezeichnung" />
          <Sel label="Typ" value={type} onChange={setType}
            options={Object.values(ProcessType).map(v => ({ value: v, label: v }))} />
          <Sel label="Kunde" value={cid} onChange={setCid}
            options={[{ value: '', label: 'Kunden waehlen...' }, ...(contacts || []).map((c: any) => ({ value: c.id, label: c.companyName || `${c.lastName}, ${c.firstName}` }))]} />
          <Sel label="Objekt" value={oid} onChange={setOid}
            options={[{ value: '', label: 'Objekt waehlen (optional)...' }, ...(objects || []).map((o: any) => ({ value: o.id, label: o.displayName }))]} />
          <Sel label="Status" value={status} onChange={setStatus}
            options={Object.values(ProcessStatus).map(v => ({ value: v, label: v }))} />
          <div className="text-xs text-slate-400 font-bold">Vorgangsnummer: {processNumber}</div>
        </div>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="px-6 py-3 font-bold text-slate-400">Abbrechen</button>
          <button onClick={() => {
            if (!title.trim()) { alert('Titel erforderlich'); return; }
            onSave({ title, type, customerId: cid, objectId: oid, status, processNumber });
          }} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg">ERSTELLEN</button>
        </div>
      </div>
    </div>
  );
};

// ─── Modal ───────────────────────────────────────────────────────────────────
export const Modal: React.FC<any> = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
    <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 space-y-8 relative">
      <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 font-bold">SCHLIESSEN</button>
      {children}
    </div>
  </div>
);

// ─── LoginScreen ─────────────────────────────────────────────────────────────
export const LoginScreen: React.FC<{ onLogin: (u: string, p: string) => void }> = ({ onLogin }) => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  return (
    <div className="h-screen flex items-center justify-center login-gradient p-4">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-12 space-y-10">
        <div className="text-center space-y-4">
          <div className="bg-indigo-600 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200 rotate-6 transform hover:rotate-0 transition-all">
            <ShieldCheck className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">KMU CRM <span className="text-indigo-600 italic">Pro</span></h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Raspberry Pi Instance Secured</p>
        </div>
        <div className="space-y-4">
          <input type="text" placeholder="Benutzername"
            className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700"
            value={user} onChange={e => setUser(e.target.value)} />
          <input type="password" placeholder="Passwort"
            className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-700"
            value={pass} onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onLogin(user, pass)} />
          <button onClick={() => onLogin(user, pass)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-3xl font-black shadow-2xl shadow-indigo-900/20 transition-all active:scale-95 flex items-center justify-center space-x-2">
            <span>SYSTEM BETRETEN</span><ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── AdminView ───────────────────────────────────────────────────────────────
export const AdminView: React.FC<any> = ({ users, currentUser, onSaveUser, onDeleteUser }) => {
  const [editUser, setEditUser] = useState<any>(null);
  const [newUser, setNewUser] = useState(false);
  const [form, setForm] = useState<any>({});

  const startEdit = (u: any) => { setEditUser(u); setNewUser(false); setForm({ ...u }); };
  const startNew = () => { setEditUser(null); setNewUser(true); setForm({ name: '', username: '', role: 'STANDARD', costRate: 0, rates: [], standardRateProfileId: '', password: '' }); };
  const cancel = () => { setEditUser(null); setNewUser(false); setForm({}); };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black text-slate-900">Administration</h2>
        <button onClick={startNew} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 flex items-center space-x-2">
          <Plus size={18} /><span>BENUTZER</span>
        </button>
      </div>

      {(editUser || newUser) && (
        <Card>
          <h3 className="text-xl font-black text-slate-900 mb-6">{newUser ? 'Neuer Benutzer' : `Benutzer bearbeiten: ${editUser.name}`}</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Inp label="Name" value={form.name} onChange={(v: string) => setForm((p: any) => ({ ...p, name: v }))} />
              <Inp label="Benutzername" value={form.username} onChange={(v: string) => setForm((p: any) => ({ ...p, username: v }))} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Sel label="Rolle" value={form.role} onChange={(v: string) => setForm((p: any) => ({ ...p, role: v }))}
                options={['ADMIN', 'FINANCE', 'STANDARD'].map(v => ({ value: v, label: v }))} />
              <Inp label="Kostensatz" type="number" step="0.01" value={form.costRate} onChange={(v: string) => setForm((p: any) => ({ ...p, costRate: parseFloat(v) || 0 }))} />
              <Inp label="Passwort" type="password" value={form.password || ''} onChange={(v: string) => setForm((p: any) => ({ ...p, password: v }))} placeholder={newUser ? 'Pflichtfeld' : 'Leer = nicht aendern'} />
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button onClick={cancel} className="px-6 py-3 font-bold text-slate-400">Abbrechen</button>
              <button onClick={() => { onSaveUser(form); cancel(); }} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg">SPEICHERN</button>
            </div>
          </div>
        </Card>
      )}

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Name</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Benutzername</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Rolle</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Kostensatz</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {(users || []).map((u: any) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-8 py-5 font-black text-slate-900 text-sm">{u.name}</td>
                <td className="px-8 py-5 text-sm font-bold text-slate-600">{u.username}</td>
                <td className="px-8 py-5"><Badge>{u.role}</Badge></td>
                <td className="px-8 py-5 text-sm font-bold text-slate-600">{(Number(u.costRate) || 0).toFixed(2)} EUR/h</td>
                <td className="px-8 py-5 text-right space-x-2">
                  <button onClick={() => startEdit(u)} className="text-indigo-600 font-black text-xs bg-indigo-50 px-3 py-1.5 rounded-lg">BEARBEITEN</button>
                  {u.id !== currentUser?.id && (
                    <button onClick={() => onDeleteUser(u.id)} className="text-rose-600 font-black text-xs bg-rose-50 px-3 py-1.5 rounded-lg">LOESCHEN</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
