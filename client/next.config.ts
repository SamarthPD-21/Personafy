import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

let backendApi = "http://localhost:5000";
try {
  const envPath = path.resolve(process.cwd(), "../.env");
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, "utf-8");
    const match = envFile.match(/NEXT_BACKEND_API=(.*)/);
    if (match) {
      backendApi = match[1].trim().replace(/^"|"$/g, "").replace(/^'|'$/g, "");
    }
  }
} catch (e) {
  // Ignore errors
}

const nextConfig: NextConfig = {
  env: {
    NEXT_BACKEND_API: process.env.NEXT_BACKEND_API || backendApi,
  },
};

export default nextConfig;
