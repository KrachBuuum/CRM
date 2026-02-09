const { Pool } = require("pg")

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL fehlt")
}

const pool = new Pool({
  connectionString,
})

module.exports = { pool }
