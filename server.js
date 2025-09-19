const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5500;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ Connect to MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",         // 👉 replace with your MySQL username
  password: "mihir2006", // 👉 replace with your MySQL password
  database: "sahayata_db"
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL database");
  }
});

// =============================
// 📌 SIGNUP API
// =============================
app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
  db.query(sql, [name, email, hashedPassword], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Email already exists" });
      }
      return res.status(500).json({ message: "Database error", error: err });
    }
    res.json({ message: "Signup successful!" });
  });
});

// =============================
// 📌 LOGIN API
// =============================
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    if (results.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const user = results[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({ message: "Login successful", user: { id: user.id, name: user.name, email: user.email } });
  });
});

// =============================
// 📌 Start Server
// =============================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:5500`);
});
app.post("/signup", async (req, res) => {
  const { name, email, mobile, password } = req.body;

  if (!name || !password || (!email && !mobile)) {
    return res.status(400).json({ message: "Name, password and either email or mobile are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = "INSERT INTO users (name, email, mobile, password) VALUES (?, ?, ?, ?)";
  db.query(sql, [name, email, mobile, hashedPassword], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "Email or mobile already exists" });
      }
      return res.status(500).json({ message: "Database error", error: err });
    }
    res.json({ message: "Signup successful!" });
  });
});