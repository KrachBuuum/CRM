require("dotenv").config()

const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const { Pool } = require("pg")

const app = express()

app.use(cors({ origin: true }))
app.use(express.json({ limit: "10mb" }))

const pool = new Pool({
  host: process.env.DB_HOST || "db",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "crm_admin",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "crm_production",
})

const JWT_SECRET = process.env.JWT_SECRET || "change_me"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

// ─── Migrations ──────────────────────────────────────────────────────────────
async function runMigrations() {
  console.log("[migrations] running...")

  await pool.query(`
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
    )
  `)

  await pool.query(`
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
    )
  `)

  await pool.query(`
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
    )
  `)

  await pool.query(`
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
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS objects (
      id SERIAL PRIMARY KEY,
      display_name TEXT,
      object_type TEXT,
      build_year TEXT,
      units INTEGER DEFAULT 0,
      address JSONB DEFAULT '{}',
      owners JSONB DEFAULT '[]',
      notes TEXT DEFAULT ''
    )
  `)

  // Add missing columns for existing databases
  const addCol = async (table, col, type) => {
    try {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${type}`)
    } catch (e) { /* column exists */ }
  }

  await addCol("users", "failed_attempts", "INTEGER DEFAULT 0")

  const contactCols = [
    ["salutation", "TEXT"], ["title", "TEXT"], ["uc_id", "TEXT"],
    ["email_private", "TEXT"], ["preferred_contact_way", "TEXT DEFAULT 'Email'"],
    ["billing_address_active", "BOOLEAN DEFAULT FALSE"], ["billing_address", "JSONB"],
    ["second_person_active", "BOOLEAN DEFAULT FALSE"], ["second_person_data", "JSONB"],
    ["company_contacts", "JSONB DEFAULT '[]'"], ["website", "TEXT"],
    ["industry", "TEXT"], ["legal_form", "TEXT"], ["ust_id", "TEXT"],
    ["cooperation_status", "TEXT"], ["conditions", "TEXT"], ["region", "TEXT"],
  ]
  for (const [col, type] of contactCols) {
    await addCol("contacts", col, type)
  }

  const procCols = [
    ["end_customer_id", "TEXT"], ["service_provider", "TEXT"], ["vs_number", "TEXT"],
    ["internal_notes", "TEXT DEFAULT ''"], ["storage_link", "TEXT DEFAULT ''"],
    ["invoices", "JSONB DEFAULT '[]'"],
  ]
  for (const [col, type] of procCols) {
    await addCol("processes", col, type)
  }

  const noteCols = [
    ["process_number", "TEXT"], ["assigned_user_id", "TEXT"],
    ["resubmission_date", "TEXT"], ["is_done", "BOOLEAN DEFAULT FALSE"],
  ]
  for (const [col, type] of noteCols) {
    await addCol("notes", col, type)
  }

  try { await pool.query("ALTER TABLE processes ALTER COLUMN customer_id TYPE TEXT") } catch (e) {}
  try { await pool.query("ALTER TABLE notes ALTER COLUMN process_id TYPE TEXT") } catch (e) {}

  // Ensure admin user exists with correct bcrypt hash
  const adminCheck = await pool.query("SELECT id FROM users WHERE username = 'admin'")
  if (adminCheck.rowCount === 0) {
    const hash = await bcrypt.hash("admin123", 10)
    await pool.query(
      `INSERT INTO users (id, name, username, role, cost_rate, rates, standard_rate_profile_id, password_hash)
       VALUES ('u1', 'System Administrator', 'admin', 'ADMIN', 85.00, '[{"roleName":"Sachverstaendiger","rate":150}]', 'Sachverstaendiger', $1)`,
      [hash]
    )
  }

  console.log("[migrations] done")
}

// ─── Mapper Functions ────────────────────────────────────────────────────────
function mapUser(row) {
  return {
    id: row.id,
    name: row.name || "",
    username: row.username || "",
    role: row.role || "STANDARD",
    costRate: Number(row.cost_rate) || 0,
    rates: row.rates || [],
    standardRateProfileId: row.standard_rate_profile_id || "",
    failedAttempts: Number(row.failed_attempts) || 0,
    isLocked: row.is_locked || false,
  }
}

function mapContact(row) {
  return {
    id: String(row.id),
    category: row.category || "Privatperson",
    companyName: row.company_name || "",
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    salutation: row.salutation || "",
    title: row.title || "",
    ucId: row.uc_id || "",
    phoneMobile: row.phone_mobile || "",
    phoneLandline: row.phone_landline || "",
    emailBusiness: row.email_business || "",
    emailPrivate: row.email_private || "",
    preferredContactWay: row.preferred_contact_way || "Email",
    address: row.address || { street: "", houseNumber: "", zip: "", city: "", country: "Deutschland" },
    billingAddressActive: row.billing_address_active || false,
    billingAddress: row.billing_address || null,
    secondPersonActive: row.second_person_active || false,
    secondPersonData: row.second_person_data || null,
    internalNotes: row.internal_notes || "",
    contacts: row.company_contacts || [],
    website: row.website || "",
    industry: row.industry || "",
    legalForm: row.legal_form || "",
    ustId: row.ust_id || "",
    cooperationStatus: row.cooperation_status || "",
    conditions: row.conditions || "",
    region: row.region || "",
  }
}

function mapProcess(row) {
  return {
    id: String(row.id),
    processNumber: row.process_number || "",
    type: row.type || "EB",
    customerId: String(row.customer_id || ""),
    endCustomerId: row.end_customer_id ? String(row.end_customer_id) : undefined,
    objectId: String(row.object_id || ""),
    title: row.title || "",
    status: row.status || "Lead",
    dateCreated: row.date_created ? new Date(row.date_created).toISOString() : new Date().toISOString(),
    serviceProvider: row.service_provider || undefined,
    vsNumber: row.vs_number || undefined,
    internalNotes: row.internal_notes || "",
    storageLink: row.storage_link || "",
    invoices: row.invoices || [],
  }
}

function mapNote(row) {
  return {
    id: String(row.id),
    processId: String(row.process_id || ""),
    processNumber: row.process_number || "",
    userId: row.user_id || "",
    userName: row.user_name || "",
    text: row.text || "",
    timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
    duration: Number(row.duration) || 0,
    rateProfileId: row.rate_profile_id || "",
    assignedUserId: row.assigned_user_id || undefined,
    resubmissionDate: row.resubmission_date || undefined,
    isDone: row.is_done || false,
  }
}

function mapObject(row) {
  return {
    id: String(row.id),
    displayName: row.display_name || "",
    objectType: row.object_type || "",
    buildYear: row.build_year || "",
    units: Number(row.units) || 0,
    address: row.address || { street: "", houseNumber: "", zip: "", city: "", country: "Deutschland" },
    owners: row.owners || [],
    notes: row.notes || "",
  }
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: "Token fehlt" })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ error: "Token ungueltig oder abgelaufen" })
  }
}

// ─── Health (checks DB too) ──────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1")
    res.json({ ok: true })
  } catch (err) {
    res.status(503).json({ ok: false, error: "DB nicht erreichbar" })
  }
})

// ─── Auth ────────────────────────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {}

    if (!username || !password) {
      return res.status(400).json({ error: "Username und Passwort erforderlich" })
    }

    const result = await pool.query(
      "SELECT id, name, username, role, password_hash, is_locked FROM users WHERE username = $1 LIMIT 1",
      [username]
    )

    if (result.rowCount === 0) {
      return res.status(401).json({ error: "Ungueltige Zugangsdaten" })
    }

    const user = result.rows[0]

    if (user.is_locked) {
      return res.status(403).json({ error: "Konto gesperrt" })
    }

    const ok = await bcrypt.compare(password, user.password_hash || "")
    if (!ok) {
      return res.status(401).json({ error: "Ungueltige Zugangsdaten" })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    res.json({
      token,
      user: { id: user.id, name: user.name, username: user.username, role: user.role },
    })
  } catch (err) {
    console.error("[login]", err)
    res.status(500).json({ error: "Serverfehler" })
  }
})

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.user })
})

// ─── Users CRUD ──────────────────────────────────────────────────────────────
app.get("/api/users", requireAuth, async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM users ORDER BY username")
    res.json(r.rows.map(mapUser))
  } catch (err) {
    console.error("[GET users]", err)
    res.status(500).json({ error: "Fehler beim Laden der Benutzer" })
  }
})

app.post("/api/users", requireAuth, async (req, res) => {
  try {
    const u = req.body
    const hash = u.password ? await bcrypt.hash(u.password, 10) : null
    const id = u.id || "u" + Date.now()
    const r = await pool.query(
      `INSERT INTO users (id, name, username, role, cost_rate, rates, standard_rate_profile_id, password_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id, u.name || "", u.username, u.role || "STANDARD", u.costRate || 0,
       JSON.stringify(u.rates || []), u.standardRateProfileId || "", hash]
    )
    res.status(201).json(mapUser(r.rows[0]))
  } catch (err) {
    console.error("[POST users]", err)
    res.status(500).json({ error: "Fehler beim Erstellen des Benutzers" })
  }
})

app.put("/api/users/:id", requireAuth, async (req, res) => {
  try {
    const u = req.body
    let query, params
    if (u.password) {
      const hash = await bcrypt.hash(u.password, 10)
      query = `UPDATE users SET name=$1, username=$2, role=$3, cost_rate=$4, rates=$5, standard_rate_profile_id=$6, password_hash=$7, is_locked=$8 WHERE id=$9 RETURNING *`
      params = [u.name, u.username, u.role, u.costRate || 0, JSON.stringify(u.rates || []), u.standardRateProfileId || "", hash, u.isLocked || false, req.params.id]
    } else {
      query = `UPDATE users SET name=$1, username=$2, role=$3, cost_rate=$4, rates=$5, standard_rate_profile_id=$6, is_locked=$7 WHERE id=$8 RETURNING *`
      params = [u.name, u.username, u.role, u.costRate || 0, JSON.stringify(u.rates || []), u.standardRateProfileId || "", u.isLocked || false, req.params.id]
    }
    const r = await pool.query(query, params)
    if (r.rowCount === 0) return res.status(404).json({ error: "Benutzer nicht gefunden" })
    res.json(mapUser(r.rows[0]))
  } catch (err) {
    console.error("[PUT users]", err)
    res.status(500).json({ error: "Fehler beim Aktualisieren des Benutzers" })
  }
})

app.delete("/api/users/:id", requireAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id])
    res.status(204).end()
  } catch (err) {
    console.error("[DELETE users]", err)
    res.status(500).json({ error: "Fehler beim Loeschen des Benutzers" })
  }
})

// ─── Contacts CRUD ───────────────────────────────────────────────────────────
app.get("/api/contacts", requireAuth, async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM contacts ORDER BY id DESC")
    res.json(r.rows.map(mapContact))
  } catch (err) {
    console.error("[GET contacts]", err)
    res.status(500).json({ error: "Fehler beim Laden der Kontakte" })
  }
})

app.post("/api/contacts", requireAuth, async (req, res) => {
  try {
    const c = req.body
    const r = await pool.query(
      `INSERT INTO contacts (category, company_name, first_name, last_name, salutation, title, uc_id,
        phone_mobile, phone_landline, email_business, email_private, preferred_contact_way,
        address, billing_address_active, billing_address, second_person_active, second_person_data,
        internal_notes, company_contacts, website, industry, legal_form, ust_id, cooperation_status, conditions, region)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
       RETURNING *`,
      [
        c.category || "Privatperson", c.companyName || c.company_name || "",
        c.firstName || c.first_name || "", c.lastName || c.last_name || "",
        c.salutation || "", c.title || "", c.ucId || c.uc_id || "",
        c.phoneMobile || c.phone_mobile || "", c.phoneLandline || c.phone_landline || "",
        c.emailBusiness || c.email_business || "", c.emailPrivate || c.email_private || "",
        c.preferredContactWay || c.preferred_contact_way || "Email",
        JSON.stringify(c.address || {}), c.billingAddressActive || c.billing_address_active || false,
        c.billingAddress || c.billing_address ? JSON.stringify(c.billingAddress || c.billing_address) : null,
        c.secondPersonActive || c.second_person_active || false,
        c.secondPersonData || c.second_person_data ? JSON.stringify(c.secondPersonData || c.second_person_data) : null,
        c.internalNotes || c.internal_notes || "",
        JSON.stringify(c.contacts || c.company_contacts || []),
        c.website || "", c.industry || "", c.legalForm || c.legal_form || "",
        c.ustId || c.ust_id || "", c.cooperationStatus || c.cooperation_status || "",
        c.conditions || "", c.region || "",
      ]
    )
    res.status(201).json(mapContact(r.rows[0]))
  } catch (err) {
    console.error("[POST contacts]", err)
    res.status(500).json({ error: "Fehler beim Erstellen des Kontakts: " + err.message })
  }
})

app.put("/api/contacts/:id", requireAuth, async (req, res) => {
  try {
    const c = req.body
    const r = await pool.query(
      `UPDATE contacts SET category=$1, company_name=$2, first_name=$3, last_name=$4,
        salutation=$5, title=$6, uc_id=$7, phone_mobile=$8, phone_landline=$9,
        email_business=$10, email_private=$11, preferred_contact_way=$12,
        address=$13, billing_address_active=$14, billing_address=$15,
        second_person_active=$16, second_person_data=$17, internal_notes=$18,
        company_contacts=$19, website=$20, industry=$21, legal_form=$22,
        ust_id=$23, cooperation_status=$24, conditions=$25, region=$26
       WHERE id=$27 RETURNING *`,
      [
        c.category || "Privatperson", c.companyName || c.company_name || "",
        c.firstName || c.first_name || "", c.lastName || c.last_name || "",
        c.salutation || "", c.title || "", c.ucId || c.uc_id || "",
        c.phoneMobile || c.phone_mobile || "", c.phoneLandline || c.phone_landline || "",
        c.emailBusiness || c.email_business || "", c.emailPrivate || c.email_private || "",
        c.preferredContactWay || c.preferred_contact_way || "Email",
        JSON.stringify(c.address || {}), c.billingAddressActive || c.billing_address_active || false,
        c.billingAddress || c.billing_address ? JSON.stringify(c.billingAddress || c.billing_address) : null,
        c.secondPersonActive || c.second_person_active || false,
        c.secondPersonData || c.second_person_data ? JSON.stringify(c.secondPersonData || c.second_person_data) : null,
        c.internalNotes || c.internal_notes || "",
        JSON.stringify(c.contacts || c.company_contacts || []),
        c.website || "", c.industry || "", c.legalForm || c.legal_form || "",
        c.ustId || c.ust_id || "", c.cooperationStatus || c.cooperation_status || "",
        c.conditions || "", c.region || "",
        req.params.id,
      ]
    )
    if (r.rowCount === 0) return res.status(404).json({ error: "Kontakt nicht gefunden" })
    res.json(mapContact(r.rows[0]))
  } catch (err) {
    console.error("[PUT contacts]", err)
    res.status(500).json({ error: "Fehler beim Aktualisieren des Kontakts: " + err.message })
  }
})

app.delete("/api/contacts/:id", requireAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM contacts WHERE id = $1", [req.params.id])
    res.status(204).end()
  } catch (err) {
    console.error("[DELETE contacts]", err)
    res.status(500).json({ error: "Fehler beim Loeschen des Kontakts" })
  }
})

// ─── Processes CRUD ──────────────────────────────────────────────────────────
app.get("/api/processes", requireAuth, async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM processes ORDER BY id DESC")
    res.json(r.rows.map(mapProcess))
  } catch (err) {
    console.error("[GET processes]", err)
    res.status(500).json({ error: "Fehler beim Laden der Vorgaenge" })
  }
})

app.post("/api/processes", requireAuth, async (req, res) => {
  try {
    const p = req.body
    const r = await pool.query(
      `INSERT INTO processes (process_number, type, customer_id, end_customer_id, object_id, title, status, service_provider, vs_number, internal_notes, storage_link, invoices)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [
        p.processNumber || p.process_number || "",
        p.type || "EB", p.customerId || p.customer_id || "",
        p.endCustomerId || p.end_customer_id || null,
        p.objectId || p.object_id || "",
        p.title || "", p.status || "Lead",
        p.serviceProvider || p.service_provider || null,
        p.vsNumber || p.vs_number || null,
        p.internalNotes || p.internal_notes || "",
        p.storageLink || p.storage_link || "",
        JSON.stringify(p.invoices || []),
      ]
    )
    res.status(201).json(mapProcess(r.rows[0]))
  } catch (err) {
    console.error("[POST processes]", err)
    res.status(500).json({ error: "Fehler beim Erstellen des Vorgangs: " + err.message })
  }
})

app.put("/api/processes/:id", requireAuth, async (req, res) => {
  try {
    const p = req.body
    const r = await pool.query(
      `UPDATE processes SET process_number=$1, type=$2, customer_id=$3, end_customer_id=$4, object_id=$5,
        title=$6, status=$7, service_provider=$8, vs_number=$9, internal_notes=$10, storage_link=$11, invoices=$12
       WHERE id=$13 RETURNING *`,
      [
        p.processNumber || p.process_number || "",
        p.type || "EB", p.customerId || p.customer_id || "",
        p.endCustomerId || p.end_customer_id || null,
        p.objectId || p.object_id || "",
        p.title || "", p.status || "Lead",
        p.serviceProvider || p.service_provider || null,
        p.vsNumber || p.vs_number || null,
        p.internalNotes || p.internal_notes || "",
        p.storageLink || p.storage_link || "",
        JSON.stringify(p.invoices || []),
        req.params.id,
      ]
    )
    if (r.rowCount === 0) return res.status(404).json({ error: "Vorgang nicht gefunden" })
    res.json(mapProcess(r.rows[0]))
  } catch (err) {
    console.error("[PUT processes]", err)
    res.status(500).json({ error: "Fehler beim Aktualisieren des Vorgangs: " + err.message })
  }
})

app.delete("/api/processes/:id", requireAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM notes WHERE process_id = $1", [req.params.id])
    await pool.query("DELETE FROM processes WHERE id = $1", [req.params.id])
    res.status(204).end()
  } catch (err) {
    console.error("[DELETE processes]", err)
    res.status(500).json({ error: "Fehler beim Loeschen des Vorgangs" })
  }
})

// ─── Objects CRUD ────────────────────────────────────────────────────────────
app.get("/api/objects", requireAuth, async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM objects ORDER BY id DESC")
    res.json(r.rows.map(mapObject))
  } catch (err) {
    console.error("[GET objects]", err)
    res.status(500).json({ error: "Fehler beim Laden der Objekte" })
  }
})

app.post("/api/objects", requireAuth, async (req, res) => {
  try {
    const o = req.body
    const r = await pool.query(
      `INSERT INTO objects (display_name, object_type, build_year, units, address, owners, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        o.displayName || o.display_name || "",
        o.objectType || o.object_type || "",
        o.buildYear || o.build_year || "",
        o.units || 0,
        JSON.stringify(o.address || {}),
        JSON.stringify(o.owners || []),
        o.notes || "",
      ]
    )
    res.status(201).json(mapObject(r.rows[0]))
  } catch (err) {
    console.error("[POST objects]", err)
    res.status(500).json({ error: "Fehler beim Erstellen des Objekts: " + err.message })
  }
})

app.put("/api/objects/:id", requireAuth, async (req, res) => {
  try {
    const o = req.body
    const r = await pool.query(
      `UPDATE objects SET display_name=$1, object_type=$2, build_year=$3, units=$4, address=$5, owners=$6, notes=$7
       WHERE id=$8 RETURNING *`,
      [
        o.displayName || o.display_name || "",
        o.objectType || o.object_type || "",
        o.buildYear || o.build_year || "",
        o.units || 0,
        JSON.stringify(o.address || {}),
        JSON.stringify(o.owners || []),
        o.notes || "",
        req.params.id,
      ]
    )
    if (r.rowCount === 0) return res.status(404).json({ error: "Objekt nicht gefunden" })
    res.json(mapObject(r.rows[0]))
  } catch (err) {
    console.error("[PUT objects]", err)
    res.status(500).json({ error: "Fehler beim Aktualisieren des Objekts: " + err.message })
  }
})

// ─── Notes CRUD ──────────────────────────────────────────────────────────────
app.get("/api/notes", requireAuth, async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM notes ORDER BY id DESC")
    res.json(r.rows.map(mapNote))
  } catch (err) {
    console.error("[GET notes]", err)
    res.status(500).json({ error: "Fehler beim Laden der Notizen" })
  }
})

app.post("/api/notes", requireAuth, async (req, res) => {
  try {
    const n = req.body
    const ts = n.timestamp || new Date().toISOString()
    const r = await pool.query(
      `INSERT INTO notes (process_id, process_number, user_id, user_name, text, timestamp, duration, rate_profile_id, assigned_user_id, resubmission_date, is_done)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [
        n.processId || n.process_id || null,
        n.processNumber || n.process_number || "",
        n.userId || n.user_id || req.user.id,
        n.userName || n.user_name || req.user.username,
        n.text || "",
        ts,
        n.duration || 0,
        n.rateProfileId || n.rate_profile_id || "",
        n.assignedUserId || n.assigned_user_id || null,
        n.resubmissionDate || n.resubmission_date || null,
        n.isDone || n.is_done || false,
      ]
    )
    res.status(201).json(mapNote(r.rows[0]))
  } catch (err) {
    console.error("[POST notes]", err)
    res.status(500).json({ error: "Fehler beim Erstellen der Notiz: " + err.message })
  }
})

app.put("/api/notes/:id", requireAuth, async (req, res) => {
  try {
    const n = req.body
    const r = await pool.query(
      `UPDATE notes SET text=$1, duration=$2, rate_profile_id=$3, assigned_user_id=$4, resubmission_date=$5, is_done=$6, timestamp=$7
       WHERE id=$8 RETURNING *`,
      [
        n.text || "", n.duration || 0,
        n.rateProfileId || n.rate_profile_id || "",
        n.assignedUserId || n.assigned_user_id || null,
        n.resubmissionDate || n.resubmission_date || null,
        n.isDone || n.is_done || false,
        n.timestamp || new Date().toISOString(),
        req.params.id,
      ]
    )
    if (r.rowCount === 0) return res.status(404).json({ error: "Notiz nicht gefunden" })
    res.json(mapNote(r.rows[0]))
  } catch (err) {
    console.error("[PUT notes]", err)
    res.status(500).json({ error: "Fehler beim Aktualisieren der Notiz" })
  }
})

app.delete("/api/notes/:id", requireAuth, async (req, res) => {
  try {
    await pool.query("DELETE FROM notes WHERE id = $1", [req.params.id])
    res.status(204).end()
  } catch (err) {
    console.error("[DELETE notes]", err)
    res.status(500).json({ error: "Fehler beim Loeschen der Notiz" })
  }
})

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[unhandled]", err)
  res.status(500).json({ error: "Interner Serverfehler" })
})

// ─── Start with DB retry ────────────────────────────────────────────────────
async function start() {
  const maxRetries = 10
  for (let i = 0; i < maxRetries; i++) {
    try {
      await pool.query("SELECT 1")
      console.log("[db] connected")
      break
    } catch (err) {
      console.log(`[db] waiting for database... (${i + 1}/${maxRetries})`)
      if (i === maxRetries - 1) {
        console.error("[db] could not connect after retries")
        process.exit(1)
      }
      await new Promise(r => setTimeout(r, 3000))
    }
  }

  await runMigrations()

  const port = Number(process.env.BACKEND_PORT || process.env.PORT || 3000)
  app.listen(port, "0.0.0.0", () => {
    console.log(`[server] API running on port ${port}`)
  })
}

start().catch(err => {
  console.error("[start] fatal:", err)
  process.exit(1)
})
