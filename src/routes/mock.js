import express from "express";
import { secureChannel, sendEncrypted } from "../crypto/encryptor.js";
import { handleMock } from "../middleware/recorder.js";

export const router = express.Router();

router.use(secureChannel);

router.use(async (req, res) => {
  
  const iv = Buffer.from(req.headers["x-sec-h1"], "base64");
  try {
    // GET requests (no request body)
    if (req.method === "GET") {
      console.log("➡️ GET request detected");

      const endpoint = req.path;
      const mockResponse = await handleMock(req.method, endpoint, null);

      return sendEncrypted(res, mockResponse, iv);
    }

    // NON-GET requests
   
    console.log("🔓 Decrypted body:", req.decryptedBody);

    const endpoint = req.path;
    const mockResponse = await handleMock(
      req.method,
      endpoint,
      req.decryptedBody
    );

    return sendEncrypted(res, mockResponse, iv);

  } catch (e) {
    console.error("❌ Error:", e.stack || e);
    res.status(500).send("Error processing request");
  }
});
