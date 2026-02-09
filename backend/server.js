require("dotenv").config()

const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const { Pool } = require("pg")

const app = express()

app.use(cors({ origin: true }))
app.use(express.json({ limit: '10mb' }))

const pool = new Pool({
  host: process.env.DB_HOST || "db",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "crm_admin",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "crm_production",
})

const JWT_SECRET = process.env.JWT_SECRET || "change_me"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

// --- DB Migration on Startup ---
async function runMigrations() {
  const client = await pool.connect()
  try {
    console.log("Running database migrations...")

    // Create all tables if they don't exist
    await client.query(`
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
        id TEXT PRIMARY KEY,
        category TEXT,
        company_name TEXT,
        website TEXT,
        industry TEXT,
        legal_form TEXT,
        ust_id TEXT,
        cooperation_status TEXT,
        conditions TEXT,
        region TEXT,
        salutation TEXT,
        title TEXT,
        first_name TEXT,
        last_name TEXT,
        uc_id TEXT,
        phone_mobile TEXT,
        phone_landline TEXT,
        email_business TEXT,
        email_private TEXT,
        preferred_contact_way TEXT DEFAULT 'Mobil',
        address JSONB,
        billing_address_active BOOLEAN DEFAULT FALSE,
        billing_address JSONB,
        second_person_active BOOLEAN DEFAULT FALSE,
        second_person_data JSONB,
        internal_notes TEXT,
        contacts JSONB
      );
      CREATE TABLE IF NOT EXISTS processes (
        id TEXT PRIMARY KEY,
        process_number TEXT UNIQUE,
        type TEXT,
        customer_id TEXT,
        end_customer_id TEXT,
        object_id TEXT,
        title TEXT,
        status TEXT,
        date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        service_provider TEXT,
        vs_number TEXT,
        internal_notes TEXT,
        storage_link TEXT,
        invoices JSONB DEFAULT '[]'
      );
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        process_id TEXT,
        process_number TEXT,
        user_id TEXT,
        user_name TEXT,
        text TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        duration DECIMAL(10,3),
        rate_profile_id TEXT,
        assigned_user_id TEXT,
        resubmission_date TEXT,
        is_done BOOLEAN DEFAULT FALSE
      );
      CREATE TABLE IF NOT EXISTS objects (
        id TEXT PRIMARY KEY,
        display_name TEXT,
        object_type TEXT,
        build_year TEXT,
        units INTEGER DEFAULT 0,
        address JSONB,
        owners JSONB DEFAULT '[]',
        notes TEXT
      );
    `)

    // Migrate column types (SERIAL/INTEGER -> TEXT) for old installations
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contacts' AND column_name='id' AND data_type='integer') THEN
          ALTER TABLE contacts ALTER COLUMN id DROP DEFAULT;
          ALTER TABLE contacts ALTER COLUMN id TYPE TEXT USING id::TEXT;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='processes' AND column_name='id' AND data_type='integer') THEN
          ALTER TABLE processes ALTER COLUMN id DROP DEFAULT;
          ALTER TABLE processes ALTER COLUMN id TYPE TEXT USING id::TEXT;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='id' AND data_type='integer') THEN
          ALTER TABLE notes ALTER COLUMN id DROP DEFAULT;
          ALTER TABLE notes ALTER COLUMN id TYPE TEXT USING id::TEXT;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='processes' AND column_name='customer_id' AND data_type='integer') THEN
          ALTER TABLE processes ALTER COLUMN customer_id TYPE TEXT USING customer_id::TEXT;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notes' AND column_name='process_id' AND data_type='integer') THEN
          ALTER TABLE notes ALTER COLUMN process_id TYPE TEXT USING process_id::TEXT;
        END IF;
      END$$;
    `)

    // Add missing columns for old installations
    const addCol = async (table, col, type) => {
      const check = await client.query(
        "SELECT 1 FROM information_schema.columns WHERE table_name=$1 AND column_name=$2",
        [table, col]
      )
      if (check.rowCount === 0) {
        await client.query(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`)
        console.log(`  Added column ${table}.${col}`)
      }
    }

    // contacts columns
    await addCol("contacts", "website", "TEXT")
    await addCol("contacts", "industry", "TEXT")
    await addCol("contacts", "legal_form", "TEXT")
    await addCol("contacts", "ust_id", "TEXT")
    await addCol("contacts", "cooperation_status", "TEXT")
    await addCol("contacts", "conditions", "TEXT")
    await addCol("contacts", "region", "TEXT")
    await addCol("contacts", "salutation", "TEXT")
    await addCol("contacts", "title", "TEXT")
    await addCol("contacts", "uc_id", "TEXT")
    await addCol("contacts", "email_private", "TEXT")
    await addCol("contacts", "preferred_contact_way", "TEXT DEFAULT 'Mobil'")
    await addCol("contacts", "billing_address_active", "BOOLEAN DEFAULT FALSE")
    await addCol("contacts", "billing_address", "JSONB")
    await addCol("contacts", "second_person_active", "BOOLEAN DEFAULT FALSE")
    await addCol("contacts", "second_person_data", "JSONB")
    await addCol("contacts", "contacts", "JSONB")

    // processes columns
    await addCol("processes", "end_customer_id", "TEXT")
    await addCol("processes", "service_provider", "TEXT")
    await addCol("processes", "vs_number", "TEXT")
    await addCol("processes", "internal_notes", "TEXT")
    await addCol("processes", "storage_link", "TEXT")
    await addCol("processes", "invoices", "JSONB DEFAULT '[]'")

    // notes columns
    await addCol("notes", "process_number", "TEXT")
    await addCol("notes", "assigned_user_id", "TEXT")
    await addCol("notes", "resubmission_date", "TEXT")
    await addCol("notes", "is_done", "BOOLEAN DEFAULT FALSE")

    // Ensure admin user exists
    const adminCheck = await client.query("SELECT 1 FROM users WHERE username='admin'")
    if (adminCheck.rowCount === 0) {
      const hash = await bcrypt.hash("admin123", 10)
      await client.query(
        `INSERT INTO users (id, name, username, role, cost_rate, rates, standard_rate_profile_id, password_hash)
         VALUES ('u1', 'System Administrator', 'admin', 'ADMIN', 85.00, $1, 'Sachverständiger', $2)`,
        [JSON.stringify([{ roleName: "Sachverständiger", rate: 150 }]), hash]
      )
      console.log("  Created default admin user (admin/admin123)")
    }

    console.log("Database migrations completed.")
  } catch (err) {
    console.error("Migration error:", err.message)
  } finally {
    client.release()
  }
}

// --- Helper: snake_case DB rows -> camelCase for frontend ---
function mapContact(row) {
  if (!row) return null
  return {
    id: String(row.id),
    category: row.category,
    companyName: row.company_name,
    website: row.website,
    industry: row.industry,
    legalForm: row.legal_form,
    ustId: row.ust_id,
    cooperationStatus: row.cooperation_status,
    conditions: row.conditions,
    region: row.region,
    salutation: row.salutation,
    title: row.title,
    firstName: row.first_name,
    lastName: row.last_name,
    ucId: row.uc_id,
    phoneMobile: row.phone_mobile || '',
    phoneLandline: row.phone_landline || '',
    emailBusiness: row.email_business || '',
    emailPrivate: row.email_private,
    preferredContactWay: row.preferred_contact_way || 'Mobil',
    address: row.address || { street: '', houseNumber: '', zip: '', city: '', country: 'Deutschland' },
    billingAddressActive: row.billing_address_active || false,
    billingAddress: row.billing_address,
    secondPersonActive: row.second_person_active || false,
    secondPersonData: row.second_person_data,
    internalNotes: row.internal_notes || '',
    contacts: row.contacts || [],
  }
}

function mapProcess(row) {
  if (!row) return null
  return {
    id: String(row.id),
    processNumber: row.process_number,
    type: row.type,
    customerId: String(row.customer_id || ''),
    endCustomerId: row.end_customer_id,
    objectId: row.object_id || '',
    title: row.title,
    status: row.status,
    dateCreated: row.date_created,
    serviceProvider: row.service_provider,
    vsNumber: row.vs_number,
    internalNotes: row.internal_notes,
    storageLink: row.storage_link,
    invoices: row.invoices || [],
  }
}

function mapNote(row) {
  if (!row) return null
  return {
    id: String(row.id),
    processId: String(row.process_id || ''),
    processNumber: row.process_number,
    userId: row.user_id,
    userName: row.user_name,
    text: row.text,
    timestamp: row.timestamp,
    duration: parseFloat(row.duration) || 0,
    rateProfileId: row.rate_profile_id,
    assignedUserId: row.assigned_user_id,
    resubmissionDate: row.resubmission_date,
    isDone: row.is_done || false,
  }
}

function mapObject(row) {
  if (!row) return null
  return {
    id: String(row.id),
    displayName: row.display_name,
    objectType: row.object_type || '',
    buildYear: row.build_year || '',
    units: row.units || 0,
    address: row.address || { street: '', houseNumber: '', zip: '', city: '', country: 'Deutschland' },
    owners: row.owners || [],
    notes: row.notes || '',
  }
}

function mapUser(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    role: row.role,
    costRate: parseFloat(row.cost_rate) || 0,
    rates: row.rates || [],
    standardRateProfileId: row.standard_rate_profile_id || '',
    isLocked: row.is_locked || false,
    failedAttempts: 0,
  }
}

// --- AUTH ---

function requireAuth(req, res, next) {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: "token fehlt" })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch (err) {
    return res.status(401).json({ error: "token ungültig oder abgelaufen" })
  }
}

app.get("/api/health", (req, res) => res.json({ ok: true }))

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {}
    if (!username || !password) return res.status(400).json({ error: "username und password sind erforderlich" })

    const result = await pool.query("SELECT * FROM users WHERE username = $1 LIMIT 1", [username])
    if (result.rowCount === 0) return res.status(401).json({ error: "ungültige zugangsdaten" })

    const user = result.rows[0]
    if (user.is_locked) return res.status(403).json({ error: "konto gesperrt" })

    const ok = await bcrypt.compare(password, user.password_hash || "")
    if (!ok) return res.status(401).json({ error: "ungültige zugangsdaten" })

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } })
  } catch (err) {
    console.error("Login error:", err.message)
    res.status(500).json({ error: "Serverfehler beim Login" })
  }
})

app.get("/api/me", requireAuth, (req, res) => res.json({ user: req.user }))

// --- USERS ---

app.get("/api/users", requireAuth, async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM users ORDER BY username")
    res.json(r.rows.map(mapUser))
  } catch (err) {
    console.error("GET users error:", err.message)
    res.status(500).json({ error: "Benutzer laden fehlgeschlagen" })
  }
})

app.post("/api/users", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Nur Admins dürfen Benutzer erstellen" })
    const u = req.body || {}
    if (!u.username || !u.name || !u.password) return res.status(400).json({ error: "name, username und password sind erforderlich" })
    const hash = await bcrypt.hash(u.password, 10)
    const r = await pool.query(
      `INSERT INTO users (id, name, username, role, cost_rate, rates, standard_rate_profile_id, password_hash, is_locked)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [u.id || Math.random().toString(36).substr(2, 9), u.name, u.username, u.role || "STANDARD", u.costRate ?? 0, JSON.stringify(u.rates || []), u.standardRateProfileId || "", hash, u.isLocked ?? false]
    )
    res.status(201).json(mapUser(r.rows[0]))
  } catch (err) {
    console.error("POST users error:", err.message)
    res.status(500).json({ error: err.message.includes("duplicate") ? "Benutzername existiert bereits" : "Benutzer erstellen fehlgeschlagen: " + err.message })
  }
})

app.put("/api/users/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Nur Admins dürfen Benutzer bearbeiten" })
    const u = req.body || {}
    let r
    if (u.password) {
      const hash = await bcrypt.hash(u.password, 10)
      r = await pool.query(
        `UPDATE users SET name=$1, username=$2, role=$3, cost_rate=$4, rates=$5, standard_rate_profile_id=$6, is_locked=$7, password_hash=$8 WHERE id=$9 RETURNING *`,
        [u.name, u.username, u.role, u.costRate ?? 0, JSON.stringify(u.rates || []), u.standardRateProfileId || "", u.isLocked ?? false, hash, req.params.id]
      )
    } else {
      r = await pool.query(
        `UPDATE users SET name=$1, username=$2, role=$3, cost_rate=$4, rates=$5, standard_rate_profile_id=$6, is_locked=$7 WHERE id=$8 RETURNING *`,
        [u.name, u.username, u.role, u.costRate ?? 0, JSON.stringify(u.rates || []), u.standardRateProfileId || "", u.isLocked ?? false, req.params.id]
      )
    }
    if (r.rowCount === 0) return res.status(404).json({ error: "Benutzer nicht gefunden" })
    res.json(mapUser(r.rows[0]))
  } catch (err) {
    console.error("PUT users error:", err.message)
    res.status(500).json({ error: "Benutzer bearbeiten fehlgeschlagen: " + err.message })
  }
})

app.delete("/api/users/:id", requireAuth, async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Nur Admins dürfen Benutzer löschen" })
    if (req.params.id === req.user.id) return res.status(400).json({ error: "Eigenen Account kann man nicht löschen" })
    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id])
    res.status(204).end()
  } catch (err) {
    console.error("DELETE users error:", err.message)
    res.status(500).json({ error: "Benutzer löschen fehlgeschlagen" })
  }
})

// --- CONTACTS ---

app.get("/api/contacts", requireAuth, async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM contacts ORDER BY id DESC")
    res.json(r.rows.map(mapContact))
  } catch (err) {
    console.error("GET contacts error:", err.message)
    res.status(500).json({ error: "Kontakte laden fehlgeschlagen" })
  }
})

app.post("/api/contacts", requireAuth, async (req, res) => {
  try {
    const c = req.body || {}
    const r = await pool.query(
      `INSERT INTO contacts (id, category, company_name, website, industry, legal_form, ust_id, cooperation_status, conditions, region, salutation, title, first_name, last_name, uc_id, phone_mobile, phone_landline, email_business, email_private, preferred_contact_way, address, billing_address_active, billing_address, second_person_active, second_person_data, internal_notes, contacts)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27) RETURNING *`,
      [c.id, c.category, c.companyName, c.website, c.industry, c.legalForm, c.ustId, c.cooperationStatus, c.conditions, c.region, c.salutation, c.title, c.firstName, c.lastName, c.ucId, c.phoneMobile, c.phoneLandline, c.emailBusiness, c.emailPrivate, c.preferredContactWay || 'Mobil', JSON.stringify(c.address || {}), c.billingAddressActive ?? false, JSON.stringify(c.billingAddress || null), c.secondPersonActive ?? false, JSON.stringify(c.secondPersonData || null), c.internalNotes, JSON.stringify(c.contacts || [])]
    )
    res.status(201).json(mapContact(r.rows[0]))
  } catch (err) {
    console.error("POST contacts error:", err.message)
    res.status(500).json({ error: "Kontakt erstellen fehlgeschlagen: " + err.message })
  }
})

app.put("/api/contacts/:id", requireAuth, async (req, res) => {
  try {
    const c = req.body || {}
    const r = await pool.query(
      `UPDATE contacts SET category=$1, company_name=$2, website=$3, industry=$4, legal_form=$5, ust_id=$6, cooperation_status=$7, conditions=$8, region=$9, salutation=$10, title=$11, first_name=$12, last_name=$13, uc_id=$14, phone_mobile=$15, phone_landline=$16, email_business=$17, email_private=$18, preferred_contact_way=$19, address=$20, billing_address_active=$21, billing_address=$22, second_person_active=$23, second_person_data=$24, internal_notes=$25, contacts=$26
       WHERE id=$27 RETURNING *`,
      [c.category, c.companyName, c.website, c.industry, c.legalForm, c.ustId, c.cooperationStatus, c.conditions, c.region, c.salutation, c.title, c.firstName, c.lastName, c.ucId, c.phoneMobile, c.phoneLandline, c.emailBusiness, c.emailPrivate, c.preferredContactWay, JSON.stringify(c.address || {}), c.billingAddressActive ?? false, JSON.stringify(c.billingAddress || null), c.secondPersonActive ?? false, JSON.stringify(c.secondPersonData || null), c.internalNotes, JSON.stringify(c.contacts || []), req.params.id]
    )
    if (r.rowCount === 0) return res.status(404).json({ error: "Kontakt nicht gefunden" })
    res.json(mapContact(r.rows[0]))
  } catch (err) {
    console.error("PUT contacts error:", err.message)
    res.status(500).json({ error: "Kontakt bearbeiten fehlgeschlagen: " + err.message })
  }
})

// --- PROCESSES ---

app.get("/api/processes", requireAuth, async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM processes ORDER BY date_created DESC")
    res.json(r.rows.map(mapProcess))
  } catch (err) {
    console.error("GET processes error:", err.message)
    res.status(500).json({ error: "Vorgänge laden fehlgeschlagen" })
  }
})

app.post("/api/processes", requireAuth, async (req, res) => {
  try {
    const p = req.body || {}
    const r = await pool.query(
      `INSERT INTO processes (id, process_number, type, customer_id, end_customer_id, object_id, title, status, date_created, service_provider, vs_number, internal_notes, storage_link, invoices)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [p.id, p.processNumber, p.type, p.customerId, p.endCustomerId, p.objectId, p.title, p.status, p.dateCreated || new Date().toISOString(), p.serviceProvider, p.vsNumber, p.internalNotes, p.storageLink, JSON.stringify(p.invoices || [])]
    )
    res.status(201).json(mapProcess(r.rows[0]))
  } catch (err) {
    console.error("POST processes error:", err.message)
    res.status(500).json({ error: "Vorgang erstellen fehlgeschlagen: " + err.message })
  }
})

app.put("/api/processes/:id", requireAuth, async (req, res) => {
  try {
    const p = req.body || {}
    const r = await pool.query(
      `UPDATE processes SET process_number=$1, type=$2, customer_id=$3, end_customer_id=$4, object_id=$5, title=$6, status=$7, service_provider=$8, vs_number=$9, internal_notes=$10, storage_link=$11, invoices=$12
       WHERE id=$13 RETURNING *`,
      [p.processNumber, p.type, p.customerId, p.endCustomerId, p.objectId, p.title, p.status, p.serviceProvider, p.vsNumber, p.internalNotes, p.storageLink, JSON.stringify(p.invoices || []), req.params.id]
    )
    if (r.rowCount === 0) return res.status(404).json({ error: "Vorgang nicht gefunden" })
    res.json(mapProcess(r.rows[0]))
  } catch (err) {
    console.error("PUT processes error:", err.message)
    res.status(500).json({ error: "Vorgang bearbeiten fehlgeschlagen: " + err.message })
  }
})

// --- OBJECTS ---

app.get("/api/objects", requireAuth, async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM objects ORDER BY id DESC")
    res.json(r.rows.map(mapObject))
  } catch (err) {
    console.error("GET objects error:", err.message)
    res.status(500).json({ error: "Objekte laden fehlgeschlagen" })
  }
})

app.post("/api/objects", requireAuth, async (req, res) => {
  try {
    const o = req.body || {}
    const r = await pool.query(
      `INSERT INTO objects (id, display_name, object_type, build_year, units, address, owners, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [o.id, o.displayName, o.objectType, o.buildYear, o.units || 0, JSON.stringify(o.address || {}), JSON.stringify(o.owners || []), o.notes]
    )
    res.status(201).json(mapObject(r.rows[0]))
  } catch (err) {
    console.error("POST objects error:", err.message)
    res.status(500).json({ error: "Objekt erstellen fehlgeschlagen: " + err.message })
  }
})

app.put("/api/objects/:id", requireAuth, async (req, res) => {
  try {
    const o = req.body || {}
    const r = await pool.query(
      `UPDATE objects SET display_name=$1, object_type=$2, build_year=$3, units=$4, address=$5, owners=$6, notes=$7 WHERE id=$8 RETURNING *`,
      [o.displayName, o.objectType, o.buildYear, o.units || 0, JSON.stringify(o.address || {}), JSON.stringify(o.owners || []), o.notes, req.params.id]
    )
    if (r.rowCount === 0) return res.status(404).json({ error: "Objekt nicht gefunden" })
    res.json(mapObject(r.rows[0]))
  } catch (err) {
    console.error("PUT objects error:", err.message)
    res.status(500).json({ error: "Objekt bearbeiten fehlgeschlagen: " + err.message })
  }
})

// --- NOTES ---

app.get("/api/notes", requireAuth, async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM notes ORDER BY timestamp DESC")
    res.json(r.rows.map(mapNote))
  } catch (err) {
    console.error("GET notes error:", err.message)
    res.status(500).json({ error: "Notizen laden fehlgeschlagen" })
  }
})

app.post("/api/notes", requireAuth, async (req, res) => {
  try {
    const n = req.body || {}
    const r = await pool.query(
      `INSERT INTO notes (id, process_id, process_number, user_id, user_name, text, timestamp, duration, rate_profile_id, assigned_user_id, resubmission_date, is_done)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [n.id || Math.random().toString(36).substr(2, 12), n.processId, n.processNumber, n.userId || req.user.id, n.userName || req.user.username, n.text || "", n.timestamp || new Date().toISOString(), n.duration ?? 0, n.rateProfileId, n.assignedUserId, n.resubmissionDate, n.isDone ?? false]
    )
    res.status(201).json(mapNote(r.rows[0]))
  } catch (err) {
    console.error("POST notes error:", err.message)
    res.status(500).json({ error: "Notiz erstellen fehlgeschlagen: " + err.message })
  }
})

app.put("/api/notes/:id", requireAuth, async (req, res) => {
  try {
    const n = req.body || {}
    const r = await pool.query(
      `UPDATE notes SET text=$1, duration=$2, rate_profile_id=$3, assigned_user_id=$4, resubmission_date=$5, is_done=$6, timestamp=$7 WHERE id=$8 RETURNING *`,
      [n.text, n.duration, n.rateProfileId, n.assignedUserId, n.resubmissionDate, n.isDone ?? false, n.timestamp || new Date().toISOString(), req.params.id]
    )
    if (r.rowCount === 0) return res.status(404).json({ error: "Notiz nicht gefunden" })
    res.json(mapNote(r.rows[0]))
  } catch (err) {
    console.error("PUT notes error:", err.message)
    res.status(500).json({ error: "Notiz bearbeiten fehlgeschlagen: " + err.message })
  }
})

app.delete("/api/notes/:id", requireAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM notes WHERE id = $1", [req.params.id])
    res.status(204).end()
  } catch (err) {
    console.error("DELETE notes error:", err.message)
    res.status(500).json({ error: "Notiz löschen fehlgeschlagen" })
  }
})

// --- Express catch-all error handler ---
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err)
  res.status(500).json({ error: "Interner Serverfehler: " + (err.message || "Unbekannt") })
})

// --- Start server with migrations ---
const port = Number(process.env.BACKEND_PORT || process.env.PORT || 3000)

async function start() {
  // Wait for DB to be ready (important for Docker startup order)
  for (let i = 0; i < 30; i++) {
    try {
      await pool.query("SELECT 1")
      break
    } catch (err) {
      console.log(`Waiting for database... (${i + 1}/30)`)
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  await runMigrations()

  app.listen(port, "0.0.0.0", () => {
    console.log(`API running on ${port}`)
  })
}

start().catch(err => {
  console.error("Failed to start server:", err)
  process.exit(1)
})
