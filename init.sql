
-- Tabellen-Struktur sicherstellen
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    username TEXT UNIQUE,
    role TEXT,
    cost_rate DECIMAL(10,2),
    rates JSONB,
    standard_rate_profile_id TEXT,
    password_hash TEXT,
    is_locked BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    category TEXT,
    company_name TEXT,
    first_name TEXT,
    last_name TEXT,
    salutation TEXT,
    title TEXT,
    phone_mobile TEXT,
    phone_landline TEXT,
    email_business TEXT,
    email_private TEXT,
    uc_id TEXT,
    preferred_contact_way TEXT,
    address JSONB,
    billing_address_active BOOLEAN DEFAULT FALSE,
    billing_address JSONB,
    second_person_active BOOLEAN DEFAULT FALSE,
    second_person_data JSONB,
    internal_notes TEXT,
    website TEXT,
    industry TEXT,
    legal_form TEXT,
    ust_id TEXT,
    cooperation_status TEXT,
    conditions TEXT,
    region TEXT,
    company_contacts JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS processes (
    id SERIAL PRIMARY KEY,
    process_number TEXT UNIQUE,
    type TEXT,
    customer_id INTEGER,
    object_id TEXT,
    title TEXT,
    status TEXT,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    process_id INTEGER,
    user_id TEXT,
    user_name TEXT,
    text TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration DECIMAL(10,3),
    rate_profile_id TEXT
);

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

-- Admin User 'admin' / 'admin123'
-- Hash für 'admin123': $2a$10$vI8A7sz51qV5W9.f8.6.GeLqZp6N6gO.P.D6qO1i.V6D8.r0G.Z0e
INSERT INTO users (id, name, username, role, cost_rate, rates, standard_rate_profile_id, password_hash)
VALUES ('u1', 'System Administrator', 'admin', 'ADMIN', 85.00, '[{"roleName": "Sachverständiger", "rate": 150}]', 'Sachverständiger', '$2a$10$vI8A7sz51qV5W9.f8.6.GeLqZp6N6gO.P.D6qO1i.V6D8.r0G.Z0e')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
