
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
    phone_mobile TEXT,
    phone_landline TEXT,
    email_business TEXT,
    address JSONB,
    internal_notes TEXT
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

-- Admin User 'admin' / 'admin123'
INSERT INTO users (id, name, username, role, cost_rate, rates, standard_rate_profile_id, password_hash)
VALUES ('u1', 'System Administrator', 'admin', 'ADMIN', 85.00, '[{"roleName": "Sachverständiger", "rate": 150}]', 'Sachverständiger', '$2a$10$SfjkaRvV3rzMjIzl9jTj1uo4sfvPJ/nCgY8KNVzLpw82hrOfNBnd2')
ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;
