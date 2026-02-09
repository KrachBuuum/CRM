
import React, { useState } from 'react';
import { 
  LogOut, ShieldCheck, LayoutDashboard, FolderOpen, Users, 
  Home, Plus, ChevronRight, FileText, Clock, User as UserIcon,
  Phone, Mail, ArrowLeft
} from 'lucide-react';
import { formatDate, formatDuration } from '../utils';

// Shared Components
export const Badge: React.FC<{ children: React.ReactNode, variant?: string }> = ({ children, variant = 'indigo' }) => (
  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border tracking-wider ${
    variant === 'green' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'
  }`}>
    {children}
  </span>
);

export const Layout: React.FC<any> = ({ children, onLogout, currentUser, activeTab, setActiveTab }) => {
  const menu = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'processes', label: 'Vorgänge', icon: FolderOpen },
    { id: 'contacts', label: 'Kontakte', icon: Users },
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

export const ProcessDetail: React.FC<any> = ({ process, notes, onBack, onSaveNote }) => {
  const [text, setText] = useState('');
  const [dur, setDur] = useState('0.25');

  return (
    <div className="space-y-8">
      <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 font-bold hover:text-slate-900">
        <ArrowLeft size={18} /> <span>ZURÜCK</span>
      </button>
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
            <div className="flex justify-between items-center">
              <input 
                type="number" step="0.25" className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 w-24 font-bold"
                value={dur} onChange={e => setDur(e.target.value)}
              />
              <button 
                onClick={() => { onSaveNote({ processId: process.id, text, duration: parseFloat(dur), rateProfileId: 'Standard' }); setText(''); }}
                className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg shadow-indigo-100"
              >SPEICHERN</button>
            </div>
          </div>
          <div className="space-y-6 pt-6 border-t border-slate-50">
            {notes.map((n: any) => (
              <div key={n.id} className="flex space-x-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center font-bold text-slate-400 uppercase tracking-tighter">{n.user_name?.charAt(0)}</div>
                <div className="flex-1">
                   <div className="flex justify-between mb-1">
                     <span className="text-sm font-black text-slate-900">{n.user_name}</span>
                     <span className="text-[10px] font-bold text-slate-400 uppercase">{formatDate(n.timestamp)} • {formatDuration(n.duration)}</span>
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

// Add missing components to fix App.tsx errors
export const ContactDetail: React.FC<any> = ({ contact, onBack }) => (
  <div className="space-y-8">
    <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 font-bold hover:text-slate-900">
      <ArrowLeft size={18} /> <span>ZURÜCK</span>
    </button>
    <div className="flex justify-between items-start">
      <h2 className="text-4xl font-black text-slate-900">{contact.company_name || `${contact.last_name}, ${contact.first_name}`}</h2>
      <Badge>{contact.category}</Badge>
    </div>
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">E-Mail</p>
          <p className="font-bold flex items-center space-x-2"><Mail size={16} className="text-indigo-600"/> <span>{contact.email_business}</span></p>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mobil</p>
          <p className="font-bold flex items-center space-x-2"><Phone size={16} className="text-indigo-600"/> <span>{contact.phone_mobile}</span></p>
        </div>
      </div>
    </div>
  </div>
);

export const ObjectList: React.FC<any> = ({ objects, onSelect }) => (
  <div className="space-y-8">
    <h2 className="text-3xl font-black text-slate-900">Objekte</h2>
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

export const ObjectDetail: React.FC<any> = ({ object, onBack }) => (
  <div className="space-y-8">
    <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 font-bold hover:text-slate-900">
      <ArrowLeft size={18} /> <span>ZURÜCK</span>
    </button>
    <h2 className="text-4xl font-black text-slate-900">{object.display_name}</h2>
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
      <p className="font-bold text-slate-600">{object.address?.street} {object.address?.house_number}, {object.address?.zip} {object.address?.city}</p>
    </div>
  </div>
);

export const AdminView: React.FC<any> = () => (
  <div className="space-y-8">
    <h2 className="text-3xl font-black text-slate-900">Administration</h2>
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
      <p className="text-slate-500 font-bold">Benutzerverwaltung und Systemeinstellungen.</p>
    </div>
  </div>
);

export const InternalTimesTab: React.FC<any> = () => (
  <div className="space-y-8">
    <h2 className="text-3xl font-black text-slate-900">Interne Zeiten</h2>
    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
      <p className="text-slate-500 font-bold">Erfassung von bürointernen Aufwänden.</p>
    </div>
  </div>
);

export const Modal: React.FC<any> = ({ children, onClose }) => (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-6">
    <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 space-y-8 animate-in zoom-in-95 relative">
      <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 font-bold">SCHLIESSEN</button>
      {children}
    </div>
  </div>
);

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
            onClick={() => onSave({ title, customerId: cid, type: 'EB', status: 'Lead', processNumber: 'EB-2024-' + Math.floor(Math.random()*1000) })}
            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-lg"
          >ERSTELLEN</button>
        </div>
      </div>
    </div>
  );
};
