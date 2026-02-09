require("dotenv").config()

const cors = require("cors")
app.use(cors({ origin: true }))
app.use(express.json())

const authRoutes = require("./routes/auth")
app.use("/api/auth", authRoutes)

const { requireAuth } = require("./middleware/requireAuth")
app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.user })
})
