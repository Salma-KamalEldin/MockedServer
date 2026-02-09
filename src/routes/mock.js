import express from "express";
import { decryptRequest, sendEncrypted, encryptRequest, decryptResponse } from "../crypto/encryptor.js";
import { handleForwardToBE, handleMock } from "../middleware/recorder.js";
import { config } from "../config/env.js";

export const router = express.Router();

async function handleSecureChannel(req, res, endpoint) {
  const ivHeader = req.headers["x-sec-h1"];

  if (!ivHeader) {
    return res.status(400).send("Missing x-sec-h1 header");
  }

  const iv = Buffer.from(ivHeader, "base64");

  try {
    const isGet = req.method === "GET";

    console.log(
      `\n ➡️  ${isGet ? "GET" : "NON-GET"} request detected`,
      isGet ? "" : req.decryptedBody
    );

    const mockResponse = await handleMock(
      req.method,
      endpoint,
      isGet ? null : req.decryptedBody
    );

    return sendEncrypted(res, mockResponse, iv);
  } catch (e) {
    console.error("\n ❌ Secure Channel Error:", e.stack || e);
    return res.status(500).send("Error processing secure request");
  }
}


async function forwardToBE(req, res, endpoint) {
  console.log("\n Request headers:", req.headers);
  console.log("\n Request body:", req.body);

  if (req.method === "POST" && req.body) {
    const encryptedRequest = encryptRequest(req.body);
  } 
  
  try {
    const isGet = req.method === "GET";
    const response = await handleForwardToBE(endpoint, req);

    return decryptResponse(response);
  } catch (e) {
    console.error("\n ❌ BE Request failed:",{
      status: e.response?.status,
      data: e.response?.data,
      dataaa: e.response
    }); 
    return res.status(e.response?.status).json({
      status: e.response?.status,
      data: e.response?.data
    });
  }
}

router.use(decryptRequest);

router.use(async (req, res) => {
  const endpoint = req.path;

  // 🔓 DEV MODE — bypass secure channel
  if (config.environment === "DEV") {
    console.log("\n ➡️  DEV mode detected - skipping Secure Channel");

    const response = await handleMock(req.method, endpoint, req.body);

    res.setHeader(
      "Content-Type",
      "application/vnd.mpesa.secure-v1+octet-stream;charset=UTF-8"
    );

    return res.send(response);
    // 🔐 PROD / Secure Channel [POSTMAN => BE server]
  } else if (config.environment === "BE") {
    const response = await forwardToBE(req, res, endpoint);
    res.setHeader(
      "Content-Type",
      "application/vnd.mpesa.secure-v1+octet-stream;charset=UTF-8"
    );
    return res.send(response.data);
  } else {
    // 🔐 PROD / Secure Channel [Mobile => Mock server]
    return handleSecureChannel(req, res, endpoint);
  }
});
