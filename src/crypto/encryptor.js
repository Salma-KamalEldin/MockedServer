import crypto from "crypto";
import { config } from "../config/env.js";

export function decryptData(base64Data) {
  const key = Buffer.from(config.key, "base64");
  const iv = Buffer.from(config.iv, "base64");
  const encrypted = Buffer.from(base64Data, "base64");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return JSON.parse(decrypted.toString());
}

export function encryptData(json) {
  const key = Buffer.from(config.key, "base64");
  const iv = Buffer.from(config.iv, "base64");
  const text = JSON.stringify(json);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString("base64");
}
