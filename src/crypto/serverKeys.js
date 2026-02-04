import fs from "fs";
import crypto from "crypto";

const serverPrivateKeyPem = fs.readFileSync("./ec_private.pem", "utf8");

const privateKey = crypto.createPrivateKey(serverPrivateKeyPem);
const publicKey = crypto.createPublicKey(privateKey);

const publicKeyDer = publicKey.export({
  type: "spki",
  format: "der"
});

const publicKeyBase64 = publicKeyDer.toString("base64");

function signServerPublicKey() {
  const signer = crypto.createSign("SHA256");
  signer.update(publicKeyDer);
  signer.end();
  return signer.sign(privateKey).toString("base64");
}

export {
  serverPrivateKeyPem,
  privateKey,
  publicKeyDer,
  publicKeyBase64,
  signServerPublicKey
};
