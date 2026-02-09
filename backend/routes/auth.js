const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { pool } = require("../db")

const router = express.Router()

function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  )
}


router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body || {}

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "username und password sind erforderlich" })
    }

    const result = await pool.query(
      "SELECT id, username, role, password_hash FROM users WHERE username = $1",
      [String(username)]
    )

    const user = result.rows[0]
    if (!user) {
      return res.status(401).json({ error: "ungültige zugangsdaten" })
    }

    if (!user.password_hash) {
      return res.status(401).json({ error: "passwort nicht gesetzt" })
    }

    const ok = await bcrypt.compare(
      String(password),
      String(user.password_hash)
    )
    if (!ok) {
      return res.status(401).json({ error: "ungültige zugangsdaten" })
    }

    const token = signToken(user)
    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    })
  } catch (err) {
    return res.status(500).json({ error: "serverfehler" })
  }
})
module.exports = router
