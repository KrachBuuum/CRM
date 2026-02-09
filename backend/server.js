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

app.get("/api/processes", requireAuth, async (req, res) => {
  const r = await pool.query("SELECT * FROM processes ORDER BY id DESC")
  res.json(r.rows)
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
      n.process_id ?? null,
      n.user_id ?? req.user.id,
      n.user_name ?? req.user.username,
      n.text ?? "",
      n.duration ?? null,
      n.rate_profile_id ?? null,
    ]
  )

  res.status(201).json(r.rows[0])
})

app.delete("/api/notes/:id", requireAuth, async (req, res) => {
  await pool.query("DELETE FROM notes WHERE id = $1", [req.params.id])
  res.status(204).end()
})

app.get("/api/objects", requireAuth, async (req, res) => {
  res.json([])
})

const port = Number(process.env.BACKEND_PORT || process.env.PORT || 3000)
app.listen(port, "0.0.0.0", () => {
  console.log(`API running on ${port}`)
})

