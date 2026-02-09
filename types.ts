
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
  costRate: number; // New: Kosten pro Stunde
  standardRateProfileId: string;
}

export interface SearchResult {
  type: 'process' | 'contact' | 'object';
  id: string;
  label: string;
  sublabel: string;
}

export type TimeRange = 'Heute' | 'Diese Woche' | 'Dieser Monat';
