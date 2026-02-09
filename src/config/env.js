import dotenv from "dotenv";
dotenv.config();

export const config = {
  environment: process.env.ENVIRONMENT || "DEV",
  key: process.env.KEY_DEV,
  iv: process.env.IV,
  mockBackend: process.env.MOCK_BACKEND,
  backendUrl: process.env.BACKEND_URL,
  mode: (process.env.MODE || "REPLAY").toUpperCase(),
  port: process.env.PORT || 8080,
};
