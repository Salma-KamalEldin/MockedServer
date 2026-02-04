import express from "express";
import { decryptRequest, sendEncrypted } from "../crypto/encryptor.js";
import { handleMock } from "../middleware/recorder.js";
import { config } from "../config/env.js";

export const router = express.Router();

router.use(decryptRequest);

router.use(async (req, res) => {
  const endpoint = req.path;

  if (config.environment === "DEV") {
    console.log("\n ➡️  DEV mode detected - skipping Secure Channel");
    const response = await handleMock(req.method, endpoint, req.body);
    res.setHeader(
      "Content-Type",
      "application/vnd.mpesa.secure-v1+octet-stream;charset=UTF-8"
    );
    res.send(response);

  } else {
    // Use Secure Channel
    const iv = Buffer.from(req.headers["x-sec-h1"], "base64");
    try {
      
      // GET requests (no request body)
      if (req.method === "GET") {
        console.log("\n ➡️  GET request detected");
        const mockResponse = await handleMock(req.method, endpoint, null);
        return sendEncrypted(res, mockResponse, iv);
      }
  
      // NON-GET requests
      const mockResponse = await handleMock(req.method, endpoint, req.decryptedBody);
      console.log("\n ➡️  POST request detected: ", req.decryptedBody);
      return sendEncrypted(res, mockResponse, iv);
  
    } catch (e) {
      console.error("\n ❌ Error:", e.stack || e);
      res.status(500).send("Error processing request");
    }
  }
});
