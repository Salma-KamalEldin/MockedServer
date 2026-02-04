import express from "express";
import { config } from "./config/env.js";
import publicKeyRoute from "./routes/publicKey.route.js";
import { router as mockRouter } from "./routes/mock.js";

export const app = express();

app.use(express.json());
app.use(express.text({ type: "text/*" }));
app.use(express.raw({ type: "application/octet-stream" }));

app.get("/", (_, res) => {
  res.send(`✅ Smart Mock Gateway running on port ${config.port}`);
});

app.use(publicKeyRoute);
app.use("/", mockRouter);
