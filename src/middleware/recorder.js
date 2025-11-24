import axios from "axios";
import { config } from "../config/env.js";
import { saveRecording, loadRecording } from "../utils/fileManager.js";

export async function handleMock(endpoint, decryptedBody) {
  if (config.mode === "REPLAY") {
    const record = loadRecording(endpoint);
    if (record) return record.response;
    throw new Error(`No recording for ${endpoint}`);
  }

  if (config.mode === "RECORD") {
    // call real backend; assumes mockBackend expects plaintext JSON
    const url = config.mockBackend.replace(/\/$/, "") + endpoint;
    const liveResponse = await axios.post(url, decryptedBody, { timeout: 10000 });
    saveRecording(endpoint, decryptedBody, liveResponse.data);
    return liveResponse.data;
  }

  // LIVE mode forwards to mockBackend (no save)
  if (config.mode === "LIVE") {
    const url = config.mockBackend.replace(/\/$/, "") + endpoint;
    console.log(`[LIVE] Forwarding ${endpoint} → ${url}`);
    console.log("[LIVE] Decrypted body:", decryptedBody);
  
    try {
      // 🔹 Use GET instead of POST temporarily
      const liveResponse = await axios.get(url, { timeout: 10000 });
      console.log("[LIVE] Response from Postman:", liveResponse.status, liveResponse.data);
      return liveResponse.data;
    } catch (err) {
      console.error("[LIVE] Error calling Postman mock:", err.message);
      throw err;
    }
  }  

  throw new Error(`Unknown MODE ${config.mode}`);
}
