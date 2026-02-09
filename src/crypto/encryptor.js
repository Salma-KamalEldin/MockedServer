import { getIv, getSharedKey } from "../services/sharedKeyStore.js";
import crypto from "crypto";
import { config } from "../config/env.js";

export function decryptRequest(req, res, next) {
  if (config.environment === "DEV" || config.environment === "BE") {
    next();
    return;
  }

  const key = getSharedKey();
  if (!key) {
    console.error("\n ❌ Secure channel not initialized - no shared key found");
    return res.status(400).send("Secure channel not initialized");
  }

  // Skip GET or non-encrypted
  if (req.method === "GET" || !req.body) {
    return next();
  }

  try {
    const iv = Buffer.from(req.headers["x-sec-h1"], "base64");
    const encrypted = Buffer.from(req.body.toString(), "base64");

    const authTag = encrypted.slice(encrypted.length - 16);
    const ciphertext = encrypted.slice(0, encrypted.length - 16);

    const decipher = crypto.createDecipheriv("aes-128-gcm", key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);

    req.decryptedBody = JSON.parse(decrypted.toString("utf8"));
    next();
  } catch (e) {
    console.error("\n ❌ Decryption for the client request failed:", e.message);
    res.status(400).send("Could not decrypt request body");
  }
}

export function sendEncrypted(res, payload, iv) {
  const key = getSharedKey();

  const cipher = crypto.createCipheriv("aes-128-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();
  const finalPayload = Buffer.concat([encrypted, authTag]);

  res.setHeader(
    "Content-Type",
    "application/vnd.mpesa.secure-v1+octet-stream;charset=UTF-8"
  );
  res.send(finalPayload);
}


export function encryptRequest(payload) {
  const key = getSharedKey();
  const iv = config.iv;  // ? Buffer.from(config.iv, "base64") : crypto.randomBytes(12);
  console.log("IV used for encryption:", iv);

  const cipher = crypto.createCipheriv("aes-128-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();
  const finalPayload = Buffer.concat([encrypted, authTag]);

  return finalPayload;
}

export function decryptResponse(res) {
  const sharedSecretBase64 = getSharedKey();
  console.log("Shared Secret", sharedSecretBase64);
  const key = Buffer.from(sharedSecretBase64, 'base64');
  
  // 1. Try to get IV from Response Header first!
  const iv = Buffer.from(getIv(), 'base64');
  console.log("IV", getIv());
  
  try {
      // const body = res.data;
      // if (typeof body !== 'string') throw new Error("Body is not a string");
      
      // const encrypted = Buffer.from(body, "binary");
      const encrypted = res.data;

      // Standard: Tag is the last 16 bytes
      const tag = encrypted.subarray(encrypted.length - 16);
      const ciphertext = encrypted.subarray(0, encrypted.length - 16);

      console.log("Key Length:", key.length);
      console.log("IV (Hex):", iv.toString('hex'));
      console.log("Tag (Hex):", tag.toString('hex'));

      const decipher = crypto.createDecipheriv("aes-128-gcm", key, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([
          decipher.update(ciphertext),
          decipher.final()
      ]);

      res.data = JSON.parse(decrypted.toString("utf8"))
      console.log("Decrypted Response:", res.data);
      return res;
  } catch (e) {
      // If it fails, log the values so we can compare with iOS logs
      console.error("Error Details:", e.message);
      throw e;
  }
}