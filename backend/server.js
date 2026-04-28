import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import chatRouter from "./routes/chat.js";

// Prefer a .env in the repo root (one level up) if present; fall back to backend/.env
const rootEnv = path.resolve(process.cwd(), "..", ".env");
dotenv.config({ path: rootEnv, override: false });

const app = express();
app.use(cors());
app.use(express.json());

app.use("/chat", chatRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
