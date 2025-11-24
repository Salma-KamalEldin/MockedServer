import fs from "fs";
import path from "path";

export function saveRecording(endpoint, requestBody, responseBody) {
  const safe = endpoint.replace(/^\//, "").replace(/\//g, "_") || "root";
  const dir = path.join("recordings");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${safe}.json`);
  const record = { endpoint, request: requestBody, response: responseBody, recordedAt: new Date().toISOString() };
  fs.writeFileSync(file, JSON.stringify(record, null, 2));
  return file;
}

export function loadRecording(endpoint) {
  const safe = endpoint.replace(/^\//, "").replace(/\//g, "_") || "root";
  const file = path.join("recordings", `${safe}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
