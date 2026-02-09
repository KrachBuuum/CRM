const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { pool } = require("../db")

const router = express.Router()

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  )
}

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ error: "email und password sind erforderlich" })
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: "password muss mindestens 8 zeichen haben" })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const result = await pool.query(
      "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role",
      [String(email).toLowerCase(), passwordHash]
    )

    const user = result.rows[0]
    const token = signToken(user)

    return res.status(201).json({ token, user })
  } catch (err) {
    const msg = String(err?.message || "")
    if (msg.includes("duplicate") || msg.includes("unique")) {
      return res.status(409).json({ error: "email ist bereits registriert" })
    }
    return res.status(500).json({ error: "serverfehler" })
  }
})

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ error: "email und password sind erforderlich" })
    }

    const result = await pool.query(
      "SELECT id, email, role, password_hash FROM users WHERE email = $1",
      [String(email).toLowerCase()]
    )

    const user = result.rows[0]
    if (!user) {
      return res.status(401).json({ error: "ungültige zugangsdaten" })
    }

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      return res.status(401).json({ error: "ungültige zugangsdaten" })
    }

    const token = signToken(user)
    return res.json({ token, user: { id: user.id, email: user.email, role: user.role } })
  } catch {
    return res.status(500).json({ error: "serverfehler" })
  }
})

module.exports = router
