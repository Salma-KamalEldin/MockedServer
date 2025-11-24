import express from "express";
import { router as mockRouter } from "./src/routes/mock.js";

import { encryptData, decryptData } from "./src/crypto/encryptor.js";
const app = express();

// app.get("/users/getProfile", (req, res) => {
//   console.log("📥 Incoming GET /users/getProfile");

//   const mockResponse = { 
//     name: "John Doe", 
//     age: 30 
//   };

//   res.json(mockResponse); // sends plain JSON
// });

// app.post("/users/getProfile", (req, res) => {
//   console.log("📥 Incoming GET /users/getProfile");

//   const mockResponse = { 
//     name: "John Doe", 
//     age: 30 
//   };

//   res.json(mockResponse); // sends plain JSON
// });

app.use(express.text({ type: "*/*" }));

app.use("/", mockRouter);


// app.post("/users/getProfile", (req, res) => {
//   console.log("📥 Raw encrypted body:", req.body);

//   try {
//     // console.log("request body", {"name": "salma"});
//     const decrypted = decryptData(req.body);
//     console.log("🔓 Decrypted:", decrypted);

//     const mockResponse = { name: "John Doe", age: 30 };
//     const encrypted = encryptData(mockResponse);

//     res.send(encrypted);
//   } catch (err) {
//     console.error("❌ Decrypt error:", err.message);
//     res.status(500).send("Encryption/Decryption error: " + err.message);
//   }
// });

app.get("/", (req, res) => {
  console.log("✅ Request received at /");
  res.send("✅ Basic Express works");
});

app.listen(8080, "127.0.0.1")
  .on("listening", () => console.log("Listening on 127.0.0.1:8080"))
  .on("error", (err) => console.error("❌ Failed to start server:", err.message));


// import express from "express";
// const app = express();

// app.get("/", (req, res) => {
//   res.send("✅ Basic Express works");
// });

// app.listen(8080, () => console.log("Listening on 8080"));
