import axios from "axios";
import { config } from "../config/env.js";

export async function handleMock(method, endpoint) {
  if (config.mode === "LIVE") {
    const url = config.mockBackend.replace(/\/$/, "") + endpoint;
    console.log(`\n Forwarding ${endpoint} → ${url}`);
  
    const normalizedMethod = (method || "GET").trim().toUpperCase();

    try {
      let liveResponse;

      if (normalizedMethod === "GET") {
        liveResponse = await axios.get(url, {
          timeout: 10000
        });
      } else if (normalizedMethod === "POST") {
        liveResponse = await axios.post(url, {}, { 
          timeout: 10000 
        });
      } else {
        throw new Error(`\n Unsupported method: ${method}`);
      }

      console.log(normalizedMethod, "\n Response:", liveResponse.status);
      return liveResponse.data;

    } catch (err) {
      console.error("\n Response Error for request with path:", endpoint, err.message);
      throw err;
    }
  }  

  throw new Error(`\n Unknown MODE ${config.mode}`);
}
