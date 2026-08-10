import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import linkRoutes from "./routes/link.routes.js";
import redirectRoutes from "./routes/redirect.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", linkRoutes);

app.use("/", redirectRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    message: "Short Link Manager API is running"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});