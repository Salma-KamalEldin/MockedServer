import express from "express";
import {
  publicKeyBase64,
  signServerPublicKey
} from "../crypto/serverKeys.js";
import { deriveSharedKey } from "../crypto/eciesDecryptor.js";
import { setSharedKey } from "../services/sharedKeyStore.js";
import { config } from "../config/env.js";

const router = express.Router();

// router.post("/consumerapp/v2/server/publicKey", (req, res) => {

//   if (config.environment === "DEV") {
//     res.json({
//       serverPublicKey:  "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEMiEz+x6kYkLtzmqUomOxlQVRs6NCykpvBpCYzZwo2iVwdyPObAmJR6OocnXlAwMhMTap+mBO3HXuTqHosDDW+Q==",
//       serverPublicKeySignature: "MEYCIQChMK06mBtut7PZ253Vtwtz7tbAhd4Ps2gtkUlWh6CbeQIhAMamU47t/w9XnR3PXnB2wSrs2NUDqVsorqiXwDrpeL0w"
//     });
//   } else {
//     const { appPublicKey } = req.body;

//     const sharedKey = deriveSharedKey(appPublicKey);
//     console.log("\n 🔐 Secure channel established - shared key derived", sharedKey.toString("base64"));
//     setSharedKey(sharedKey);

//     res.json({
//       serverPublicKey: publicKeyBase64,
//       serverPublicKeySignature: signServerPublicKey()
//     });
//   }
// });

import axios from "axios";

router.post("/consumerapp/v2/server/publicKey", async (req, res) => {
  try {
    // 🔹 DEV: return mocked response
    if (config.environment === "DEV") {
      return res.json({
        serverPublicKey:
          "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEMiEz+x6kYkLtzmqUomOxlQVRs6NCykpvBpCYzZwo2iVwdyPObAmJR6OocnXlAwMhMTap+mBO3HXuTqHosDDW+Q==",
        serverPublicKeySignature:
          "MEYCIQChMK06mBtut7PZ253Vtwtz7tbAhd4Ps2gtkUlWh6CbeQIhAMamU47t/w9XnR3PXnB2wSrs2NUDqVsorqiXwDrpeL0w"
      });
    }


    console.log("request body", req.body);
    // 🔁 Forward request to real BE
    const url = `${config.backendUrl}/consumerapp/v2/server/publicKey`;
    console.log(`\n ➡️  Forwarding to BE: ${url}`);
    const beResponse = await axios.post(
      url, req.body, {
        timeout: 10000,
        headers: {
          "Accept-Encoding": "gzip",
          "Content-Type": "application/json; charset=UTF-8",
          "User-Agent": "iOS 26.1 Consumer 4.0.5",
          "x-dynatrace": "MT_3_5_6139794729796816_2-0_bf2d3ffb-1354-4c17-9244-5fe51952256e_0_259_47"
        } 
      }
    );

    // 🔁 Return BE response to client
    const BERepsponse = res.status(beResponse.status).json(beResponse.data);
    // 🔐 PROD: handle secure channel locally
    // const { appPublicKey } = req.body;

    // const sharedKey = deriveSharedKey(appPublicKey);
    // console.log(
    //   "\n 🔐 Secure channel established - shared key derived",
    //   sharedKey.toString("base64")
    // );

    // setSharedKey(sharedKey);

    console.log("BE response data", beResponse.data);

    return BERepsponse;

  } catch (err) {
    console.error("❌ Forward to BE failed:",{
      status: err.response?.status,
      data: err.response?.data,
      dataaa: err.response
    }); 

    return res.status(502).json({
      status: err.response?.status,
      data: err.response?.data
    }); 
  }
});


export default router;
