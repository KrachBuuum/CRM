const jwt = require("jsonwebtoken")

function requireAuth(req, res, next) {
  const header = req.headers.authorization || ""
  const parts = header.split(" ")
  const type = parts[0]
  const token = parts[1]

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "nicht angemeldet" })
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload
    return next()
  } catch {
    return res.status(401).json({ error: "token ungültig oder abgelaufen" })
  }
}

module.exports = { requireAuth }
