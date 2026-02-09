
import React, { useState } from 'react';
import {
  LogOut, ShieldCheck, LayoutDashboard, FolderOpen, Users,
  Home, Plus, ChevronRight, FileText, Clock, User as UserIcon,
  Phone, Mail, ArrowLeft, Lock, Unlock, Trash2, MapPin, Building2,
  Play, X
} from 'lucide-react';
import { formatDate, formatDuration } from '../utils';

/* ── Helper Components ─────────────────────────────────────────── */

const Lbl: React.FC<{children: React.ReactNode}> = ({children}) => (
  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{children}</p>
);

const SectionLbl: React.FC<{children: React.ReactNode}> = ({children}) => (
  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">{children}</p>
);

const Inp: React.FC<{label: string, value: string, onChange: (v:string)=>void, ro?: boolean, type?: string, step?: string, className?: string}> = ({label,value,onChange,ro,type='text',step,className=''}) => (
  <div className={className}>
    <Lbl>{label}</Lbl>
    <input type={type} step={step} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-medium outline-none disabled:opacity-60" value={value||''} onChange={e=>onChange(e.target.value)} disabled={ro} />
  </div>
);

const Sel: React.FC<{label: string, value: string, onChange: (v:string)=>void, options: string[], ro?: boolean, className?: string}> = ({label,value,onChange,options,ro,className=''}) => (
  <div className={className}>
    <Lbl>{label}</Lbl>
    <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-medium outline-none disabled:opacity-60 appearance-none" value={value||''} onChange={e=>onChange(e.target.value)} disabled={ro}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const Card: React.FC<{children: React.ReactNode, className?: string}> = ({children, className=''}) => (
  <div className={`bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 space-y-6 ${className}`}>{children}</div>
);

const SectionHead: React.FC<{icon: any, children: React.ReactNode}> = ({icon: Icon, children}) => (
  <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
    <Icon size={20} className="text-indigo-600" />
    <h3 className="text-lg font-black text-slate-900">{children}</h3>
  </div>
);

const AddressBlock: React.FC<{addr: any, onChange: (f:string,v:string)=>void, ro?: boolean, title: string}> = ({addr,onChange,ro,title}) => {
  const a = addr || {};
  return (
    <div className="space-y-4">
      <SectionLbl>{title}</SectionLbl>
      <div className="grid grid-cols-4 gap-4">
        <div className="col-span-3"><Inp label="Straße" value={a.street} onChange={v=>onChange('street',v)} ro={ro} /></div>
        <Inp label="Hnr." value={a.houseNumber} onChange={v=>onChange('houseNumber',v)} ro={ro} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Inp label="PLZ" value={a.zip} onChange={v=>onChange('zip',v)} ro={ro} />
        <div className="col-span-2"><Inp label="Ort" value={a.city} onChange={v=>onChange('city',v)} ro={ro} /></div>
      </div>
      <Inp label="Land" value={a.country} onChange={v=>onChange('country',v)} ro={ro} />
    </div>
  );
};

/* ── Shared Components ─────────────────────────────────────────── */

export const Badge: React.FC<{ children: React.ReactNode, variant?: string }> = ({ children, variant = 'indigo' }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border tracking-wider ${
    variant === 'green' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
  }`}>
    {children}
  </span>
);

/* ── Layout ────────────────────────────────────────────────────── */

export const Layout: React.FC<any> = ({ children, onLogout, currentUser, activeTab, setActiveTab }) => {
  const menu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'processes', label: 'Vorgänge', icon: FolderOpen },
    { id: 'contacts', label: 'Kontakte', icon: Users },
    { id: 'objects', label: 'Objekte', icon: Home },
    { id: 'internal-times', label: 'Interne Zeiten', icon: Clock },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 shadow-sm">
        <div className="p-8 flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-2xl">
            <ShieldCheck size={24} className="text-white" />
          </div>
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
              <item.icon size={20} />
              <span>{item.label}</span>
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
            <LogOut size={16} /> <span>ABMELDEN</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-72 p-12 overflow-auto">
        {children}
      </main>
    </div>
  );
};

/* ── Dashboard ─────────────────────────────────────────────────── */

export const Dashboard: React.FC<any> = ({ processes, contacts }) => (
  <div className="space-y-10">
    <header>
      <h2 className="text-4xl font-black text-slate-900 tracking-tight">Systemübersicht</h2>
      <p className="text-slate-500 font-medium">Willkommen zurück in Ihrem CRM.</p>
    </header>
    <div className="grid grid-cols-3 gap-8">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <FolderOpen className="text-indigo-600 mb-4" size={32} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktive Projekte</p>
        <p className="text-4xl font-black text-slate-900">{processes.length}</p>
      </div>
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <Users className="text-green-600 mb-4" size={32} />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kontakte</p>
        <p className="text-4xl font-black text-slate-900">{contacts.length}</p>
      </div>
    </div>
  </div>
);

/* ── Process List ──────────────────────────────────────────────── */

export const ProcessList: React.FC<any> = ({ processes, onSelect, onNew }) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <h2 className="text-3xl font-black text-slate-900">Vorgänge</h2>
      <button onClick={onNew} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 flex items-center space-x-2">
        <Plus size={18} /> <span>NEU</span>
      </button>
    </div>
    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Nr.</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Titel</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-right">Aktion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {processes.map((p: any) => (
            <tr key={p.id} onClick={() => onSelect(p)} className="hover:bg-slate-50 transition-all cursor-pointer group">
              <td className="px-8 py-6 font-bold text-indigo-600 text-sm">{p.process_number}</td>
              <td className="px-8 py-6">
                <p className="text-sm font-black text-slate-900">{p.title}</p>
                <p className="text-[11px] font-bold text-slate-400">{formatDate(p.date_created)}</p>
              </td>
              <td className="px-8 py-6 text-right">
                <ChevronRight size={18} className="inline text-slate-200 group-hover:text-indigo-600" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* ── Process Detail (with rate dropdown + delete) ──────────────── */

export const ProcessDetail: React.FC<any> = ({ process, notes, onBack, onSaveNote, onDelete, currentUser }) => {
  const [text, setText] = useState('');
  const [dur, setDur] = useState('0.25');
  const rates = currentUser?.rates || [];
  const [rateId, setRateId] = useState(currentUser?.standard_rate_profile_id || currentUser?.standardRateProfileId || (rates[0]?.roleName ?? 'Standard'));

  const handleDelete = () => {
    if (confirm(`Vorgang ${process.process_number} wirklich löschen?\nAlle zugehörigen Aktenvermerke werden ebenfalls gelöscht.`)) {
      onDelete(process.id);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 font-bold hover:text-slate-900">
          <ArrowLeft size={18} /> <span>ZURÜCK</span>
        </button>
        {onDelete && (
          <button onClick={handleDelete} className="flex items-center space-x-2 px-5 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs hover:bg-rose-100 transition-all">
            <Trash2 size={16} /> <span>LÖSCHEN</span>
          </button>
        )}
      </div>
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-black text-slate-900">{process.title}</h2>
          <p className="text-indigo-600 font-bold">{process.process_number}</p>
        </div>
        <Badge variant="green">{process.status}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-10">
        <div className="col-span-2 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
          <h3 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <FileText size={20} className="text-indigo-600" /> <span>Aktenvermerke</span>
          </h3>
          <div className="space-y-4">
            <textarea
              className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl min-h-[120px] outline-none font-medium"
              placeholder="Was ist passiert?"
              value={text} onChange={e => setText(e.target.value)}
            />
            <div className="flex items-center space-x-4">
              <div>
                <Lbl>Dauer (h)</Lbl>
                <input
                  type="number" step="0.25" className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 w-24 font-bold"
                  value={dur} onChange={e => setDur(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Lbl>Satz / Funktion</Lbl>
                <select
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-medium outline-none appearance-none"
                  value={rateId} onChange={e => setRateId(e.target.value)}
                >
                  {rates.map((r: any) => <option key={r.roleName} value={r.roleName}>{r.roleName} ({r.rate} €/h)</option>)}
                  {rates.length === 0 && <option value="Standard">Standard</option>}
                </select>
              </div>
              <div className="pt-5">
                <button
                  onClick={() => { onSaveNote({ process_id: process.id, text, duration: parseFloat(dur), rate_profile_id: rateId }); setText(''); }}
                  className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100"
                >SPEICHERN</button>
              </div>
            </div>
          </div>
          <div className="space-y-6 pt-6 border-t border-slate-50">
            {notes.map((n: any) => (
              <div key={n.id} className="flex space-x-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-bold text-slate-400 uppercase tracking-tighter">{n.user_name?.charAt(0)}</div>
                <div className="flex-1">
                   <div className="flex justify-between mb-1">
                     <span className="text-sm font-black text-slate-900">{n.user_name}</span>
                     <span className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(n.timestamp)} &bull; {formatDuration(n.duration)} &bull; {n.rate_profile_id}</span>
                   </div>
                   <p className="text-sm text-slate-600 leading-relaxed">{n.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Contact List ──────────────────────────────────────────────── */

export const ContactList: React.FC<any> = ({ contacts, onSelect, onNew }) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <h2 className="text-3xl font-black text-slate-900">Kontakte</h2>
      <button onClick={onNew} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 flex items-center space-x-2">
        <Plus size={18} /> <span>NEU</span>
      </button>
    </div>
    <div className="grid grid-cols-2 gap-6">
      {contacts.map((c: any) => (
        <div key={c.id} onClick={() => onSelect(c)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
              {(c.last_name || c.company_name)?.charAt(0)}
            </div>
            <div>
              <p className="text-lg font-black text-slate-900">{c.company_name || `${c.last_name}, ${c.first_name}`}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{c.category}</p>
            </div>
          </div>
          <ChevronRight className="text-slate-200 group-hover:text-indigo-600" />
        </div>
      ))}
    </div>
  </div>
);

/* ── Contact Detail (Privat + Gewerblich) ──────────────────────── */

export const ContactDetail: React.FC<any> = ({ contact, onBack, onSave }) => {
  const [editMode, setEditMode] = useState(false);
  const isCompany = contact.category === 'Unternehmen';

  const [f, setF] = useState({
    category: contact.category || '',
    company_name: contact.company_name || '',
    website: contact.website || '',
    industry: contact.industry || '',
    legal_form: contact.legal_form || '',
    salutation: contact.salutation || '',
    title: contact.title || '',
    first_name: contact.first_name || '',
    last_name: contact.last_name || '',
    uc_id: contact.uc_id || '',
    email_business: contact.email_business || '',
    email_private: contact.email_private || '',
    phone_mobile: contact.phone_mobile || '',
    phone_landline: contact.phone_landline || '',
    preferred_contact_way: contact.preferred_contact_way || 'Mobil',
    address: contact.address || { street: '', houseNumber: '', zip: '', city: '', country: 'Deutschland' },
    billing_address_active: contact.billing_address_active || false,
    billing_address: contact.billing_address || { street: '', houseNumber: '', zip: '', city: '', country: 'Deutschland' },
    second_person_active: contact.second_person_active || false,
    second_person_data: contact.second_person_data || { firstName: '', lastName: '', ucId: '', emailPrivate: '', phoneLandline: '', phoneMobile: '', address: { street: '', houseNumber: '', zip: '', city: '', country: 'Deutschland' }, preferredContactWay: 'Mobil' },
    internal_notes: contact.internal_notes || '',
    company_contacts: contact.company_contacts || [],
  });

  const u = (field: string, val: any) => setF(p => ({ ...p, [field]: val }));
  const uAddr = (field: string, val: string) => setF(p => ({ ...p, address: { ...p.address, [field]: val } }));
  const uBill = (field: string, val: string) => setF(p => ({ ...p, billing_address: { ...p.billing_address, [field]: val } }));
  const uSP = (field: string, val: any) => setF(p => ({ ...p, second_person_data: { ...p.second_person_data, [field]: val } }));
  const uSPAddr = (field: string, val: string) => setF(p => ({ ...p, second_person_data: { ...p.second_person_data, address: { ...(p.second_person_data?.address || {}), [field]: val } } }));

  const uCC = (idx: number, field: string, val: string) => {
    const arr = [...f.company_contacts];
    arr[idx] = { ...arr[idx], [field]: val };
    u('company_contacts', arr);
  };
  const addCC = () => u('company_contacts', [...f.company_contacts, { id: 'cc_' + Date.now(), firstName: '', lastName: '', role: '', ucId: '', email: '', phoneLandline: '', phoneMobile: '', internalNotes: '' }]);
  const removeCC = (idx: number) => u('company_contacts', f.company_contacts.filter((_: any, i: number) => i !== idx));

  const ro = !editMode;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="flex items-center justify-center w-10 h-10 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-3xl font-black text-slate-900">
            {isCompany ? 'Unternehmen' : 'Privatperson'} <span className="text-slate-400 text-xl font-bold">#{String(contact.id).padStart(4, '0')}</span>
          </h2>
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${editMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}
        >
          {editMode ? <Unlock size={20} /> : <Lock size={20} />}
        </button>
      </div>

      {/* Stammdaten + Adresse */}
      <div className="grid grid-cols-2 gap-8">
        {/* Stammdaten */}
        <Card>
          <SectionHead icon={UserIcon}>Stammdaten</SectionHead>
          {isCompany ? (
            <div className="space-y-4">
              <Inp label="Firmenname" value={f.company_name} onChange={v => u('company_name', v)} ro={ro} />
              <Inp label="Internetseite" value={f.website} onChange={v => u('website', v)} ro={ro} />
              <div className="grid grid-cols-2 gap-4">
                <Inp label="Branche" value={f.industry} onChange={v => u('industry', v)} ro={ro} />
                <Inp label="Rechtsform" value={f.legal_form} onChange={v => u('legal_form', v)} ro={ro} />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Inp label="Anrede" value={f.salutation} onChange={v => u('salutation', v)} ro={ro} />
                <Inp label="Titel" value={f.title} onChange={v => u('title', v)} ro={ro} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Inp label="Vorname" value={f.first_name} onChange={v => u('first_name', v)} ro={ro} />
                <Inp label="Nachname" value={f.last_name} onChange={v => u('last_name', v)} ro={ro} />
              </div>
            </div>
          )}
        </Card>

        {/* Adresse */}
        <Card>
          <SectionHead icon={MapPin}>Adresse</SectionHead>
          <AddressBlock addr={f.address} onChange={uAddr} ro={ro} title="Standardadresse" />
          <label className="flex items-center space-x-3 pt-4 cursor-pointer">
            <input type="checkbox" checked={f.billing_address_active} onChange={e => u('billing_address_active', e.target.checked)} disabled={ro}
              className="w-5 h-5 rounded border-slate-300 text-indigo-600" />
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-widest">Abweichende Rechnungsadresse</span>
          </label>
          {f.billing_address_active && (
            <AddressBlock addr={f.billing_address} onChange={uBill} ro={ro} title="Rechnungsadresse" />
          )}
        </Card>
      </div>

      {/* Kommunikation */}
      {isCompany ? (
        <>
          {f.company_contacts.map((cc: any, idx: number) => (
            <Card key={cc.id || idx}>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <Play size={20} className="text-indigo-600" />
                  <h3 className="text-lg font-black text-slate-900">
                    Kommunikation {cc.firstName || cc.lastName ? `– ${cc.firstName} ${cc.lastName}` : `#${idx + 1}`}
                  </h3>
                </div>
                {editMode && (
                  <button onClick={() => removeCC(idx)} className="text-rose-500 hover:text-rose-700 transition-all">
                    <X size={20} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Inp label="Vorname" value={cc.firstName} onChange={v => uCC(idx, 'firstName', v)} ro={ro} />
                <Inp label="Nachname" value={cc.lastName} onChange={v => uCC(idx, 'lastName', v)} ro={ro} />
                <Inp label="Rolle / Funktion" value={cc.role} onChange={v => uCC(idx, 'role', v)} ro={ro} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Inp label="UC-ID" value={cc.ucId} onChange={v => uCC(idx, 'ucId', v)} ro={ro} />
                <Inp label="E-Mail" value={cc.email} onChange={v => uCC(idx, 'email', v)} ro={ro} />
                <Inp label="Telefon Festnetz" value={cc.phoneLandline} onChange={v => uCC(idx, 'phoneLandline', v)} ro={ro} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Inp label="Telefon Mobil" value={cc.phoneMobile} onChange={v => uCC(idx, 'phoneMobile', v)} ro={ro} />
                <div className="col-span-2">
                  <Inp label="Interne Notizen" value={cc.internalNotes} onChange={v => uCC(idx, 'internalNotes', v)} ro={ro} />
                </div>
              </div>
            </Card>
          ))}
          {editMode && (
            <button onClick={addCC} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-slate-400 font-black text-sm hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center space-x-2">
              <Plus size={18} /> <span>ANSPRECHPARTNER HINZUFÜGEN</span>
            </button>
          )}
        </>
      ) : (
        <Card>
          <SectionHead icon={Play}>Kommunikation</SectionHead>
          <div className="grid grid-cols-3 gap-4">
            <Inp label="UC-ID" value={f.uc_id} onChange={v => u('uc_id', v)} ro={ro} />
            <Inp label="E-Mail Beruflich" value={f.email_business} onChange={v => u('email_business', v)} ro={ro} />
            <Inp label="E-Mail Privat" value={f.email_private} onChange={v => u('email_private', v)} ro={ro} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Inp label="Telefon Mobil" value={f.phone_mobile} onChange={v => u('phone_mobile', v)} ro={ro} />
            <Inp label="Telefon Festnetz" value={f.phone_landline} onChange={v => u('phone_landline', v)} ro={ro} />
            <Sel label="Kontaktweg" value={f.preferred_contact_way} onChange={v => u('preferred_contact_way', v)} options={['Mobil','Festnetz','Email','Telefon']} ro={ro} />
          </div>
        </Card>
      )}

      {/* Zweite Person (nur Privatperson) */}
      {!isCompany && (
        <Card>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" checked={f.second_person_active} onChange={e => u('second_person_active', e.target.checked)} disabled={ro}
              className="w-5 h-5 rounded border-slate-300 text-indigo-600" />
            <span className="text-lg font-black text-slate-900">Zweite Person aktiv</span>
          </label>
          {f.second_person_active && (
            <div className="grid grid-cols-2 gap-8 pt-4">
              <div className="space-y-4">
                <SectionLbl>Personendaten (2. Person)</SectionLbl>
                <div className="grid grid-cols-2 gap-4">
                  <Inp label="Vorname" value={f.second_person_data?.firstName} onChange={v => uSP('firstName', v)} ro={ro} />
                  <Inp label="Nachname" value={f.second_person_data?.lastName} onChange={v => uSP('lastName', v)} ro={ro} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Inp label="UC-ID" value={f.second_person_data?.ucId} onChange={v => uSP('ucId', v)} ro={ro} />
                  <Inp label="E-Mail Privat" value={f.second_person_data?.emailPrivate} onChange={v => uSP('emailPrivate', v)} ro={ro} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Inp label="Festnetz" value={f.second_person_data?.phoneLandline} onChange={v => uSP('phoneLandline', v)} ro={ro} />
                  <Inp label="Mobil" value={f.second_person_data?.phoneMobile} onChange={v => uSP('phoneMobile', v)} ro={ro} />
                </div>
              </div>
              <div className="space-y-4">
                <AddressBlock addr={f.second_person_data?.address} onChange={uSPAddr} ro={ro} title="Adresse (2. Person)" />
                <Sel label="Kontaktweg (2. Person)" value={f.second_person_data?.preferredContactWay} onChange={v => uSP('preferredContactWay', v)} options={['Mobil','Festnetz','Email','Telefon']} ro={ro} />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Interne Notizen */}
      {editMode && (
        <Card>
          <Lbl>Interne Notizen</Lbl>
          <textarea
            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl min-h-[80px] outline-none font-medium"
            value={f.internal_notes} onChange={e => u('internal_notes', e.target.value)}
          />
        </Card>
      )}

      {/* Speichern */}
      {editMode && (
        <div className="flex justify-end">
          <button
            onClick={() => { onSave(contact.id, f); setEditMode(false); }}
            className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100"
          >SPEICHERN</button>
        </div>
      )}
    </div>
  );
};

/* ── Object List ───────────────────────────────────────────────── */

export const ObjectList: React.FC<any> = ({ objects, onSelect, onNew }) => (
  <div className="space-y-8">
    <div className="flex items-center justify-between">
      <h2 className="text-3xl font-black text-slate-900">Objekte</h2>
      {onNew && (
        <button onClick={onNew} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 flex items-center space-x-2">
          <Plus size={18} /> <span>NEU</span>
        </button>
      )}
    </div>
    <div className="grid grid-cols-2 gap-6">
      {objects.map((o: any) => (
        <div key={o.id} onClick={() => onSelect(o)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex items-center justify-between">
           <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
              <Home size={24} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900">{o.display_name}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{o.address?.city}</p>
            </div>
          </div>
          <ChevronRight className="text-slate-200 group-hover:text-indigo-600" />
        </div>
      ))}
    </div>
  </div>
);

/* ── Object Detail (full form with edit mode) ──────────────────── */

export const ObjectDetail: React.FC<any> = ({ object, onBack, onSave }) => {
  const [editMode, setEditMode] = useState(false);
  const [f, setF] = useState({
    display_name: object.display_name || '',
    object_type: object.object_type || '',
    build_year: object.build_year || '',
    units: String(object.units || ''),
    address: object.address || { street: '', houseNumber: '', zip: '', city: '', country: 'Deutschland' },
  });

  const u = (field: string, val: any) => setF(p => ({ ...p, [field]: val }));
  const uAddr = (field: string, val: string) => setF(p => ({ ...p, address: { ...p.address, [field]: val } }));
  const ro = !editMode;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center justify-center w-10 h-10 rounded-2xl hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all">
          <ArrowLeft size={20} />
        </button>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${editMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400'}`}
        >
          {editMode ? <Unlock size={20} /> : <Lock size={20} />}
        </button>
      </div>

      <Card>
        <SectionHead icon={Building2}>Objekt: {f.display_name}</SectionHead>
        {editMode && <Inp label="Bezeichnung" value={f.display_name} onChange={v => u('display_name', v)} ro={ro} />}
        <div className="grid grid-cols-2 gap-4">
          <Inp label="Objekttyp" value={f.object_type} onChange={v => u('object_type', v)} ro={ro} />
          <Inp label="Baujahr" value={f.build_year} onChange={v => u('build_year', v)} ro={ro} />
        </div>
        <Inp label="Wohneinheiten" value={f.units} onChange={v => u('units', v)} ro={ro} />
        <AddressBlock addr={f.address} onChange={uAddr} ro={ro} title="Objektadresse" />
      </Card>

      {editMode && (
        <div className="flex justify-end">
          <button
            onClick={() => { onSave(object.id, { ...f, units: parseInt(f.units) || 0 }); setEditMode(false); }}
            className="bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100"
          >SPEICHERN</button>
        </div>
      )}
    </div>
  );
};

/* ── Admin View ────────────────────────────────────────────────── */

export const AdminView: React.FC<any> = () => (
  <div className="space-y-8">
    <h2 className="text-3xl font-black text-slate-900">Administration</h2>
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
      <p className="text-slate-500 font-bold">Benutzerverwaltung und Systemeinstellungen.</p>
    </div>
  </div>
);

/* ── Internal Times Tab ────────────────────────────────────────── */

export const InternalTimesTab: React.FC<any> = ({ notes, onSaveNote, currentUser }) => {
  const [text, setText] = useState('');
  const [dur, setDur] = useState('0.25');
  const rates = currentUser?.rates || [];
  const [rateId, setRateId] = useState(currentUser?.standard_rate_profile_id || currentUser?.standardRateProfileId || (rates[0]?.roleName ?? 'Intern'));

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-black text-slate-900">Interne Zeiten</h2>

      {/* Erfassungsformular */}
      <Card>
        <SectionHead icon={Clock}>Neue interne Zeit erfassen</SectionHead>
        <textarea
          className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl min-h-[80px] outline-none font-medium"
          placeholder="Beschreibung der Tätigkeit..."
          value={text} onChange={e => setText(e.target.value)}
        />
        <div className="flex items-center space-x-4">
          <div>
            <Lbl>Dauer (h)</Lbl>
            <input type="number" step="0.25" className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 w-24 font-bold" value={dur} onChange={e => setDur(e.target.value)} />
          </div>
          <div className="flex-1">
            <Lbl>Satz / Funktion</Lbl>
            <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 font-medium outline-none appearance-none" value={rateId} onChange={e => setRateId(e.target.value)}>
              {rates.map((r: any) => <option key={r.roleName} value={r.roleName}>{r.roleName} ({r.rate} €/h)</option>)}
              {rates.length === 0 && <option value="Intern">Intern</option>}
            </select>
          </div>
          <div className="pt-5">
            <button
              onClick={() => { if (text.trim()) { onSaveNote({ process_id: null, text, duration: parseFloat(dur), rate_profile_id: rateId }); setText(''); } }}
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100"
            >SPEICHERN</button>
          </div>
        </div>
      </Card>

      {/* Tabelle */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Datum</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Nutzer</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Dauer</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Satz</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Beschreibung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {notes.length === 0 && (
              <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">Keine internen Zeiten vorhanden.</td></tr>
            )}
            {notes.map((n: any) => (
              <tr key={n.id} className="hover:bg-slate-50 transition-all">
                <td className="px-8 py-5 text-sm font-bold text-slate-600">{formatDate(n.timestamp)}</td>
                <td className="px-8 py-5 text-sm font-black text-slate-900">{n.user_name}</td>
                <td className="px-8 py-5 text-sm font-bold text-indigo-600">{formatDuration(n.duration)}</td>
                <td className="px-8 py-5 text-sm font-medium text-slate-500">{n.rate_profile_id}</td>
                <td className="px-8 py-5 text-sm text-slate-600">{n.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ── Modal ─────────────────────────────────────────────────────── */

export const Modal: React.FC<any> = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
    <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 space-y-8 animate-in zoom-in-95 relative">
      <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 font-bold">SCHLIESSEN</button>
      {children}
    </div>
  </div>
);

/* ── Login Screen ──────────────────────────────────────────────── */

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

/* ── Process Form ──────────────────────────────────────────────── */

export const ProcessForm: React.FC<any> = ({ contacts, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [cid, setCid] = useState('');
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
      <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 space-y-8 animate-in zoom-in-95">
        <h3 className="text-2xl font-black text-slate-900">Neuer Vorgang</h3>
        <div className="space-y-4">
          <input className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" placeholder="Projektbezeichnung" value={title} onChange={e => setTitle(e.target.value)} />
          <select className="w-full p-5 bg-slate-50 rounded-2xl outline-none font-bold" value={cid} onChange={e => setCid(e.target.value)}>
            <option value="">Kunden wählen...</option>
            {contacts.map((c: any) => <option key={c.id} value={c.id}>{c.company_name || c.last_name}</option>)}
          </select>
        </div>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="px-6 py-3 font-bold text-slate-400">Abbrechen</button>
          <button
            onClick={() => onSave({ title, customer_id: cid, type: 'EB', status: 'Lead', process_number: 'EB-2024-' + Math.floor(Math.random()*1000) })}
            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg"
          >ERSTELLEN</button>
        </div>
      </div>
    </div>
  );
};
