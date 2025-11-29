const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const DEFAULT_MONGO_URI = "mongodb://127.0.0.1:27017/fundtracker";

const app = express();

// -------------------------------------------
// CORS CONFIG (Netlify + Localhost)
// -------------------------------------------
app.use(
  cors({
    origin: [
      "https://stalwart-profiterole-2fea66.netlify.app", // Your Netlify frontend
      "http://localhost:3000" // Local development
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(express.json());

// -------------------------------------------
// Static Uploads
// -------------------------------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// -------------------------------------------
// API ROUTES
// -------------------------------------------
app.use("/api/fund", require("./routes/fund"));
app.use("/api/transactions", require("./routes/transactionRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/utilization", require("./routes/utilizationRoutes"));
app.use("/api/public", require("./routes/publicRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));

// -------------------------------------------
// MongoDB NORMALIZED CONNECTION
// -------------------------------------------
mongoose.set("strictQuery", true);

const normalizeMongoUri = (rawUri) => {
  const fallback = DEFAULT_MONGO_URI;

  if (!rawUri || !rawUri.trim()) {
    console.warn("⚠️ Missing MONGO_URI → Using local MongoDB.");
    return fallback;
  }

  let value = rawUri.trim();

  // If user enters only DB name (example: fundtracker)
  if (!value.startsWith("mongodb://") && !value.startsWith("mongodb+srv://")) {
    const dbName = value.replace(/^\/+/, "") || "fundtracker";
    return `mongodb://127.0.0.1:27017/${dbName}`;
  }

  try {
    const parsed = new URL(value);
    if (!parsed.pathname || parsed.pathname === "/") {
      parsed.pathname = "/fundtracker";
    }
    return parsed.toString();
  } catch (err) {
    console.warn("⚠️ Invalid MONGO_URI → Using local MongoDB.");
    return fallback;
  }
};

const mongoUri = normalizeMongoUri(process.env.MONGO_URI);

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    console.log("📊 Database:", mongoose.connection.db.databaseName);
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
  });

// -------------------------------------------
// REMOVE FRONTEND SERVING (Netlify handles it)
// -------------------------------------------
app.get("/", (req, res) => {
  res.send("Backend API Running Successfully 🚀");
});

// -------------------------------------------
// 404 Handler (REPLACES app.get('*'))
// -------------------------------------------
app.use((req, res) => {
  res.status(404).json({ message: "API Route Not Found" });
});

// -------------------------------------------
// START SERVER
// -------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
