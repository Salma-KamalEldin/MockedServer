import axios from "axios";
import { config } from "../config/env.js";
import { saveRecording, loadRecording } from "../utils/fileManager.js";

export async function handleMock(method, endpoint, decryptedBody) {
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
    // console.log("[LIVE] Decrypted body:", decryptedBody);
  
    const normalizedMethod = (method || "GET").trim().toUpperCase();
    // console.log("[LIVE] Method:", method);

    try {
      let liveResponse;

      if (normalizedMethod === "GET") {
        liveResponse = await axios.get(url, {
          timeout: 10000
        });
      } else if (normalizedMethod === "POST") {
        liveResponse = await axios.post(
          url,
          {},
          { timeout: 10000 }
        );
      } else {
        throw new Error(`Unsupported method: ${method}`);
      }

      console.log("[LIVE]", normalizedMethod, "Response:", liveResponse.status);
      return liveResponse.data;

    } catch (err) {
      console.error("[LIVE] Error:", err.message);
      throw err;
    }

    
  }  

  throw new Error(`Unknown MODE ${config.mode}`);
}
