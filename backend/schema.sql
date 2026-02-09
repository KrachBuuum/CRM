CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  cost_per_hour NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE cases (
  id SERIAL PRIMARY KEY,
  case_number TEXT UNIQUE NOT NULL,
  title TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE internal_times (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  date DATE NOT NULL,
  duration_hours NUMERIC(6,3) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  cost_per_hour NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  case_number TEXT UNIQUE NOT NULL,
  title TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS internal_times (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  date DATE NOT NULL,
  duration_hours NUMERIC(6,3) NOT NULL,
  description TEXT
);
