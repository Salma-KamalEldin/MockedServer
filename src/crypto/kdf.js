import crypto from "crypto";

export function appleX963KDF(secret, sharedInfo, outputLen) {
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