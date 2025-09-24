import mongoose from "mongoose";
import bcrypt from "bcryptjs";

let conn = null;
async function connectDB() {
  if (conn) return conn;
  conn = await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  return conn;
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  mobile: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ message: "Method not allowed" });

  try {
    await connectDB();
    const { name, email, mobile, password } = req.body;

    if (!name || (!email && !mobile) || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check for existing user (by email or mobile)
    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }],
    });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email: email || null,
      mobile: mobile || null,
      password: hashed,
    });

    return res.status(200).json({ message: "Signup successful!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
}
