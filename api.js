import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// ⚡ Keep connection cached to avoid reconnecting on every function call
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
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.models.User || mongoose.model("User", userSchema);

export async function handler(event, context) {
  await connectDB();

  const path = event.path.replace("/.netlify/functions/api", "");
  const method = event.httpMethod;
  const body = event.body ? JSON.parse(event.body) : {};

  // ----- SIGNUP -----
  if (path === "/signup" && method === "POST") {
    try {
      const { email, password } = body;
      const existing = await User.findOne({ email });
      if (existing)
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "User already exists" }),
        };

      const hashed = await bcrypt.hash(password, 10);
      await User.create({ email, password: hashed });
      return { statusCode: 200, body: JSON.stringify({ message: "Signup successful" }) };
    } catch (err) {
      console.error(err);
      return { statusCode: 500, body: JSON.stringify({ message: "Server error" }) };
    }
  }

  // ----- LOGIN -----
  if (path === "/login" && method === "POST") {
    try {
      const { email, password } = body;
      const user = await User.findOne({ email });
      if (!user)
        return { statusCode: 400, body: JSON.stringify({ message: "User not found" }) };

      const match = await bcrypt.compare(password, user.password);
      if (!match)
        return { statusCode: 401, body: JSON.stringify({ message: "Invalid password" }) };

      return { statusCode: 200, body: JSON.stringify({ message: "Login successful" }) };
    } catch (err) {
      console.error(err);
      return { statusCode: 500, body: JSON.stringify({ message: "Server error" }) };
    }
  }

  // Default for unknown routes
  return { statusCode: 404, body: JSON.stringify({ message: "Not found" }) };
}
