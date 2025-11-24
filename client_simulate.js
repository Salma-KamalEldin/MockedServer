import axios from "axios";
import { encryptData, decryptData } from "./src/crypto/encryptor.js";

async function sendRequest() {
  try {
    console.log("🔹 Preparing encrypted request...");
    const payload = { "userId": "12345" };
    const encrypted = encryptData(payload);
    console.log("🔹 Sending encrypted payload to gateway...", encrypted);

    const response = await axios.post(
      "http://localhost:8080/users/getProfile",
      encrypted,
      { headers: { "Content-Type": "text/plain" }, timeout: 10000 }
    );

    console.log("✅ Encrypted response from gateway:", response.data);
    // const decrypted = decryptData(response.data);
    console.log("✅ Decrypted response:", response.data);
  } catch (error) {
    console.error("❌ Request failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

sendRequest();
