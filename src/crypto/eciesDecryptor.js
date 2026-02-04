import crypto from "crypto";
import { appleX963KDF } from "./kdf.js";
import { serverPrivateKeyPem } from "./serverKeys.js";

export function deriveSharedKey(base64Payload) {
  const payload = Buffer.from(base64Payload, "base64");

  const ephemeralPublicKey = payload.subarray(0, 65);
  const encrypted = payload.subarray(65);
  const ciphertext = encrypted.subarray(0, encrypted.length - 16);
  const tag = encrypted.subarray(encrypted.length - 16);

  const ecdh = crypto.createECDH("prime256v1");

  const privateKeyObj = crypto.createPrivateKey(serverPrivateKeyPem);
  const jwk = privateKeyObj.export({ format: "jwk" });
  const serverPrivateKey = Buffer.from(
    jwk.d.replace(/-/g, "+").replace(/_/g, "/"),
    "base64"
  );

  ecdh.setPrivateKey(serverPrivateKey);
  const sharedSecret = ecdh.computeSecret(ephemeralPublicKey);

  const kdfOut = appleX963KDF(sharedSecret, ephemeralPublicKey, 32);
  const aesKey = kdfOut.subarray(0, 16);
  const iv = kdfOut.subarray(16);

  const decipher = crypto.createDecipheriv("aes-128-gcm", aesKey, iv);
  decipher.setAuthTag(tag);

  const decrypted =
    decipher.update(ciphertext, null, "utf8") +
    decipher.final("utf8");

  // decrypted = client public key (Base64)
  const clientPublicKey = Buffer.from(decrypted, "base64");
  const finalSecret = ecdh.computeSecret(clientPublicKey);

  return finalSecret.subarray(0, 16); // AES-128 shared key
}
