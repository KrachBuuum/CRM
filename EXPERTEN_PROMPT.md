# EXPERTEN-PROMPT: KMU CRM Pro – Finale funktionsfähige Version

## AUFTRAG

Du bist ein Senior Full-Stack-Entwickler. Erstelle die **finale, vollständig funktionsfähige Version** des KMU CRM Pro Systems. Das System besteht aus einem **React 19 + TypeScript + Tailwind CSS v4 Frontend** und einem **Express.js + PostgreSQL Backend**, deployed via **Docker Compose** auf einem Raspberry Pi.

**WICHTIG:** Das Frontend-Design stammt aus dem CRM4-Repository (dunkle Sidebar, Timer, Suche, Dashboard mit Kacheln). Das Backend mit voller CRUD-Persistenz und JWT-Login ist bereits fertig. Deine Aufgabe ist es, **das CRM4-UI-Design exakt beizubehalten** und es mit dem **echten Backend (ApiService)** zu verbinden, statt mit Mock-Daten zu arbeiten.

---

## PROJEKTSTRUKTUR

```
CRM/
├── index.html
├── index.tsx
├── index.css
├── App.tsx                    ← HAUPTDATEI: State, API-Anbindung, Timer, Navigation
├── types.ts                   ← Alle TypeScript-Interfaces und Enums
├── utils.ts                   ← Hilfsfunktionen (formatDuration, formatDate, etc.)
├── api.ts                     ← ApiService mit JWT-Auth (NICHT ÄNDERN)
├── components/
│   └── UIComponents.tsx       ← ALLE UI-Komponenten (~1400 Zeilen)
├── vite.config.ts
├── tsconfig.json
├── package.json
├── nginx.conf
├── docker-compose.yml
├── init.sql
└── backend/
    ├── server.js              ← Express-Backend mit CRUD (NICHT ÄNDERN)
    ├── package.json
    └── Dockerfile
```

---

## DATEI 1: `index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KMU CRM Pro</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-50 text-slate-900">
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
</body>
</html>
```

**WICHTIG:** Kein `<script type="importmap">` Block! Vite übernimmt das Bundling.

---

## DATEI 2: `index.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## DATEI 3: `index.css`

```css
@import "tailwindcss";

body {
  font-family: 'Inter', sans-serif;
}

.login-gradient {
  background: radial-gradient(circle at top right, #4f46e5, #1e1b4b);
}
```

---

## DATEI 4: `types.ts`

Exakt übernehmen – alle Enums und Interfaces:

```typescript
export enum UserRole {
  ADMIN = 'ADMIN',
  FINANCE = 'FINANCE',
  STANDARD = 'STANDARD'
}

export enum ProcessType {
  EB = 'EB',
  EL = 'EL',
  SV = 'SV',
  IM = 'IM',
  VS = 'VS'
}

export enum ProcessStatus {
  LEAD = 'Lead',
  POTENTIAL = 'Potenziell',
  OFFER = 'Angebot erstellt',
  ORDERED = 'Beauftragt',
  PAUSED = 'Pausiert',
  COMPLETED = 'Abgeschlossen',
  CANCELLED = 'Abgebrochen',
  APPOINTMENT_TO_ARRANGE = 'Ortstermin zu vereinbaren',
  APPOINTMENT_ARRANGED = 'Ortstermin vereinbart'
}

export enum ContactCategory {
  PERSON = 'Privatperson',
  COMPANY = 'Unternehmen'
}

export interface Address {
  street: string;
  houseNumber: string;
  zip: string;
  city: string;
  country: string;
}

export interface CompanyContact {
  id: string;
  salutation?: string;
  title?: string;
  firstName?: string;
  lastName: string;
  ucId?: string;
  role: string;
  phoneLandline?: string;
  phoneMobile?: string;
  email: string;
  internalNotes?: string;
}

export interface SecondPersonData {
  salutation?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  address?: Address;
  phoneMobile?: string;
  phoneLandline?: string;
  emailBusiness?: string;
  emailPrivate?: string;
  preferredContactWay?: 'Mobil' | 'Festnetz' | 'Email' | 'Telefon';
  internalNotes?: string;
  ucId?: string;
}

export interface Contact {
  id: string;
  category: ContactCategory;
  companyName?: string;
  website?: string;
  industry?: string;
  legalForm?: string;
  ustId?: string;
  cooperationStatus?: 'Aktiv' | 'Inaktiv';
  conditions?: string;
  region?: string;
  salutation?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  ucId?: string;
  phoneMobile: string;
  phoneLandline: string;
  emailBusiness: string;
  emailPrivate?: string;
  preferredContactWay: 'Mobil' | 'Festnetz' | 'Email' | 'Telefon';
  address: Address;
  billingAddressActive: boolean;
  billingAddress?: Address;
  secondPersonActive: boolean;
  secondPersonData?: SecondPersonData;
  internalNotes: string;
  contacts?: CompanyContact[];
}

export interface Invoice {
  id: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  paidDate?: string;
}

export interface Process {
  id: string;
  processNumber: string;
  type: ProcessType;
  customerId: string;
  endCustomerId?: string;
  objectId: string;
  title: string;
  status: ProcessStatus;
  dateCreated: string;
  serviceProvider?: 'FC' | 'STP';
  vsNumber?: string;
  internalNotes?: string;
  storageLink?: string;
  invoices: Invoice[];
}

export interface Note {
  id: string;
  processId: string;
  processNumber?: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: string;
  duration: number;
  rateProfileId: string;
  assignedUserId?: string;
  resubmissionDate?: string;
  isDone?: boolean;
}

export interface ObjectOwner {
  id: string;
  name: string;
}

export interface CRMObject {
  id: string;
  displayName: string;
  objectType: string;
  buildYear: string;
  units: number;
  address: Address;
  owners: ObjectOwner[];
  notes: string;
}

export interface UserRate {
  roleName: string;
  rate: number;
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  failedAttempts: number;
  isLocked: boolean;
  rates: UserRate[];
  costRate: number;
  standardRateProfileId: string;
}

export interface SearchResult {
  type: 'process' | 'contact' | 'object';
  id: string;
  label: string;
  sublabel: string;
}

export type TimeRange = 'Heute' | 'Diese Woche' | 'Dieser Monat';
```

---

## DATEI 5: `utils.ts`

```typescript
import { ProcessType } from './types';

export const padId = (id: string | number, length: number = 4): string => {
  return String(id).padStart(length, '0');
};

export const generateProcessNumber = (
  type: ProcessType, contactId: string, objectId: string, seq: number, vsId?: string
): string => {
  if (type === ProcessType.VS) {
    const vsPrefix = vsId || 'FC';
    return `VS-${vsPrefix}-${padId(seq, 6)}`;
  }
  return `${type}-${padId(contactId, 4)}-${padId(objectId, 4)}-${padId(seq, 2)}`;
};

export const formatDuration = (hours: number): string => {
  return (Number(hours) || 0).toFixed(3) + ' h';
};

export const isValidDate = (dateStr: any): boolean => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d.getTime());
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('de-DE');
};

export const formatTime = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};

export const convertToExplorerLink = (path: string): string => {
  if (!path) return '';
  let clean = path.trim();
  if (clean.startsWith('\\\\')) {
    clean = 'file://///' + clean.substring(2).replace(/\\/g, '/');
  } else if (!clean.startsWith('file://') && !clean.startsWith('http')) {
    clean = 'file:///' + clean.replace(/\\/g, '/');
  }
  return clean.replace(/ /g, '%20');
};

export const formatEuroDashboard = (amount: number): string => {
  return Math.round(Number(amount) || 0).toLocaleString('de-DE') + ' €';
};
```

**WICHTIG:** `Number()` Wrapper bei `formatDuration` und `formatEuroDashboard` – PostgreSQL DECIMAL kommt als String zurück.

---

## DATEI 6: `api.ts` – NICHT ÄNDERN, EXAKT ÜBERNEHMEN

```typescript
import { User, Process, Contact, CRMObject, Note } from './types';

const API_BASE = '/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('crm_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...options?.headers,
      },
    });
  } catch (networkErr: any) {
    throw new Error('Server nicht erreichbar: ' + (networkErr.message || 'Netzwerkfehler'));
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
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Login fehlgeschlagen');
    const data = await res.json();
    localStorage.setItem('crm_token', data.token);
    return data;
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
```

---

## DATEI 7: `App.tsx` – KERNLOGIK (API-ANBINDUNG + CRM4-FEATURES)

Dies ist die **kritischste Datei**. Sie muss das CRM4-Design mit dem echten Backend verbinden.

### Anforderungen an App.tsx:

1. **Login-Screen** wenn kein Token vorhanden → `LoginScreen` Komponente anzeigen
2. **Daten laden** nach Login via `ApiService` (getUsers, getProcesses, getContacts, getObjects, getNotes)
3. **Timer-Funktionalität** (Vorgangs-Timer + Interner Timer mit Pause/Resume) – exakt wie CRM4
4. **Navigation mit History-Stack** (`navigateTo()` + `goBack()`) – exakt wie CRM4
5. **Globale Suche** (Vorgänge, Kontakte, Objekte nach Name/ID/Telefon)
6. **Dashboard-Statistiken** mit Zeitraumfilter (Heute/Diese Woche/Dieser Monat)
7. **CRUD-Operationen** die `ApiService` aufrufen UND lokalen State aktualisieren
8. **Interne Zeiterfassung** mit Beschreibungs-Modal beim Stoppen
9. **Status-Änderungen** erstellen automatisch eine Notiz ("Status geändert auf: ...")
10. **Rechnungsverwaltung** (Hinzufügen/Bearbeiten/Löschen) – über `updateProcess` mit Invoices-Array

### Exakte Struktur von App.tsx:

```typescript
import React, { useState, useMemo, useEffect } from 'react';
import { User, Process, Contact, CRMObject, Note, ProcessStatus, SearchResult, ProcessType, UserRole, TimeRange, Invoice } from './types';
import { Layout, Dashboard, ProcessList, ProcessDetail, ContactList, ContactDetail, ObjectList, ObjectDetail, ProcessForm, AdminView, InternalTimesTab, Modal, FormField, LoginScreen } from './components/UIComponents';
import { ApiService } from './api';
import { padId, isValidDate, convertToExplorerLink } from './utils';
```

**State-Variablen (exakt beibehalten aus CRM4):**

- `activeTab` – Navigation (dashboard, processes, contacts, objects, new-process, admin, internal-times)
- `selectedProcessId`, `selectedContactId`, `selectedObjectId` – Detail-Ansichten
- `processFilterStatus` – Dashboard-Klick filtert Vorgangsliste
- `history` – Navigation-History-Stack für Zurück-Button
- `dashboardTimeRange` – Zeitraumfilter (Heute/Diese Woche/Dieser Monat)
- `prefilledDuration` – Timer-Wert wird als Dauer ins Notizformular übernommen
- `currentUser` – Aktuell angemeldeter/ausgewählter Benutzer
- `users, processes, contacts, objects, notes` – Daten aus der Datenbank
- `timerActive, timerProcessId, timerSeconds` – Vorgangs-Timer
- `internalTimerActive, internalTimerPaused, internalSeconds` – Interner Timer
- `showTimerPopup` – Popup nach Stopp des Vorgangs-Timers
- `internalTimeDescriptionModal` – Modal für Beschreibung der internen Zeit
- `searchQuery, searchResults` – Globale Suche
- `loading, isInitialized` – Ladezustand

**KRITISCHE UNTERSCHIEDE ZU CRM4 (Mock → API):**

| CRM4 (Mock-Daten) | App.tsx (API-Anbindung) |
|---|---|
| `useState(MOCK_USERS)` | `useState<User[]>([])` + `ApiService.getUsers()` |
| `useState(INITIAL_PROCESSES)` | `useState<Process[]>([])` + `ApiService.getProcesses()` |
| `setProcesses(prev => [...prev, p])` | `const created = await ApiService.createProcess(p); setProcesses(...)` |
| `setNotes(prev => [...prev, n])` | `const created = await ApiService.createNote(n); setNotes(...)` |
| `onUpdateUsers={setUsers}` | `onSaveUser={handleSaveUser}` mit API-Call |
| Kein Login | `LoginScreen` + `handleLogin()` + Token-Check |

**Alle Handler müssen:**
1. API aufrufen (`await ApiService.xxx()`)
2. Bei Erfolg lokalen State aktualisieren
3. Bei Fehler `alert('Fehler: ' + err.message)` anzeigen

### Handler-Übersicht (alle mit API-Anbindung):

```
handleLogin(username, password)     → ApiService.login() → loadData()
loadData()                          → Promise.all([getUsers, getProcesses, getContacts, getObjects, getNotes])
handleCreateProcess(data)           → ApiService.createProcess(data)
handleUpdateProcess(process)        → ApiService.updateProcess(id, data)
handleDeleteProcess(id)             → ApiService.deleteProcess(id)
handleUpdateProcessStatus(id, st)   → ApiService.updateProcess(id, {status}) + ApiService.createNote({text: "Status geändert..."})
handleCreateContact(data)           → ApiService.createContact(data)
handleUpdateContact(contact)        → ApiService.updateContact(id, data)
handleCreateObject(data)            → ApiService.createObject(data)
handleUpdateObject(object)          → ApiService.updateObject(id, data)
handleAddNote(note)                 → ApiService.createNote(note)
handleUpdateNote(note)              → ApiService.updateNote(id, note)
handleDeleteNote(id)                → ApiService.deleteNote(id)
handleSaveUser(user)                → ApiService.createUser() oder ApiService.updateUser()
handleDeleteUser(id)                → ApiService.deleteUser(id)
handleAddInvoice(pid, inv)          → Process.invoices aktualisieren → ApiService.updateProcess()
handleUpdateInvoice(pid, invId, u)  → Process.invoices aktualisieren → ApiService.updateProcess()
handleDeleteInvoice(pid, invId)     → Process.invoices filtern → ApiService.updateProcess()
```

### Timer-Logik (exakt aus CRM4):

- **Vorgangs-Timer:** Start → setzt `timerProcessId`, `timerActive=true`. Stopp → berechnet Dauer in Stunden (`timerSeconds/3600`), setzt `prefilledDuration`, navigiert zum Vorgang.
- **Interner Timer:** Start/Pause/Resume. Stopp → öffnet Modal für Beschreibung → erstellt Note mit `processId='INTERNAL'`.
- **Wechselwirkung:** Wenn Vorgangs-Timer startet und interner Timer läuft → interner Timer wird pausiert. Wenn Vorgangs-Timer stoppt → Popup fragt ob interner Timer fortgeführt werden soll.

### Rechnungsverwaltung:

Rechnungen werden im `invoices`-Array des Process-Objekts gespeichert. Bei Add/Update/Delete wird der gesamte Process mit dem aktualisierten Invoices-Array via `ApiService.updateProcess()` gespeichert.

### Layout-Props (exakt wie CRM4):

```tsx
<Layout
  currentUser={currentUser}
  setCurrentUser={setCurrentUser}
  allUsers={users}
  activeTab={activeTab}
  setActiveTab={(t) => navigateTo(t)}
  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  searchResults={searchResults}
  onSearchResultClick={(res) => { /* navigateTo basierend auf res.type */ }}
  timerDisplay={formatTimerDisplay(timerSeconds)}
  timerActive={timerActive}
  onStartTimer={handleStartProcessTimer}
  onStopTimer={handleStopProcessTimer}
  internalTimerDisplay={formatTimerDisplay(internalSeconds)}
  internalTimerActive={internalTimerActive}
  internalTimerPaused={internalTimerPaused}
  onToggleInternalTimer={() => { ... }}
  onTogglePauseInternal={() => setInternalTimerPaused(!internalTimerPaused)}
  onStopInternalTimer={handleStopInternalTimer}
  activeProcessInfo={timerProcessId ? processes.find(p => p.id === timerProcessId) : undefined}
  onBack={goBack}
  onLogout={ApiService.logout}
>
```

---

## DATEI 8: `components/UIComponents.tsx` – ALLE UI-KOMPONENTEN (~1400 Zeilen)

### Design-System:

- **Sidebar:** `bg-slate-900` (dunkel), Breite `w-64`, Logo mit `bg-indigo-600` Icon
- **Top-Bar:** `bg-white`, Höhe `h-16`, enthält: Zurück-Button, Nutzer-Auswahl, Suche, Interner Timer, Vorgangs-Timer
- **Karten:** `rounded-[2rem]` oder `rounded-[2.5rem]`, `border border-slate-200`, `shadow-sm`
- **Buttons:** `rounded-2xl`, `font-black`, Primary: `bg-indigo-600 text-white`
- **Schrift:** Labels: `text-[10px] font-black uppercase tracking-widest text-slate-400`
- **Farben:** Indigo (Primary), Emerald (Erfolg), Rose (Fehler/Warnung), Amber (Pause/Aufgaben)

### Exportierte Komponenten:

1. **`StatusBadge`** – Farbiger Badge pro ProcessStatus
2. **`Modal`** – Overlay-Dialog mit Titel und Schließen-Button
3. **`FormField`** – Label + Input mit einheitlichem Styling
4. **`LoginScreen`** – NEU (nicht in CRM4) – Login-Formular mit Username/Passwort
5. **`Layout`** – Sidebar + Top-Bar mit Timer, Suche, Nutzer-Dropdown + Logout-Button
6. **`Dashboard`** – Status-Kacheln (klickbar), Systemleistung, Persönliche Produktivität, Aktivitätsverlauf, Überfällige Rechnungen, Offene Aufgaben
7. **`ProcessList`** – Tabelle mit Vorgangsnummer, Titel, Status, Kosten, Gewinn + Statusfilter
8. **`ProcessDetail`** – Vorgangsdetails: Header mit Finanzen + Timer + Lock/Unlock, Auftraggeber/Endkunde/Objekt-Karten (klickbar), Interne Notiz, Aktenvermerk-Formular (mit Zeitpunkt, Wiedervorlage, Dauer, Satz, Zuweisung), Rechnungen-Tabelle, Aktenvermerke-Verlauf
9. **`InternalTimesTab`** – Tabelle der internen Zeiten mit Bearbeiten/Löschen
10. **`ContactList`** – Tabelle mit ID, Kategorie, Name + "Neuer Kontakt" Button
11. **`ContactDetail`** – Stammdaten, Adresse (+ Rechnungsadresse), Kommunikation, 2. Person – alles mit Lock/Unlock
12. **`ObjectList`** – Tabelle mit ID, Bezeichnung, Ort + "Neues Objekt" Button
13. **`ObjectDetail`** – Objekttyp, Baujahr, Wohneinheiten, Adresse – mit Lock/Unlock
14. **`ProcessForm`** – Neuer Vorgang: Typauswahl (EB/EL/SV/IM/VS), Live-Vorschau der Vorgangsnummer, Kundensuche + Inline-Erstellung, Objektsuche + Inline-Erstellung, VS-Speziallogik
15. **`AdminView`** – Benutzertabelle mit Nutzer erstellen/bearbeiten Modal (Stammdaten + Stundensätze)
16. **`ContactModal`** – Schnell-Erstellung eines Kontakts
17. **`ObjectModal`** – Schnell-Erstellung eines Objekts

### Interne Hilfskomponenten (nicht exportiert):

- `NavItem` – Sidebar-Navigation-Element
- `StatCard` – Dashboard-Statistik-Karte
- `AddressFields` – Wiederverwendbare Adressfelder (Straße, Hnr, PLZ, Ort, Land)
- `PickList` – Such-/Auswahlliste für Kontakte/Objekte
- `InvoiceModal` – Rechnung erstellen/bearbeiten (mit Zahlungsziel-Berechnung)
- `UserEditModal` – Nutzer erstellen/bearbeiten (mit Stundensätzen)

### WICHTIG – LoginScreen (NEU, nicht in CRM4):

Da CRM4 keinen Login hatte, muss `LoginScreen` als neue Komponente hinzugefügt werden:

```tsx
export const LoginScreen: React.FC<{ onLogin: (username: string, password: string) => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  return (
    <div className="h-screen flex items-center justify-center login-gradient">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="bg-indigo-600 p-3 rounded-2xl inline-block mb-4 shadow-lg shadow-indigo-500/20">
            <FolderKanban className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800">KMU CRM <span className="text-indigo-500">Pro</span></h1>
          <p className="text-xs text-slate-400 mt-1">Bitte anmelden</p>
        </div>
        <div className="space-y-4">
          <FormField label="Benutzername" value={username} onChange={setUsername} placeholder="admin" />
          <FormField label="Passwort" type="password" value={password} onChange={setPassword} placeholder="••••••" />
        </div>
        <button
          onClick={() => onLogin(username, password)}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all active:scale-95"
        >ANMELDEN</button>
      </div>
    </div>
  );
};
```

### WICHTIG – Layout muss `onLogout` Prop erhalten:

Das Layout aus CRM4 hat keinen Logout-Button. Füge in der Sidebar unten (nach "Angemeldet als") einen Logout-Button hinzu:

```tsx
<button onClick={onLogout} className="mt-2 text-xs text-slate-500 hover:text-rose-400 transition-colors">Abmelden</button>
```

### WICHTIG – Layout Props erweitert:

```typescript
export const Layout: React.FC<{
  // ... alle CRM4 Props ...
  onLogout: () => void;  // NEU
}>
```

### UI-Details die EXAKT beibehalten werden müssen:

1. **Sidebar-Navigation:** Dashboard, Vorgänge, Interne Zeiten, Kontakte, Objekte, Benutzer (nur ADMIN), "Neuer Vorgang" Button
2. **Top-Bar:** Zurück-Button (ChevronLeft), Aktiver Nutzer Dropdown, Suchfeld (Vorgänge/Kontakte/Objekte), Interner Timer (Play/Pause/Stop), Vorgangs-Timer (Start/Stop mit Prozessnummer-Anzeige)
3. **Dashboard:** 9 Status-Kacheln (klickbar → filtert Vorgangsliste), Systemleistung (4 Karten), Persönliche Produktivität (4 Karten), Aktivitätsverlauf (letzte 15 Einträge), Überfällige Rechnungen, Offene Aufgaben
4. **ProcessDetail:** Finanz-Übersicht (Kosten/Rechnung/Bezahlt/Gewinn), Lock/Unlock + Timer Start/Stop, 3 Karten (Auftraggeber/Endkunde/Objekt – klickbar), Aktenvermerk-Formular (Zeitpunkt, Wiedervorlage, Dauer, Satz, Zuweisung, Textbausteine), Rechnungen-Tabelle, Aktenvermerke-Verlauf
5. **ProcessForm:** Live-Vorschau Vorgangsnummer, 5 Typ-Buttons, Kundensuche mit Autocomplete + Inline-Neuerstellung, Objektsuche mit Autocomplete + Inline-Neuerstellung

### Lucide-React Icons (alle verwendet):

```typescript
import {
  LayoutDashboard, FolderKanban, Users, MapPin, Search, Plus, Timer,
  FileText, X, Filter, ArrowUpDown, Building2, UserCircle, Save, Lock, Unlock,
  Edit2, ChevronLeft, Coffee, ShieldCheck, UserPlus, Trash2, CheckCircle2,
  Euro, ChevronRight, Play, Briefcase, Info, Home, Building, ExternalLink,
  Link as LinkIcon, Check, Globe, AlertCircle, Clock, Receipt, TrendingUp,
  Activity, BarChart3, Settings2, LogOut
} from 'lucide-react';
```

---

## DATEI 9: `backend/server.js` – NICHT ÄNDERN

Das Backend ist komplett fertig mit:
- JWT-Authentifizierung (Login, Token-Verifizierung)
- Vollständiges CRUD für: Users, Contacts, Processes, Objects, Notes
- `runMigrations()` – Erstellt Tabellen und führt Spalten-Migrationen durch
- Mapper-Funktionen (snake_case → camelCase)
- DB-Retry-Loop (bis zu 10 Versuche)
- Admin-User wird automatisch erstellt (admin / admin123)

---

## DATEI 10: `backend/package.json` – NICHT ÄNDERN

```json
{
  "name": "crm-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.6",
    "dotenv": "^17.2.4",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.3",
    "pg": "^8.11.5"
  }
}
```

---

## DATEI 11: `backend/Dockerfile` – NICHT ÄNDERN

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

---

## DATEI 12: `docker-compose.yml`

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: crm_admin
      POSTGRES_PASSWORD: HeroeS88
      POSTGRES_DB: crm_production
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: always

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DB_HOST=db
      - DB_PORT=5432
      - DB_USER=crm_admin
      - DB_PASSWORD=HeroeS88
      - DB_NAME=crm_production
      - JWT_SECRET=HeroeS93
      - BACKEND_PORT=3000
      - API_KEY=${API_KEY}
    depends_on:
      - db
    restart: always

  nginx:
    image: nginx:stable-alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./dist:/usr/share/nginx/html:ro
    depends_on:
      - backend
    restart: always

volumes:
  postgres_data:
```

**WICHTIG:** Kein `env_file: ./backend/.env` – Die Datei existiert nicht!

---

## DATEI 13: `nginx.conf`

```nginx
server {
    listen 80;
    server_name localhost;
    client_max_body_size 10m;

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

---

## DATEI 14: `init.sql`

```sql
-- CRM Pro Database Schema with Migrations
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    username TEXT UNIQUE,
    role TEXT DEFAULT 'STANDARD',
    cost_rate DECIMAL(10,2) DEFAULT 0,
    rates JSONB DEFAULT '[]',
    standard_rate_profile_id TEXT DEFAULT '',
    password_hash TEXT,
    failed_attempts INTEGER DEFAULT 0,
    is_locked BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    category TEXT DEFAULT 'Privatperson',
    company_name TEXT, first_name TEXT, last_name TEXT,
    salutation TEXT, title TEXT, uc_id TEXT,
    phone_mobile TEXT, phone_landline TEXT,
    email_business TEXT, email_private TEXT,
    preferred_contact_way TEXT DEFAULT 'Email',
    address JSONB DEFAULT '{}',
    billing_address_active BOOLEAN DEFAULT FALSE,
    billing_address JSONB,
    second_person_active BOOLEAN DEFAULT FALSE,
    second_person_data JSONB,
    internal_notes TEXT DEFAULT '',
    company_contacts JSONB DEFAULT '[]',
    website TEXT, industry TEXT, legal_form TEXT, ust_id TEXT,
    cooperation_status TEXT, conditions TEXT, region TEXT
);

CREATE TABLE IF NOT EXISTS processes (
    id SERIAL PRIMARY KEY,
    process_number TEXT UNIQUE,
    type TEXT DEFAULT 'EB',
    customer_id TEXT, end_customer_id TEXT, object_id TEXT,
    title TEXT, status TEXT DEFAULT 'Lead',
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    service_provider TEXT, vs_number TEXT,
    internal_notes TEXT DEFAULT '', storage_link TEXT DEFAULT '',
    invoices JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    process_id TEXT, process_number TEXT,
    user_id TEXT, user_name TEXT,
    text TEXT DEFAULT '',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration DECIMAL(10,3) DEFAULT 0,
    rate_profile_id TEXT,
    assigned_user_id TEXT, resubmission_date TEXT,
    is_done BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS objects (
    id SERIAL PRIMARY KEY,
    display_name TEXT, object_type TEXT, build_year TEXT,
    units INTEGER DEFAULT 0,
    address JSONB DEFAULT '{}',
    owners JSONB DEFAULT '[]',
    notes TEXT DEFAULT ''
);

-- Admin User 'admin' / 'admin123'
INSERT INTO users (id, name, username, role, cost_rate, rates, standard_rate_profile_id, password_hash)
VALUES ('u1', 'System Administrator', 'admin', 'ADMIN', 85.00, '[{"roleName": "Sachverstaendiger", "rate": 150}]', 'Sachverstaendiger', '$2a$10$vI8A7sz51qV5W9.f8.6.GeLqZp6N6gO.P.D6qO1i.V6D8.r0G.Z0e')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
```

---

## DATEI 15: `vite.config.ts`

```typescript
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [tailwindcss(), react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
```

**WICHTIG:** Tailwind v4 mit `@tailwindcss/vite` Plugin, NICHT CDN!

---

## DATEI 16: `package.json`

```json
{
  "name": "v5-crm",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.562.0",
    "react": "^19.2.3",
    "react-dom": "^19.2.3"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.18",
    "@types/node": "^22.14.0",
    "@vitejs/plugin-react": "^5.0.0",
    "tailwindcss": "^4.1.18",
    "typescript": "~5.8.2",
    "vite": "^6.2.0"
  }
}
```

---

## DATEI 17: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "experimentalDecorators": true,
    "useDefineForClassFields": false,
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "types": ["node"],
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "moduleDetection": "force",
    "allowJs": true,
    "jsx": "react-jsx",
    "paths": { "@/*": ["./*"] },
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

---

## ZUSAMMENFASSUNG DER AUFGABE

Erstelle **exakt diese Dateien**:

| # | Datei | Aktion |
|---|---|---|
| 1 | `index.html` | Exakt wie oben |
| 2 | `index.tsx` | Exakt wie oben |
| 3 | `index.css` | Exakt wie oben |
| 4 | `types.ts` | Exakt wie oben |
| 5 | `utils.ts` | Exakt wie oben |
| 6 | `api.ts` | NICHT ÄNDERN – exakt übernehmen |
| 7 | `App.tsx` | **HAUPTARBEIT** – CRM4-Logik + API-Anbindung + Login |
| 8 | `components/UIComponents.tsx` | **HAUPTARBEIT** – CRM4-Design exakt + LoginScreen hinzufügen |
| 9 | `backend/server.js` | NICHT ÄNDERN |
| 10 | `backend/package.json` | NICHT ÄNDERN |
| 11 | `backend/Dockerfile` | NICHT ÄNDERN |
| 12 | `docker-compose.yml` | Exakt wie oben |
| 13 | `nginx.conf` | Exakt wie oben |
| 14 | `init.sql` | Exakt wie oben |
| 15 | `vite.config.ts` | Exakt wie oben |
| 16 | `package.json` | Exakt wie oben |
| 17 | `tsconfig.json` | Exakt wie oben |

### REGELN:

1. **`npm run build` muss fehlerfrei durchlaufen** – keine TypeScript-Fehler, keine fehlenden Imports
2. **Das UI muss EXAKT dem CRM4-Design entsprechen** – dunkle Sidebar, Timer in Top-Bar, Dashboard-Kacheln, gerundete Karten
3. **Alle CRUD-Operationen müssen über `ApiService` laufen** – keine Mock-Daten
4. **PostgreSQL DECIMAL kommt als String** – immer `Number()` verwenden vor `.toFixed()`
5. **`processId === 'INTERNAL'`** kennzeichnet interne Zeiteinträge
6. **Backend verwendet snake_case** – Mapper-Funktionen in server.js konvertieren zu camelCase
7. **Login: admin / admin123** – LoginScreen muss vor dem Layout angezeigt werden
8. **Keine zusätzlichen Abhängigkeiten** außer den in package.json gelisteten
9. **Kein `<script type="importmap">` in index.html** – Vite übernimmt das Bundling
10. **Kein `env_file: ./backend/.env` in docker-compose.yml** – Die Datei existiert nicht
