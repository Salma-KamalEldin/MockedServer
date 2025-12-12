import crypto from "crypto";

export function cryptoSwiftHKDF(password, salt, outputLength) {
  const prk = crypto
    .createHmac("sha256", salt)
    .update(password)
    .digest();

  let output = Buffer.alloc(0);
  let previous = Buffer.alloc(0);
  let counter = 1;

  while (output.length < outputLength) {
    const hmac = crypto.createHmac("sha256", prk);
    hmac.update(previous);
    hmac.update(Buffer.from([counter]));
    previous = hmac.digest();
    output = Buffer.concat([output, previous]);
    counter++;
  }

  return output.slice(0, outputLength);
}
