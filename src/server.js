import express from "express";
import bodyParser from "body-parser";
import { config } from "./config/env.js";
import { router as mockRouter } from "./routes/mock.js";

const app = express();

// ✅ Add a health-check route BEFORE any middleware
app.get("/", (req, res) => {
  res.send("✅ Smart Mock Gateway is running and listening on port " + config.port);
});

// Parse text bodies (your encrypted payloads)
app.use(bodyParser.text({ type: "*/*" }));

// Route all other requests to your mock router
app.use("/", mockRouter);

app.listen(config.port, () => {
  console.log(`Smart Mock Gateway running on port ${config.port} mode=${config.mode}`);
});
