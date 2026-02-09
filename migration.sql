-- Migration: Neue Spalten für contacts-Tabelle
-- Auf dem Raspberry Pi ausführen:
-- sudo docker exec -it crm-pro-db-1 psql -U crm_admin -d crm_production -f /tmp/migration.sql
-- Oder Befehle einzeln per -c ausführen

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS salutation TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS email_private TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS uc_id TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS preferred_contact_way TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS billing_address_active BOOLEAN DEFAULT FALSE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS billing_address JSONB;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS second_person_active BOOLEAN DEFAULT FALSE;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS second_person_data JSONB;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS legal_form TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS ust_id TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS cooperation_status TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS conditions TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS company_contacts JSONB DEFAULT '[]';

-- Objects-Tabelle (falls noch nicht vorhanden)
CREATE TABLE IF NOT EXISTS objects (
    id SERIAL PRIMARY KEY,
    display_name TEXT,
    object_type TEXT,
    build_year TEXT,
    units INTEGER,
    address JSONB,
    owners JSONB,
    notes TEXT
);
