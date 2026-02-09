
import { Contact, ContactCategory, User, UserRole, Process, ProcessType, ProcessStatus, CRMObject, Note } from './types';
import { padId } from './utils';

export const MANUAL_SNIPPETS = [
  "Telefonkontakt erfolgreich",
  "Telefonisch nicht erreicht",
  "Termin vereinbart",
  "Unterlagen angefordert",
  "Rückruf erbeten",
  "Besichtigung durchgeführt",
  "E-Mail versendet",
  "Angebot nachgefasst"
];

export const MOCK_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Admin User', 
    username: 'admin', 
    role: UserRole.ADMIN, 
    failedAttempts: 0, 
    isLocked: false,
    costRate: 65,
    rates: [
      { roleName: 'Sachverständiger', rate: 150 },
      { roleName: 'Energieberater', rate: 120 },
      { roleName: 'Intern', rate: 80 }
    ],
    standardRateProfileId: 'Sachverständiger' 
  },
  { 
    id: 'u2', 
    name: 'Expert Peter', 
    username: 'peter', 
    role: UserRole.STANDARD, 
    failedAttempts: 0, 
    isLocked: false,
    costRate: 45,
    rates: [
      { roleName: 'Sachverständiger', rate: 130 },
      { roleName: 'Intern', rate: 60 }
    ],
    standardRateProfileId: 'Sachverständiger' 
  },
];

export const INITIAL_CONTACTS: Contact[] = [
  {
    id: '0001',
    category: ContactCategory.COMPANY,
    companyName: 'BWP Heiztechnik GmbH',
    industry: 'Heizungsbau',
    legalForm: 'GmbH',
    ustId: 'DE123456789',
    internalNotes: 'Erstkontakt über Webseite, wünscht Termin vor Ort am späten Nachmittag',
    cooperationStatus: 'Aktiv',
    conditions: 'Zuarbeit TPB',
    region: 'Solingen',
    ucId: 'BWP Heiztechnik',
    phoneMobile: '0151 12345678',
    phoneLandline: '02174 123456',
    emailBusiness: 'max.mustermann@example.de',
    preferredContactWay: 'Festnetz',
    address: {
      street: 'Musterstraße',
      houseNumber: '12',
      zip: '51519',
      city: 'Odenthal',
      country: 'Deutschland'
    },
    billingAddressActive: false,
    secondPersonActive: false,
    contacts: [
      {
        id: 'c1',
        lastName: 'Mustermann',
        firstName: 'Max',
        role: 'Projektleitung',
        phoneLandline: '0212 555123',
        phoneMobile: '0176 5551234',
        email: 'b.beispiel@bwp-heiztechnik.de'
      }
    ]
  },
  {
    id: '0002',
    category: ContactCategory.PERSON,
    firstName: 'Erika',
    lastName: 'Musterfrau',
    phoneMobile: '0160 9876543',
    phoneLandline: '0221 12345',
    emailBusiness: 'erika@example.com',
    preferredContactWay: 'Mobil',
    address: { street: 'Bachweg', houseNumber: '5', zip: '50667', city: 'Köln', country: 'Deutschland' },
    billingAddressActive: false,
    secondPersonActive: false,
    internalNotes: 'Privatkunde'
  }
];

export const INITIAL_OBJECTS: CRMObject[] = [
  {
    id: '0001',
    displayName: 'MFH Bachstraße 10',
    objectType: 'Gebäude',
    buildYear: '1975',
    units: 6,
    address: { street: 'Bachstraße', houseNumber: '10', zip: '50667', city: 'Köln', country: 'Deutschland' },
    owners: [],
    notes: 'Altbau'
  },
  {
    id: '0002',
    displayName: 'EFH Sonnenhang 1',
    objectType: 'Gebäude',
    buildYear: '2005',
    units: 1,
    address: { street: 'Sonnenhang', houseNumber: '1', zip: '51519', city: 'Odenthal', country: 'Deutschland' },
    owners: [],
    notes: 'Neuwertig'
  }
];

// 10 Sample Processes for Testing
export const INITIAL_PROCESSES: Process[] = Array.from({ length: 10 }).map((_, i) => ({
  id: `p${i + 1}`,
  processNumber: `EB-0001-000${(i % 2) + 1}-${padId(i + 1, 2)}`,
  type: ProcessType.EB,
  customerId: '0001',
  objectId: padId((i % 2) + 1, 4),
  title: `Testprojekt ${i + 1}`,
  status: [ProcessStatus.LEAD, ProcessStatus.ORDERED, ProcessStatus.POTENTIAL, ProcessStatus.COMPLETED][i % 4],
  dateCreated: new Date(Date.now() - i * 86400000).toISOString(),
  invoices: i % 3 === 0 ? [{
    id: `inv${i}`,
    invoiceDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    dueDate: new Date(Date.now() - 16 * 86400000).toISOString().split('T')[0],
    amount: 1200 + i * 100,
    paidDate: i === 0 ? new Date().toISOString().split('T')[0] : undefined
  }] : []
}));

export const INITIAL_NOTES: Note[] = [
  {
    id: 'n1',
    processId: 'p1',
    processNumber: INITIAL_PROCESSES[0].processNumber,
    userId: 'u1',
    userName: 'Admin User',
    text: 'Erstes Gespräch geführt.',
    timestamp: new Date().toISOString(),
    duration: 1.5,
    rateProfileId: 'Sachverständiger'
  },
  {
    id: 'n_int_1',
    processId: 'INTERNAL',
    userId: 'u1',
    userName: 'Admin User',
    text: 'Büroorganisation',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    duration: 0.75,
    rateProfileId: 'Intern'
  }
];
