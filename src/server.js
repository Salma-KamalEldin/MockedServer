import express from "express";
import fs from "fs";
import crypto from "crypto";
import { config } from "./config/env.js";
import { router as mockRouter } from "./routes/mock.js";
import { setSharedKey, hasSharedKey } from "./services/sharedKeyStore.js";

const app = express();

/* ---------------------------------------------------------
 * 1️⃣ Load Server Key Pair (EC Private + Derived Public Key)
 * --------------------------------------------------------- */
const serverPrivateKeyPem = fs.readFileSync("./ec_private.pem", "utf8");

const privateKeyObj = crypto.createPrivateKey(serverPrivateKeyPem);
const serverPublicKeyObj = crypto.createPublicKey(privateKeyObj);

// Export public key as Base64 (DER + SPKI)
const serverPublicKeyDer = serverPublicKeyObj.export({
  type: "spki",
  format: "der"
});
const serverPublicKeyBase64 = serverPublicKeyDer.toString("base64");

/* ---------------------------------------------------------
 * 2️⃣ Utility: Sign server public key (server identity)
 * --------------------------------------------------------- */
function signServerPublicKey() {
  const signer = crypto.createSign("SHA256");
  signer.update(serverPublicKeyDer);
  signer.end();
  const signature = signer.sign(privateKeyObj);
  return signature.toString("base64");
}
const serverPublicKeySignature = signServerPublicKey();


/* ---------------------------------------------------------
 * 4️⃣ Routes
 * --------------------------------------------------------- */

// Health check
app.get("/", (req, res) => {
  res.send(`✅ Smart Mock Gateway is running on port ${config.port}`);
});


function decryptFromIOS(base64Payload) {
    const iosPublicKeyBuffer = Buffer.from(base64Payload, 'base64');

    const ephemeralPublicKey = iosPublicKeyBuffer.subarray(0, 65);
    // The rest = Ciphertext + 16-byte Tag
    const encryptedPayload = iosPublicKeyBuffer.subarray(65);
    const ciphertext = encryptedPayload.subarray(0, encryptedPayload.length - 16);
    const tag = encryptedPayload.subarray(encryptedPayload.length - 16);

    console.log("Ephemeral PubKey:", ephemeralPublicKey.toString('hex'));
    console.log("Tag:", tag.toString('hex'));
    console.log("Ciphertext:", ciphertext.toString('hex'));

    // 4️⃣ Compute Shared Secret
    const server = crypto.createECDH('prime256v1');
    const privateKeyObj = crypto.createPrivateKey(serverPrivateKeyPem);
    const jwk = privateKeyObj.export({ format: "jwk" });
    const serverPrivateKey = Buffer.from(jwk.d.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    server.setPrivateKey(serverPrivateKey);
    const serverSecret = server.computeSecret(ephemeralPublicKey);

    console.log("shared key ", serverSecret.toString('hex'));

    // 5️⃣ X9.63 KDF Implementation (Matches Bouncy Castle)
    function appleX963KDF(secret, pubKey, outputLen) {
      let derivedKey = Buffer.alloc(0);
      let counter = 1;
      
      while (derivedKey.length < outputLen) {
        const hash = crypto.createHash('sha256');
        const counterBuf = Buffer.alloc(4);
        counterBuf.writeUInt32BE(counter++);
        
        // Sequence: SharedSecret + Counter + SharedInfo (Ephemeral PubKey)
        hash.update(Buffer.concat([secret, counterBuf, pubKey]));
        derivedKey = Buffer.concat([derivedKey, hash.digest()]);
      }
      return derivedKey.subarray(0, outputLen);
    }

    // Derive 32 bytes: 16 for AES Key, 16 for IV
    const kdfOutput = appleX963KDF(serverSecret, ephemeralPublicKey, 32);
    const aesKey = kdfOutput.subarray(0, 16);
    const iv = kdfOutput.subarray(16, 32); 
    
    // 6️⃣ Decrypt using AES-128-GCM
    try {
      const decipher = crypto.createDecipheriv('aes-128-gcm', aesKey, iv);
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(ciphertext, null, 'utf8');
      decrypted += decipher.final('utf8');
    
      console.log("🔓 Decrypted Message:", decrypted);

      // --- STEP B: DERIVE PERMANENT SHARED KEY ---
      // Convert the decrypted public key string back to a Buffer
      const clientPublicKeyBuf = Buffer.from(decrypted, 'base64');
    
      // Compute the final shared secret using Server Private + Client Public
      const finalSharedSecret = server.computeSecret(clientPublicKeyBuf);
    
      // Hash the secret (SHA-256) to create a fixed-length 32-byte Symmetric Key
      // const finalSharedSymmetricKey = crypto.createHash('sha256').update(finalSharedSecret).digest();
      const dropLast16Bytes = finalSharedSecret.subarray(0, 16); // AES-128 key
    
      console.log("🔑 Final Shared Symmetric Key (Base64):", dropLast16Bytes.toString('base64'));
      console.log("✅ Ready for AES-256-GCM communication!");

      return dropLast16Bytes;
    } catch (err) {
      console.error("❌ Decryption failed. Error:", err.message);
    }
    
}

app.use(express.json({ type: "application/json" }));
// 2️⃣ Text requests
app.use(express.text({ type: "text/*" }));
// 3️⃣ Binary / encrypted requests
app.use(express.raw({ type: "application/octet-stream" }));



// Public key endpoint (first step of key exchange)
app.post("/consumerapp/v2/server/publicKey", (req, res) => {
  console.log("➡️ Serving server public key & signature");
  console.log("   PublicKey:", serverPublicKeyBase64);
  console.log("   Signature:", serverPublicKeySignature);

  const { appPublicKey } = req.body;

  // Derive the shared key ONCE
  const sharedKey = decryptFromIOS(appPublicKey);

  // Store it globally
  setSharedKey(sharedKey);

  res.json({
    serverPublicKey: serverPublicKeyBase64,
    serverPublicKeySignature: serverPublicKeySignature
  });
});

/* 
 * Attach your mock router AFTER the key-exchange endpoint
 */
app.use("/", mockRouter);

/* ---------------------------------------------------------
 * 5️⃣ Start server
 * --------------------------------------------------------- */
app.listen(config.port, () => {
  console.log(`🚀 Smart Mock Gateway running on port ${config.port} (mode=${config.mode})`);
});