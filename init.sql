-- CRM Pro Database Schema with Migrations
-- This file runs on first Docker init AND contains migration blocks for existing DBs

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
    company_name TEXT,
    first_name TEXT,
    last_name TEXT,
    salutation TEXT,
    title TEXT,
    uc_id TEXT,
    phone_mobile TEXT,
    phone_landline TEXT,
    email_business TEXT,
    email_private TEXT,
    preferred_contact_way TEXT DEFAULT 'Email',
    address JSONB DEFAULT '{}',
    billing_address_active BOOLEAN DEFAULT FALSE,
    billing_address JSONB,
    second_person_active BOOLEAN DEFAULT FALSE,
    second_person_data JSONB,
    internal_notes TEXT DEFAULT '',
    company_contacts JSONB DEFAULT '[]',
    website TEXT,
    industry TEXT,
    legal_form TEXT,
    ust_id TEXT,
    cooperation_status TEXT,
    conditions TEXT,
    region TEXT
);

CREATE TABLE IF NOT EXISTS processes (
    id SERIAL PRIMARY KEY,
    process_number TEXT UNIQUE,
    type TEXT DEFAULT 'EB',
    customer_id TEXT,
    end_customer_id TEXT,
    object_id TEXT,
    title TEXT,
    status TEXT DEFAULT 'Lead',
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    service_provider TEXT,
    vs_number TEXT,
    internal_notes TEXT DEFAULT '',
    storage_link TEXT DEFAULT '',
    invoices JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    process_id TEXT,
    process_number TEXT,
    user_id TEXT,
    user_name TEXT,
    text TEXT DEFAULT '',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration DECIMAL(10,3) DEFAULT 0,
    rate_profile_id TEXT,
    assigned_user_id TEXT,
    resubmission_date TEXT,
    is_done BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS objects (
    id SERIAL PRIMARY KEY,
    display_name TEXT,
    object_type TEXT,
    build_year TEXT,
    units INTEGER DEFAULT 0,
    address JSONB DEFAULT '{}',
    owners JSONB DEFAULT '[]',
    notes TEXT DEFAULT ''
);

-- Migration blocks for existing databases
DO $$ BEGIN
  -- Users migrations
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='failed_attempts') THEN
    ALTER TABLE users ADD COLUMN failed_attempts INTEGER DEFAULT 0;
  END IF;

  -- Contacts migrations: change id type if needed, add missing columns
  BEGIN ALTER TABLE contacts ALTER COLUMN customer_id TYPE TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER TABLE contacts ALTER COLUMN process_id TYPE TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='salutation') THEN
    ALTER TABLE contacts ADD COLUMN salutation TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='title') THEN
    ALTER TABLE contacts ADD COLUMN title TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='uc_id') THEN
    ALTER TABLE contacts ADD COLUMN uc_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='email_private') THEN
    ALTER TABLE contacts ADD COLUMN email_private TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='preferred_contact_way') THEN
    ALTER TABLE contacts ADD COLUMN preferred_contact_way TEXT DEFAULT 'Email';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='billing_address_active') THEN
    ALTER TABLE contacts ADD COLUMN billing_address_active BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='billing_address') THEN
    ALTER TABLE contacts ADD COLUMN billing_address JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='second_person_active') THEN
    ALTER TABLE contacts ADD COLUMN second_person_active BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='second_person_data') THEN
    ALTER TABLE contacts ADD COLUMN second_person_data JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='company_contacts') THEN
    ALTER TABLE contacts ADD COLUMN company_contacts JSONB DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='website') THEN
    ALTER TABLE contacts ADD COLUMN website TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='industry') THEN
    ALTER TABLE contacts ADD COLUMN industry TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='legal_form') THEN
    ALTER TABLE contacts ADD COLUMN legal_form TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='ust_id') THEN
    ALTER TABLE contacts ADD COLUMN ust_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='cooperation_status') THEN
    ALTER TABLE contacts ADD COLUMN cooperation_status TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='conditions') THEN
    ALTER TABLE contacts ADD COLUMN conditions TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='region') THEN
    ALTER TABLE contacts ADD COLUMN region TEXT;
  END IF;

  -- Processes migrations
  BEGIN ALTER TABLE processes ALTER COLUMN customer_id TYPE TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='processes' AND column_name='end_customer_id') THEN
    ALTER TABLE processes ADD COLUMN end_customer_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='processes' AND column_name='service_provider') THEN
    ALTER TABLE processes ADD COLUMN service_provider TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='processes' AND column_name='vs_number') THEN
    ALTER TABLE processes ADD COLUMN vs_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='processes' AND column_name='internal_notes') THEN
    ALTER TABLE processes ADD COLUMN internal_notes TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='processes' AND column_name='storage_link') THEN
    ALTER TABLE processes ADD COLUMN storage_link TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='processes' AND column_name='invoices') THEN
    ALTER TABLE processes ADD COLUMN invoices JSONB DEFAULT '[]';
  END IF;

  -- Notes migrations
  BEGIN ALTER TABLE notes ALTER COLUMN process_id TYPE TEXT; EXCEPTION WHEN OTHERS THEN NULL; END;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='process_number') THEN
    ALTER TABLE notes ADD COLUMN process_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='assigned_user_id') THEN
    ALTER TABLE notes ADD COLUMN assigned_user_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='resubmission_date') THEN
    ALTER TABLE notes ADD COLUMN resubmission_date TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='is_done') THEN
    ALTER TABLE notes ADD COLUMN is_done BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Admin User 'admin' / 'admin123'
INSERT INTO users (id, name, username, role, cost_rate, rates, standard_rate_profile_id, password_hash)
VALUES ('u1', 'System Administrator', 'admin', 'ADMIN', 85.00, '[{"roleName": "Sachverstaendiger", "rate": 150}]', 'Sachverstaendiger', '$2a$10$vI8A7sz51qV5W9.f8.6.GeLqZp6N6gO.P.D6qO1i.V6D8.r0G.Z0e')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
