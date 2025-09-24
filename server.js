import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
const PORT = 5500;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB Atlas
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  mobile: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
});

// ✅ User Model
const User = mongoose.model("User", userSchema);

// ================= SIGNUP =================
app.post("/signup", async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !password || (!email && !mobile)) {
      return res.status(400).json({
        message: "Name, password and either Email or Mobile are required.",
      });
    }

    // Check if user exists (by email or mobile)
    let existingUser = null;
    if (email) existingUser = await User.findOne({ email });
    if (!existingUser && mobile) existingUser = await User.findOne({ mobile });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists!" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: email || null,
      mobile: mobile || null,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "✅ Signup successful!" });
  } catch (err) {
    console.error("❌ Error in signup:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= LOGIN =================
app.post("/login", async (req, res) => {
  try {
    const { email, mobile, password } = req.body;

    if ((!email && !mobile) || !password) {
      return res.status(400).json({ message: "Email/Mobile and password are required." });
    }

    // Find user either by email or mobile
    const user = email
      ? await User.findOne({ email })
      : await User.findOne({ mobile });

    if (!user) {
      return res.status(400).json({ message: "Invalid email/mobile or password" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email/mobile or password" });
    }

    res.json({ message: "✅ Login successful" });
  } catch (err) {
    console.error("❌ Error in login:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
