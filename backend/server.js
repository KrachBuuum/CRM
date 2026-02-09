require("dotenv").config()

const express = require("express")
const cors = require("cors")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const { Pool } = require("pg")

const app = express()

app.use(cors({ origin: true }))
app.use(express.json())

const pool = new Pool({
  host: process.env.DB_HOST || "db",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "crm_admin",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "crm_production",
})

const JWT_SECRET = process.env.JWT_SECRET || "change_me"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

function requireAuth(req, res, next) {
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: "token fehlt" })
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ error: "token ungültig oder abgelaufen" })
  }
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true })
})

app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body || {}

  if (!username || !password) {
    return res.status(400).json({ error: "username und password sind erforderlich" })
  }

  const result = await pool.query(
    "SELECT id, username, role, password_hash, is_locked FROM users WHERE username = $1 LIMIT 1",
    [username]
  )

  if (result.rowCount === 0) {
    return res.status(401).json({ error: "ungültige zugangsdaten" })
  }

  const user = result.rows[0]

  if (user.is_locked) {
    return res.status(403).json({ error: "konto gesperrt" })
  }

  const ok = await bcrypt.compare(password, user.password_hash || "")
  if (!ok) {
    return res.status(401).json({ error: "ungültige zugangsdaten" })
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  })
})

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.user })
})

app.get("/api/users", requireAuth, async (req, res) => {
  const r = await pool.query(
    "SELECT id, name, username, role, cost_rate, rates, standard_rate_profile_id, is_locked FROM users ORDER BY username"
  )
  res.json(r.rows)
})

app.get("/api/contacts", requireAuth, async (req, res) => {
  const r = await pool.query("SELECT * FROM contacts ORDER BY id DESC")
  res.json(r.rows)
})

const jsonOrNull = (v) => v ? JSON.stringify(v) : null

app.post("/api/contacts", requireAuth, async (req, res) => {
  const c = req.body || {}
  const r = await pool.query(
    `INSERT INTO contacts (category, company_name, first_name, last_name, salutation, title,
     phone_mobile, phone_landline, email_business, email_private, uc_id, preferred_contact_way,
     address, billing_address_active, billing_address, second_person_active, second_person_data,
     internal_notes, website, industry, legal_form, ust_id, cooperation_status, conditions, region,
     company_contacts)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
     RETURNING *`,
    [
      c.category ?? null,
      c.company_name ?? null,
      c.first_name ?? null,
      c.last_name ?? null,
      c.salutation ?? null,
      c.title ?? null,
      c.phone_mobile ?? null,
      c.phone_landline ?? null,
      c.email_business ?? null,
      c.email_private ?? null,
      c.uc_id ?? null,
      c.preferred_contact_way ?? null,
      jsonOrNull(c.address),
      c.billing_address_active ?? false,
      jsonOrNull(c.billing_address),
      c.second_person_active ?? false,
      jsonOrNull(c.second_person_data),
      c.internal_notes ?? null,
      c.website ?? null,
      c.industry ?? null,
      c.legal_form ?? null,
      c.ust_id ?? null,
      c.cooperation_status ?? null,
      c.conditions ?? null,
      c.region ?? null,
      jsonOrNull(c.company_contacts) ?? '[]',
    ]
  )
  res.status(201).json(r.rows[0])
})

app.put("/api/contacts/:id", requireAuth, async (req, res) => {
  const c = req.body || {}
  const r = await pool.query(
    `UPDATE contacts SET category=$1, company_name=$2, first_name=$3, last_name=$4, salutation=$5, title=$6,
     phone_mobile=$7, phone_landline=$8, email_business=$9, email_private=$10, uc_id=$11, preferred_contact_way=$12,
     address=$13, billing_address_active=$14, billing_address=$15, second_person_active=$16, second_person_data=$17,
     internal_notes=$18, website=$19, industry=$20, legal_form=$21, ust_id=$22, cooperation_status=$23,
     conditions=$24, region=$25, company_contacts=$26
     WHERE id=$27 RETURNING *`,
    [
      c.category ?? null,
      c.company_name ?? null,
      c.first_name ?? null,
      c.last_name ?? null,
      c.salutation ?? null,
      c.title ?? null,
      c.phone_mobile ?? null,
      c.phone_landline ?? null,
      c.email_business ?? null,
      c.email_private ?? null,
      c.uc_id ?? null,
      c.preferred_contact_way ?? null,
      jsonOrNull(c.address),
      c.billing_address_active ?? false,
      jsonOrNull(c.billing_address),
      c.second_person_active ?? false,
      jsonOrNull(c.second_person_data),
      c.internal_notes ?? null,
      c.website ?? null,
      c.industry ?? null,
      c.legal_form ?? null,
      c.ust_id ?? null,
      c.cooperation_status ?? null,
      c.conditions ?? null,
      c.region ?? null,
      jsonOrNull(c.company_contacts) ?? '[]',
      req.params.id,
    ]
  )
  if (r.rowCount === 0) return res.status(404).json({ error: "Kontakt nicht gefunden" })
  res.json(r.rows[0])
})

app.delete("/api/contacts/:id", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM contacts WHERE id = $1", [req.params.id])
  res.status(204).end()
})

app.get("/api/processes", requireAuth, async (req, res) => {
  const r = await pool.query("SELECT * FROM processes ORDER BY id DESC")
  res.json(r.rows)
})

app.post("/api/processes", requireAuth, async (req, res) => {
  const p = req.body || {}
  const r = await pool.query(
    `INSERT INTO processes (process_number, type, customer_id, object_id, title, status)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [
      p.process_number ?? p.processNumber ?? null,
      p.type ?? null,
      p.customer_id ?? p.customerId ?? null,
      p.object_id ?? p.objectId ?? null,
      p.title ?? null,
      p.status ?? "Lead",
    ]
  )
  res.status(201).json(r.rows[0])
})

app.delete("/api/processes/:id", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM notes WHERE process_id = $1", [req.params.id])
  await pool.query("DELETE FROM processes WHERE id = $1", [req.params.id])
  res.status(204).end()
})

app.put("/api/processes/:id", requireAuth, async (req, res) => {
  const p = req.body || {}
  const r = await pool.query(
    `UPDATE processes SET process_number=$1, type=$2, customer_id=$3, object_id=$4, title=$5, status=$6
     WHERE id=$7 RETURNING *`,
    [
      p.process_number ?? p.processNumber ?? null,
      p.type ?? null,
      p.customer_id ?? p.customerId ?? null,
      p.object_id ?? p.objectId ?? null,
      p.title ?? null,
      p.status ?? null,
      req.params.id,
    ]
  )
  if (r.rowCount === 0) return res.status(404).json({ error: "Vorgang nicht gefunden" })
  res.json(r.rows[0])
})

app.get("/api/notes", requireAuth, async (req, res) => {
  const r = await pool.query("SELECT * FROM notes ORDER BY id DESC")
  res.json(r.rows)
})

app.post("/api/notes", requireAuth, async (req, res) => {
  const n = req.body || {}

  const r = await pool.query(
    "INSERT INTO notes (process_id, user_id, user_name, text, duration, rate_profile_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
    [
      n.process_id ?? n.processId ?? null,
      n.user_id ?? n.userId ?? req.user.id,
      n.user_name ?? n.userName ?? req.user.username,
      n.text ?? "",
      n.duration ?? null,
      n.rate_profile_id ?? n.rateProfileId ?? null,
    ]
  )

  res.status(201).json(r.rows[0])
})

app.delete("/api/notes/:id", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM notes WHERE id = $1", [req.params.id])
  res.status(204).end()
})

app.put("/api/users/:id", requireAuth, async (req, res) => {
  const u = req.body || {}
  const r = await pool.query(
    `UPDATE users SET name=$1, role=$2, cost_rate=$3, rates=$4, standard_rate_profile_id=$5, is_locked=$6
     WHERE id=$7 RETURNING id, name, username, role, cost_rate, rates, standard_rate_profile_id, is_locked`,
    [
      u.name ?? null,
      u.role ?? null,
      u.cost_rate ?? u.costRate ?? null,
      u.rates ? JSON.stringify(u.rates) : null,
      u.standard_rate_profile_id ?? u.standardRateProfileId ?? null,
      u.is_locked ?? u.isLocked ?? false,
      req.params.id,
    ]
  )
  if (r.rowCount === 0) return res.status(404).json({ error: "Benutzer nicht gefunden" })
  res.json(r.rows[0])
})

app.get("/api/objects", requireAuth, async (req, res) => {
  const r = await pool.query("SELECT * FROM objects ORDER BY id DESC")
  res.json(r.rows)
})

app.post("/api/objects", requireAuth, async (req, res) => {
  const o = req.body || {}
  const r = await pool.query(
    `INSERT INTO objects (display_name, object_type, build_year, units, address, owners, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [
      o.display_name ?? o.displayName ?? null,
      o.object_type ?? o.objectType ?? null,
      o.build_year ?? o.buildYear ?? null,
      o.units ?? null,
      o.address ? JSON.stringify(o.address) : null,
      o.owners ? JSON.stringify(o.owners) : null,
      o.notes ?? null,
    ]
  )
  res.status(201).json(r.rows[0])
})

app.put("/api/objects/:id", requireAuth, async (req, res) => {
  const o = req.body || {}
  const r = await pool.query(
    `UPDATE objects SET display_name=$1, object_type=$2, build_year=$3, units=$4, address=$5, owners=$6, notes=$7
     WHERE id=$8 RETURNING *`,
    [
      o.display_name ?? o.displayName ?? null,
      o.object_type ?? o.objectType ?? null,
      o.build_year ?? o.buildYear ?? null,
      o.units ?? null,
      o.address ? JSON.stringify(o.address) : null,
      o.owners ? JSON.stringify(o.owners) : null,
      o.notes ?? null,
      req.params.id,
    ]
  )
  if (r.rowCount === 0) return res.status(404).json({ error: "Objekt nicht gefunden" })
  res.json(r.rows[0])
})

const port = Number(process.env.BACKEND_PORT || process.env.PORT || 3000)
app.listen(port, "0.0.0.0", () => {
  console.log(`API running on ${port}`)
})

