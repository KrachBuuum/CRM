const express = require("express");
const { Pool } = require("pg");

const app = express();
app.use(express.json());

// --------------------
// API: Health Check
// --------------------
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// --------------------
// PostgreSQL Pool
// --------------------
const pool = new Pool({
  host: process.env.DB_HOST || "db",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "crm_admin",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "crm_production",
});

// --------------------
// API: DB Test
// --------------------
app.get("/api/db-test", async (req, res) => {
  try {
    const r = await pool.query("SELECT NOW() AS now");
    res.json({
      ok: true,
      db_time: r.rows[0].now,
    });
  } catch (e) {
    res.status(500).json({
      ok: false,
      error: String(e.message || e),
    });
  }
});

// --------------------
// Server Start
// --------------------
const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`API running on ${port}`);
});
