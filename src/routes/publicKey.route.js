import express from "express";
import {
  publicKeyBase64,
  signServerPublicKey
} from "../crypto/serverKeys.js";
import { deriveSharedKey } from "../crypto/eciesDecryptor.js";
import { setClientPrivateKey, getClientPrivateKey, setSharedKey, setHmac } from "../services/sharedKeyStore.js";
import { config } from "../config/env.js";
import crypto from "crypto";

const router = express.Router();

// router.post("/consumerapp/v2/server/publicKey", (req, res) => {

//   if (config.environment === "DEV") {
//     res.json({
//       serverPublicKey:  "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEMiEz+x6kYkLtzmqUomOxlQVRs6NCykpvBpCYzZwo2iVwdyPObAmJR6OocnXlAwMhMTap+mBO3HXuTqHosDDW+Q==",
//       serverPublicKeySignature: "MEYCIQChMK06mBtut7PZ253Vtwtz7tbAhd4Ps2gtkUlWh6CbeQIhAMamU47t/w9XnR3PXnB2wSrs2NUDqVsorqiXwDrpeL0w"
//     });
//   } else {
//     const { appPublicKey } = req.body;

//     const sharedKey = deriveSharedKey(appPublicKey);
//     console.log("\n 🔐 Secure channel established - shared key derived", sharedKey.toString("base64"));
//     setSharedKey(sharedKey);

//     res.json({
//       serverPublicKey: publicKeyBase64,
//       serverPublicKeySignature: signServerPublicKey()
//     });
//   }
// });

import axios from "axios";

router.post("/consumerapp/v2/server/publicKey", async (req, res) => {
  try {
    // 🔹 DEV: return mocked response
    if (config.environment === "DEV") {
      return res.json({
        serverPublicKey:
          "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEMiEz+x6kYkLtzmqUomOxlQVRs6NCykpvBpCYzZwo2iVwdyPObAmJR6OocnXlAwMhMTap+mBO3HXuTqHosDDW+Q==",
        serverPublicKeySignature:
          "MEYCIQChMK06mBtut7PZ253Vtwtz7tbAhd4Ps2gtkUlWh6CbeQIhAMamU47t/w9XnR3PXnB2wSrs2NUDqVsorqiXwDrpeL0w"
      });
    }


    const modifiedRequest = preparePublicKeyRequest(req);
    console.log("request body", modifiedRequest.body);
    // 🔁 Forward request to real BE
    const url = `${config.backendUrl}/consumerapp/v2/server/publicKey`;
    console.log(`\n ➡️  Forwarding to BE: ${url}`);
    const beResponse = await axios.post(
      url, modifiedRequest.body, {
        timeout: 10000,
        headers: {
          "Accept-Encoding": "gzip",
          "Content-Type": "application/json; charset=UTF-8",
          "User-Agent": "iOS 26.1 Consumer 4.0.5",
          "x-dynatrace": "MT_3_5_6139794729796816_2-0_bf2d3ffb-1354-4c17-9244-5fe51952256e_0_259_47"
        } 
      }
    );

    // 🔁 Return BE response to client
    const BERepsponse = res.status(beResponse.status).json(beResponse.data);
    // 🔐 PROD: handle secure channel locally
    // const { appPublicKey } = req.body;

    // const sharedKey = deriveSharedKey(appPublicKey);
    // console.log(
    //   "\n 🔐 Secure channel established - shared key derived",
    //   sharedKey.toString("base64")
    // );

    // setSharedKey(sharedKey);

    handlePublicKeyResponse(beResponse.data);
    console.log("BE response data", beResponse.data);

    return BERepsponse;

  } catch (err) {
    console.error("❌ Forward to BE failed:",{
      status: err.response?.status,
      data: err.response?.data,
      dataaa: err.response
    }); 

    return res.status(502).json({
      status: err.response?.status,
      data: err.response?.data
    }); 
  }
});

function appleX963KDF(secret, sharedInfo, outputLen) {
  let derived = Buffer.alloc(0);
  let counter = 1;
  while (derived.length < outputLen) {
      const hash = crypto.createHash("sha256");
      const ctr = Buffer.alloc(4);
      ctr.writeUInt32BE(counter++);
      hash.update(Buffer.concat([secret, ctr, sharedInfo]));
      derived = Buffer.concat([derived, hash.digest()]);
  }
  return derived.subarray(0, outputLen);
}

function encryptAppPublicKey(appPublicKeyBase64, serverPublicKeyPem) {
  const ephemeral = crypto.createECDH('prime256v1');
  const ephemeralPublicKey = ephemeral.generateKeys(); 

  // Mirror iOS: Clean PEM -> Base64 -> Drop 26 bytes
  const base64Content = serverPublicKeyPem.replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|\n|\r/g, '');
  const rawServerPublicKey = Buffer.from(base64Content, 'base64').subarray(26);

  const sharedSecret = ephemeral.computeSecret(rawServerPublicKey);

  // Apple standard ECIES KDF
  const kdfOut = appleX963KDF(sharedSecret, ephemeralPublicKey, 32);
  const aesKey = kdfOut.subarray(0, 16);
  const iv = kdfOut.subarray(16);

  const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, iv);
  // CRITICAL: We encrypt the STRING representation, matching Swift String(contentsOf:)
  const ciphertext = Buffer.concat([
      cipher.update(appPublicKeyBase64, 'utf8'), 
      cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([ephemeralPublicKey, ciphertext, tag]).toString('base64');
}

function preparePublicKeyRequest(req) {
  try {
    const alice = crypto.createECDH('prime256v1');
    console.log("1] Generate Client Private/Public Keys");
    alice.generateKeys();
    console.log("2] Save Client Private Key for feature use");
    setClientPrivateKey(alice.getPrivateKey('base64'));
    
    console.log("3] Convert Client PublicKey to base64");
    const clientPublicKeyBase64 = alice.getPublicKey("base64");
  
    console.log("4] Server pem file");
      const serverPublicKeyPem = `-----BEGIN PUBLIC KEY-----
  MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7M34f1O2wlxDLnz3uQy6wbsGPn/c
  QFGtKQuKaDXdaaPxVx/VzyDIgj2d7a69w4TOTnt9sapnetwfD3e/fJh9uA==
  -----END PUBLIC KEY-----`;
  
    console.log("5] encrypt client public key ecies");
    const encryptedPayload = encryptAppPublicKey(clientPublicKeyBase64, serverPublicKeyPem);
  
    // let body = req.body || {};
    // body.appPublicKey = encryptedPayload;
    // body.kdfSalt = "32787494-22EA-4B2D-8F3B-87BC4D0061E5";//bru.getCollectionVar("kdfSalt")
    // body.deviceId = "cvaSBHrXNE0OqclXasbesc:APA91bEXe_Z2ftJfVnHW6Y0V1W8kA8eSCHQ-Q8TeIiZ15ZfOJmjAhkMlo_1dj5XzPw92UugelRPfb8EygeWNGQPIxnRQls2XS7xuqzOTd2E8wyIkYbC5XZI";//bru.getCollectionVar("deviceToken");
    // // req.setBody(body);
    req.body = {
      "appPublicKey": encryptedPayload,
      "kdfSalt": "32787494-22EA-4B2D-8F3B-87BC4D0061E5",
      "deviceId": "cvaSBHrXNE0OqclXasbesc:APA91bEXe_Z2ftJfVnHW6Y0V1W8kA8eSCHQ-Q8TeIiZ15ZfOJmjAhkMlo_1dj5XzPw92UugelRPfb8EygeWNGQPIxnRQls2XS7xuqzOTd2E8wyIkYbC5XZI",
      "version" : "mpesa.securev1",
      "algorithm" : "ECDH",
      "deviceType" : "IOS"
    }
  
    console.log("✅ Built PublicKey request", req.body);
    return req;
  } catch (err) {
    console.error("❌ Pre-request failed:", err.message);
  }
}

function handlePublicKeyResponse(response) {
  console.log("------ PublicKey Post-request Script ------");
  try {
  console.log("1] server public key from publicKey API");
    const serverPubKeyBase64 = response.serverPublicKey;
    if (!serverPubKeyBase64) throw new Error("Missing serverPublicKey");

    const alice = crypto.createECDH('prime256v1');
    console.log("2] Get Saved Client Private Key");
    alice.setPrivateKey(getClientPrivateKey(), 'base64');

    // 1. Mirror iOS: dropFirst(26)
    console.log("2] Remove first 26 byte from server public key");
    const decodedData = Buffer.from(serverPubKeyBase64, 'base64');
    const rawServerKey = decodedData.subarray(26); 

    // 2. Compute Secret (32 bytes)
    console.log("2] Compute Shared Key");
    const fullSecret = alice.computeSecret(rawServerKey);
    // 3. Mirror iOS: dropLast(16) -> Results in 16 bytes
    // In JS, subarray(0, 16) is exactly the same as Swift dropLast(16) for 32-byte input
    const sharedKey = fullSecret.subarray(0, 16); 

    console.log("3] Compute HMAC");
    // 4. Derive HMAC Key (Using the 16-byte sharedKey as password)
    const salt = "32787494-22EA-4B2D-8F3B-87BC4D0061E5";
    const hmacKey = crypto.hkdfSync(
        'sha256',
        sharedKey,                    // The 16-byte password
        Buffer.from(salt, 'utf8'),    // The salt
        Buffer.alloc(0),              // Empty Info
        16                            // Output 16 bytes
    );

    // 5. Save to Bruno
    setSharedKey(sharedKey.toString('base64'));
    setHmac(Buffer.from(hmacKey));
    // bru.setVar("HMAC", Buffer.from(hmacKey));
//     bru.setVar("HMAC", Buffer.from(hmacKey).toString("base64"));

    console.log("✅ Key Handshake Complete");
    console.log("Shared Key (Base64):", sharedKey.toString('base64'));
    console.log("HMAC Key (Base64):", hmacKey.toString("base64"));
    console.log("HMAC length:", Buffer.from(hmacKey).length);

  } catch (err) {
    console.error("❌ Post-request failed:", err.message);
  }
}


export default router;
