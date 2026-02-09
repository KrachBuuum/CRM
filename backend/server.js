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

app.post("/api/contacts", requireAuth, async (req, res) => {
  const c = req.body || {}
  const r = await pool.query(
    `INSERT INTO contacts (category, company_name, first_name, last_name, phone_mobile, phone_landline, email_business, address, internal_notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [
      c.category ?? null,
      c.company_name ?? c.companyName ?? null,
      c.first_name ?? c.firstName ?? null,
      c.last_name ?? c.lastName ?? null,
      c.phone_mobile ?? c.phoneMobile ?? null,
      c.phone_landline ?? c.phoneLandline ?? null,
      c.email_business ?? c.emailBusiness ?? null,
      c.address ? JSON.stringify(c.address) : null,
      c.internal_notes ?? c.internalNotes ?? null,
    ]
  )
  res.status(201).json(r.rows[0])
})

app.put("/api/contacts/:id", requireAuth, async (req, res) => {
  const c = req.body || {}
  const r = await pool.query(
    `UPDATE contacts SET category=$1, company_name=$2, first_name=$3, last_name=$4,
     phone_mobile=$5, phone_landline=$6, email_business=$7, address=$8, internal_notes=$9
     WHERE id=$10 RETURNING *`,
    [
      c.category ?? null,
      c.company_name ?? c.companyName ?? null,
      c.first_name ?? c.firstName ?? null,
      c.last_name ?? c.lastName ?? null,
      c.phone_mobile ?? c.phoneMobile ?? null,
      c.phone_landline ?? c.phoneLandline ?? null,
      c.email_business ?? c.emailBusiness ?? null,
      c.address ? JSON.stringify(c.address) : null,
      c.internal_notes ?? c.internalNotes ?? null,
      req.params.id,
    ]
  )
  if (r.rowCount === 0) return res.status(404).json({ error: "Kontakt nicht gefunden" })
  res.json(r.rows[0])
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

