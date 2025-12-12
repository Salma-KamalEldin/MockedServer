
// // import crypto from "crypto";
// // import fs from "fs";

// // // 1️⃣ Read EC private key PEM
// // const pem = fs.readFileSync("./ec_private.pem", "utf8");

// // // 2️⃣ Create KeyObject
// // const privateKeyObj = crypto.createPrivateKey(pem);

// // // 3️⃣ Export as JWK to extract `d`
// // const jwk = privateKeyObj.export({ format: "jwk" });

// // // jwk.d is base64url
// // const serverPrivateKey = Buffer.from(
// //   jwk.d.replace(/-/g, "+").replace(/_/g, "/"),
// //   "base64"
// // );

// // console.log("🔐 Raw EC private key (base64):");
// // console.log(serverPrivateKey.toString("base64"));
// // console.log("Length:", serverPrivateKey.length); // ✅ must be 32

// // // const iosPublicKeyBuffer = Buffer.from("BJoYIZh0WDXWAtlZ5HtEwaKvW7EjGQDXg1H3kxK29yB8n75qkWZ4PPCx8237RKHbI84Manj44LHbkLJ8rlEmM0I=", "base64");
// // // const iosPrivateKeyBuffer = Buffer.from("3BLt2cb0OVbl89l5z6LH2nWDuov5m6WutULD4WFdG6k=", "base64");
// // const iosPublicKeyBuffer = Buffer.from("BJ2MaeZfTn9rMerPn+AXminD22QdAbik7uJzpbUE4Py/JJOxl75WD58mGeNw7miFuYc4dFHY1rMYwA7c+8+9uat0PrzkpzOI3U11tWbUty/Lhx8pOff5qhvuLMFq7pM6O/Ez2jureULdmeE4H8njnZctSWBGH4/6Q5yWGQhmKACjFgablk6NfxbC1zMcJZevgcwcU4hsrshmXJOEQ0A8sp7VF6hkSyAV6A==", "base64");

// // // const ephemeralPublicKey = iosPublicKeyBuffer.subarray(0, 65);
// // // console.log("\n📱 iOS Ephemeral Public Key (base64):", ephemeralPublicKey.toString('base64'));
// // // const nonce = iosPublicKeyBuffer.subarray(65, 81); // 16 bytes for VariableIV
// // // console.log("🔢 Nonce (base64):", nonce.toString('base64'));
// // // const tagLength = 16;
// // // const ciphertext = iosPublicKeyBuffer.subarray(81, iosPublicKeyBuffer.length - tagLength);
// // // console.log("🔐 Ciphertext (base64):", ciphertext.toString('base64'));
// // // const tag = iosPublicKeyBuffer.subarray(iosPublicKeyBuffer.length - tagLength);
// // // console.log("🏷️ Auth Tag (base64):", tag.toString('base64'));

// // // 1. Standard Apple SealedBox Slice (12-byte Nonce)
// // const ephemeralPublicKey = iosPublicKeyBuffer.subarray(0, 65);
// // console.log('\n📱 iOS Ephemeral Public Key (base64):', ephemeralPublicKey.toString('base64'));
// // const nonce = iosPublicKeyBuffer.subarray(65, 77); // Try 12 instead of 16
// // console.log('🔢 Nonce (base64):', nonce.toString('base64'));
// // const tagLength = 16;
// // const ciphertext = iosPublicKeyBuffer.subarray(77, iosPublicKeyBuffer.length - tagLength);
// // console.log('🔐 Ciphertext (base64):', ciphertext.toString('base64'));
// // const tag = iosPublicKeyBuffer.subarray(iosPublicKeyBuffer.length - tagLength);
// // console.log('🏷️ Auth Tag (base64):', tag.toString('base64'));


// // // Alice creates an ECDH instance and sets her private key
// // console.log('Server: Creating ECDH instance...');
// // const server = crypto.createECDH('prime256v1');
// // server.setPrivateKey(serverPrivateKey);

// // // 4. Compute secret using ONLY the ephemeral key
// // const serverSecret = server.computeSecret(ephemeralPublicKey);

// // console.log("✅ Shared Secret derived successfully!");
// // console.log("Secret base64:", serverSecret.toString('base64'));

// // // Both secrets should be the same
// // console.log('\nKey Exchange Results:');
// // console.log('='.repeat(50));
// // console.log("iOS's public key (first 20 bytes):  ", iosPublicKeyBuffer.toString('hex').substring(0, 40) + '...');
// // console.log("\Server's secret (first 20 bytes):", serverSecret.toString('hex').substring(0, 40) + '...');
// // console.log("\Server's secret base64 => ", serverSecret.toString('base64'));
// // console.log('Secret length:', serverSecret.length, 'bytes');



// // // 3. SEC 1 / X9.63 KDF Implementation
// // function appleX963KDF(secret, pubKey) {
// //   const hash = crypto.createHash('sha256');
// //   hash.update(secret);
  
// //   // The magic 4-byte counter required by Apple/SEC1
// //   const counter = Buffer.alloc(4);
// //   counter.writeUInt32BE(1); 
// //   hash.update(counter);
  
// //   hash.update(pubKey);
// //   return hash.digest(); 
// // }

// // const aesKey = appleX963KDF(serverSecret, ephemeralPublicKey);

// // // 4. Decrypt
// // try {
// //   // Use the 16-byte nonce extracted from the buffer
// //   const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, nonce);
// //   decipher.setAuthTag(tag);
  
// //   let decrypted = decipher.update(ciphertext, null, 'utf8');
// //   decrypted += decipher.final('utf8');

// //   console.log("🔓 Decrypted Message:", decrypted);
// // } catch (err) {
// //   console.error("❌ Decryption failed. Error:", err.message);
  
// //   // Fallback: Some iOS versions use 12-byte IVs even with "VariableIV"
// //   // If the above fails, try: const nonce = iosPublicKeyBuffer.subarray(65, 77);
// // }


// import crypto from "crypto";
// import fs from "fs";

// // 1️⃣ Read & Extract Private Key
// const pem = fs.readFileSync("./ec_private.pem", "utf8");
// const privateKeyObj = crypto.createPrivateKey(pem);
// const jwk = privateKeyObj.export({ format: "jwk" });
// const serverPrivateKey = Buffer.from(jwk.d.replace(/-/g, "+").replace(/_/g, "/"), "base64");

// // 2️⃣ Input Data
// const iosPublicKeyBuffer = Buffer.from("BG/wkuicUr3gpL2fpomis6USk/bs3e0LQ44m/IVPh7JHMEfOeSgX0RK6iPFcV9BXlHagScFxQC8z4QHTAiEqX5Vaf9RwmdbQl/BMMSMBTe/kPmJMOzLhiv3GBIXluTinkqCBUGDHM6aNfZ1GHQd4aiLmykvHwC0x2EkRhBSU7/CMvhwbuolnELeXTAwgbP7O8LLXuTiFDqzYg63KdafirDi/S6e8jw7o7g==", "base64");

// // 3️⃣ Split Data (Exactly like the Java code)
// // First 65 bytes = Ephemeral Public Key
// const ephemeralPublicKey = iosPublicKeyBuffer.subarray(0, 65);
// // The rest = Ciphertext + 16-byte Tag
// const encryptedPayload = iosPublicKeyBuffer.subarray(65);
// const ciphertext = encryptedPayload.subarray(0, encryptedPayload.length - 16);
// const tag = encryptedPayload.subarray(encryptedPayload.length - 16);

// // 4️⃣ Compute Shared Secret
// const server = crypto.createECDH('prime256v1');
// server.setPrivateKey(serverPrivateKey);
// const serverSecret = server.computeSecret(ephemeralPublicKey);

// // 5️⃣ X9.63 KDF Implementation (Matches Bouncy Castle)
// function appleX963KDF(secret, pubKey, outputLen) {
//   let derivedKey = Buffer.alloc(0);
//   let counter = 1;
  
//   while (derivedKey.length < outputLen) {
//     const hash = crypto.createHash('sha256');
//     const counterBuf = Buffer.alloc(4);
//     counterBuf.writeUInt32BE(counter++);
    
//     // Sequence: SharedSecret + Counter + SharedInfo (Ephemeral PubKey)
//     hash.update(Buffer.concat([secret, counterBuf, pubKey]));
//     derivedKey = Buffer.concat([derivedKey, hash.digest()]);
//   }
//   return derivedKey.subarray(0, outputLen);
// }

// // Derive 32 bytes: 16 for AES Key, 16 for IV
// const kdfOutput = appleX963KDF(serverSecret, ephemeralPublicKey, 32);
// const aesKey = kdfOutput.subarray(0, 16);
// const iv = kdfOutput.subarray(16, 32); 

// // 6️⃣ Decrypt using AES-128-GCM
// try {
//   const decipher = crypto.createDecipheriv('aes-128-gcm', aesKey, iv);
//   decipher.setAuthTag(tag);
  
//   let decrypted = decipher.update(ciphertext, null, 'utf8');
//   decrypted += decipher.final('utf8');

//   console.log("🔓 Decrypted Message:", decrypted);
// } catch (err) {
//   console.error("❌ Decryption failed. Error:", err.message);
// }

import crypto from "crypto";
import fs from "fs";

// 1️⃣ Read & Extract Server Private Key
const pem = fs.readFileSync("./ec_private.pem", "utf8");
const privateKeyObj = crypto.createPrivateKey(pem);
const jwk = privateKeyObj.export({ format: "jwk" });
const serverPrivateKey = Buffer.from(jwk.d.replace(/-/g, "+").replace(/_/g, "/"), "base64");

// 2️⃣ Input Data (Encrypted ECIES text from iOS)
const iosPublicKeyBuffer = Buffer.from("BG/wkuicUr3gpL2fpomis6USk/bs3e0LQ44m/IVPh7JHMEfOeSgX0RK6iPFcV9BXlHagScFxQC8z4QHTAiEqX5Vaf9RwmdbQl/BMMSMBTe/kPmJMOzLhiv3GBIXluTinkqCBUGDHM6aNfZ1GHQd4aiLmykvHwC0x2EkRhBSU7/CMvhwbuolnELeXTAwgbP7O8LLXuTiFDqzYg63KdafirDi/S6e8jw7o7g==", "base64");

// 3️⃣ Split Data
const ephemeralPublicKey = iosPublicKeyBuffer.subarray(0, 65);
const encryptedPayload = iosPublicKeyBuffer.subarray(65);
const ciphertext = encryptedPayload.subarray(0, encryptedPayload.length - 16);
const tag = encryptedPayload.subarray(encryptedPayload.length - 16);

// 4️⃣ KDF Function for ECIES
function appleX963KDF(secret, pubKey, outputLen) {
  let derivedKey = Buffer.alloc(0);
  let counter = 1;
  while (derivedKey.length < outputLen) {
    const hash = crypto.createHash('sha256');
    const counterBuf = Buffer.alloc(4);
    counterBuf.writeUInt32BE(counter++);
    hash.update(Buffer.concat([secret, counterBuf, pubKey]));
    derivedKey = Buffer.concat([derivedKey, hash.digest()]);
  }
  return derivedKey.subarray(0, outputLen);
}

try {
  // --- STEP A: DECRYPT ECIES ---
  const ecdh = crypto.createECDH('prime256v1');
  ecdh.setPrivateKey(serverPrivateKey);
  const ephemeralSecret = ecdh.computeSecret(ephemeralPublicKey);

  const kdfOutput = appleX963KDF(ephemeralSecret, ephemeralPublicKey, 32);
  const aesKey = kdfOutput.subarray(0, 16);
  const iv = kdfOutput.subarray(16, 32);

  const decipher = crypto.createDecipheriv('aes-128-gcm', aesKey, iv);
  decipher.setAuthTag(tag);
  
  let decryptedClientPubKeyBase64 = decipher.update(ciphertext, null, 'utf8');
  decryptedClientPubKeyBase64 += decipher.final('utf8');

  console.log("🔓 Decrypted Client Public Key:", decryptedClientPubKeyBase64);

  // --- STEP B: DERIVE PERMANENT SHARED KEY ---
  // Convert the decrypted public key string back to a Buffer
  const clientPublicKeyBuf = Buffer.from(decryptedClientPubKeyBase64, 'base64');

  // Compute the final shared secret using Server Private + Client Public
  const finalSharedSecret = ecdh.computeSecret(clientPublicKeyBuf);

  // Hash the secret (SHA-256) to create a fixed-length 32-byte Symmetric Key
  const finalSharedSymmetricKey = crypto.createHash('sha256').update(finalSharedSecret).digest();

  console.log("🔑 Final Shared Symmetric Key (Hex):", finalSharedSymmetricKey.toString('hex'));
  console.log("✅ Ready for AES-256-GCM communication!");

} catch (err) {
  console.error("❌ Process failed:", err.message);
}
