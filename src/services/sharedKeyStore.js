let sharedKey = null;

export function setSharedKey(key) {
  sharedKey = key;
}

export function getSharedKey() {
  return sharedKey;
}

export function hasSharedKey() {
  return sharedKey !== null;
}
