import express from "express";
import {
  publicKeyBase64,
  signServerPublicKey
} from "../crypto/serverKeys.js";
import { decryptFromIOS } from "../crypto/eciesDecryptor.js";
import { setSharedKey } from "../services/sharedKeyStore.js";

const router = express.Router();

router.post("/consumerapp/v2/server/publicKey", (req, res) => {
  const { appPublicKey } = req.body;

  const sharedKey = decryptFromIOS(appPublicKey);
  setSharedKey(sharedKey);

  res.json({
    serverPublicKey: publicKeyBase64,
    serverPublicKeySignature: signServerPublicKey()
  });
});

export default router;
