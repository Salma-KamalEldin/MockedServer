import express from "express";
import {
  publicKeyBase64,
  signServerPublicKey
} from "../crypto/serverKeys.js";
import { deriveSharedKey } from "../crypto/eciesDecryptor.js";
import { setSharedKey } from "../services/sharedKeyStore.js";
import { config } from "../config/env.js";

const router = express.Router();

router.post("/consumerapp/v2/server/publicKey", (req, res) => {

  if (config.environment === "DEV") {
    res.json({
      serverPublicKey:  "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEMiEz+x6kYkLtzmqUomOxlQVRs6NCykpvBpCYzZwo2iVwdyPObAmJR6OocnXlAwMhMTap+mBO3HXuTqHosDDW+Q==",
      serverPublicKeySignature: "MEYCIQChMK06mBtut7PZ253Vtwtz7tbAhd4Ps2gtkUlWh6CbeQIhAMamU47t/w9XnR3PXnB2wSrs2NUDqVsorqiXwDrpeL0w"
    });
  } else {
    const { appPublicKey } = req.body;

    const sharedKey = deriveSharedKey(appPublicKey);
    setSharedKey(sharedKey);

    res.json({
      serverPublicKey: publicKeyBase64,
      serverPublicKeySignature: signServerPublicKey()
    });
  }
});

export default router;
