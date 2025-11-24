import express from "express";
import { decryptData, encryptData } from "../crypto/encryptor.js";
import { handleMock } from "../middleware/recorder.js";

export const router = express.Router();

// Handle all routes without specifying "*"
router.use(async (req, res) => {
  try {
    const encryptedBody = req.body; // text body = base64 ciphertext
    console.log("📥 Encrypted request body:", encryptedBody);
    const decryptedBody = decryptData(encryptedBody);
    console.log("🔓 Decrypted request body:", decryptedBody);
    const endpoint = req.path;
    const mockResponse = await handleMock(endpoint, decryptedBody);
    const encryptedResponse = encryptData(mockResponse);
    console.log("🔒 Encrypted response body again to send to the client:", encryptedResponse);
    res.setHeader("Content-Type", "text/plain");
    res.send(encryptedResponse);
  } catch (e) {
    console.error("Error:", e.message || e);
    res
      .status(500)
      .send("Error processing encrypted mock request: " + (e.message || "unknown"));
  }
});
