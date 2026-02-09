let sharedKey = null;
let clientPrivateKey = null;
let hmac = null;
let iv = null;

export function setIv(value) {
  iv = value;
}

export function getIv() {
  return iv;
} 

export function setHmac(value) { 
  hmac = value;
}

export function getHmac() {
  return hmac;
}

export function setClientPrivateKey(key) {
  clientPrivateKey = key;
}

export function getClientPrivateKey() {
  return clientPrivateKey;
} 

export function setSharedKey(key) {
  sharedKey = key;
}

export function getSharedKey() {
  return sharedKey;
}

export function hasSharedKey() {
  return sharedKey !== null;
}
