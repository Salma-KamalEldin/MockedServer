import axios from "axios";
import { config } from "../config/env.js";
import https from "https";
import { getHmac, getIv, getSharedKey, setIv } from "../services/sharedKeyStore.js"; 
import crypto from "crypto";

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

      console.log("\n Status:", liveResponse.status);
      console.log("\n Response:", liveResponse.data);
      return liveResponse.data;

    } catch (err) {
      console.error("\n Response Error for request with path:", endpoint, err.message);
      throw err;
    }
  }  

  throw new Error(`\n Unknown MODE ${config.mode}`);
}


export async function handleForwardToBE(endpoint, req) {
  if (config.mode === "LIVE") {
    const url = config.backendUrl.replace(/\/$/, "") + endpoint;
    console.log(`\n Forwarding ${endpoint} → ${url}`);
  
    const normalizedMethod = (req.method || "GET").trim().toUpperCase();
    const builtRequest = prepareEncryptedRequest(req);
    // console.log({
    //   HTTPS_PROXY: process.env.HTTPS_PROXY,
    //   HTTP_PROXY: process.env.HTTP_PROXY,
    //   NODE_TLS_REJECT_UNAUTHORIZED: process.env.NODE_TLS_REJECT_UNAUTHORIZED
    // });
    
    const agent = new https.Agent({
      keepAlive: false,
      servername: "gateway.uat.superapp.m-pesa.com"
    });
    
    // {
    //   'accept-language': 'en-KE',
    //   'content-type': 'application/vnd.mpesa.secure-v1+octet-stream',
    //   'x-sec-h1': getIv(), // IV for GET can be empty or a fixed value since there's no body
    //   'x-sec-h2': 'ZFPI/HQaLF2ejnn7kg5ofoO/qA2Wqd8FjK+lBl+ZVbA=', //
    //   'x-sec-h3': '7D26FBC9-47E2-4E34-AEC4-3ADB0F7F3E21',
    //   'x-sec-h4': 'cvaSBHrXNE0OqclXasbesc:APA91bEXe_Z2ftJfVnHW6Y0V1W8kA8eSCHQ-Q8TeIiZ15ZfOJmjAhkMlo_1dj5XzPw92UugelRPfb8EygeWNGQPIxnRQls2XS7xuqzOTd2E8wyIkYbC5XZI',
    //   'x-sec-h5': 'CA8FEEF7-6228-4AB5-AD84-F618F6E6FAA4',
    //   'x-dynatrace': 'MT_3_5_6139794729796816_2-0_bf2d3ffb-1354-4c17-9244-5fe51952256e_0_32259_49',
    //   'user-agent': 'iOS 26.1 Consumer 4.0.5',
    //   "host": 'gateway.uat.superapp.m-pesa.com',
    //   'accept-encoding': 'gzip, deflate, br',
    //   "connection": 'keep-alive'
    // }

    try {
      let liveResponse;

      if (normalizedMethod === "GET") {
        liveResponse = await axios.get("https://gateway.uat.superapp.m-pesa.com/ke-oat/consumerapp/v1/app/settings/versions", {
          httpsAgent: false,
          // httpsAgent: agent,
          timeout: 10000,
          headers: builtRequest.headers,
          responseType: 'arraybuffer'
        });
        
      } else if (normalizedMethod === "POST") {
        liveResponse = await axios.post(url, {payload}, { 
          timeout: 10000 
        });
      } else {
        throw new Error(`\n Unsupported method: ${method}`);
      }

      console.log("\n Status:", liveResponse.status);
      console.log("\n Response:", liveResponse.data);
      return liveResponse;

    } catch (err) {
      console.error("\n Response Error for request with path:", endpoint, err.message);
      throw err;
    }
  }  

  throw new Error(`\n Unknown MODE ${config.mode}`);
}

function prepareEncryptedRequest(req) {
    function encryptPayload(json, sharedKeyBase64, iv) {
        const sharedKey = Buffer.from(sharedKeyBase64, 'base64');

        if (![16, 24, 32].includes(sharedKey.length)) {
            throw new Error(`Invalid Key Length: ${sharedKey.length} bytes.`);
        }

        // Use empty string if body is null/undefined
        const payload = !json ? "" : (typeof json === 'string' ? json : JSON.stringify(json));
        

        const algorithm = sharedKey.length === 16 ? 'aes-128-gcm' : 'aes-256-gcm';
        const cipher = crypto.createCipheriv(algorithm, sharedKey, iv);

        let encrypted = cipher.update(payload, 'utf8');
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        const tag = cipher.getAuthTag();
        const encryptedPayload = Buffer.concat([encrypted, tag]);

        return encryptedPayload.toString('base64')
    }

    function calculateHMACHash(encryptedPayloadBase64, requestID, hmacKey) {
        const key = Buffer.isBuffer(hmacKey) ? hmacKey : Buffer.from(hmacKey, 'base64');
        // Swift concatenation: Base64Payload + RequestID
    const messageToSign = encryptedPayloadBase64.replace(/\n|\r/g, "") + requestID;
    console.log("--- HMAC DEBUG ---");
    console.log("Payload (First 20):", encryptedPayloadBase64.substring(0, 20));
    console.log("RequestID:", requestID);
    console.log("Full Message to Sign:", messageToSign);
    console.log("HMAC Key (Base64):", hmacKey);

        return crypto.createHmac('sha256', key)
                    .update(messageToSign, 'utf8')
                    .digest('base64');
    }

    try {
        // 1. Retrieve Keys
      const sharedSecretBase64 = getSharedKey();
      console.log("Shared Secret: ", sharedSecretBase64);
      const hmacKey = getHmac();

      if (!sharedSecretBase64 || !hmacKey) {
          throw new Error("Shared secret or HMAC key missing. Perform handshake first.");
      }
      
      console.log("1] Generate IV");
      const iv = crypto.randomBytes(12);
      const ivBase64 = iv.toString("base64")
      setIv(ivBase64);
      console.log("IV: ", ivBase64);

      console.log("2] Encrypt Request");
        // 2. Encryption Step
        // Use req.getBody() to ensure we have the latest data
      let encryptedPayload = null;
      if (req.body) {
//         console.log("request body", req.getBody());
        encryptedPayload = encryptPayload(
          req.body, 
          sharedSecretBase64,
          iv
        );
        req.body = encryptedPayload;
      }
        
        
        // 3. HMAC Step (Force Uppercase UUID to match iOS)
      console.log("3] Generate Request ID");
      const requestID = crypto.randomUUID().toUpperCase();
        
      console.log("4] Calculate Hashed HMAC");
      const hmacHash = calculateHMACHash(
          encryptedPayload || Buffer.alloc(0).toString("base64"), 
          requestID, 
          Buffer.from(hmacKey).toString("base64")
      );

        //4. Set Headers and Body
      req.headers["X-Sec-H1"] = iv.toString("base64");
      req.headers["X-Sec-H2"] = hmacHash;
      req.headers["X-Sec-H3"] = requestID;
      req.headers["X-Sec-H4"] = "cvaSBHrXNE0OqclXasbesc:APA91bEXe_Z2ftJfVnHW6Y0V1W8kA8eSCHQ-Q8TeIiZ15ZfOJmjAhkMlo_1dj5XzPw92UugelRPfb8EygeWNGQPIxnRQls2XS7xuqzOTd2E8wyIkYbC5XZI";
      req.headers["X-Sec-H5"] = "CA8FEEF7-6228-4AB5-AD84-F618F6E6FAA4";
      req.headers["x-dynatrace"] = "MT_3_5_6139794729796816_2-0_bf2d3ffb-1354-4c17-9244-5fe51952256e_0_32259_49"; 
      req.headers["User-Agent"] = "iOS 26.1 Consumer 4.0.5";     
      req.headers["host"] = "gateway.uat.superapp.m-pesa.com";

      console.log("✅ Request Encrypted & HMAC Signed");
      console.log("RequestID (H3):", requestID);
      console.log("HMAC (H2):", hmacHash);
      
      return req;
      // bru.setVar("reqBody",req.body);
    } catch (err) {
        console.error("❌ Secure Channel Failed:", err.message);
    }

  
}