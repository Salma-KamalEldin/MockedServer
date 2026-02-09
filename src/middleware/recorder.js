import axios from "axios";
import { config } from "../config/env.js";
import https from "https";

export async function handleMock(method, endpoint) {
  if (config.mode === "LIVE") {
    const url = config.mockBackend.replace(/\/$/, "") + endpoint;
    console.log(`\n Forwarding ${endpoint} → ${url}`);
  
    const normalizedMethod = (method || "GET").trim().toUpperCase();

    try {
      let liveResponse;

      if (normalizedMethod === "GET") {
        liveResponse = await axios.get(url, {
          timeout: 10000
        });
      } else if (normalizedMethod === "POST") {
        liveResponse = await axios.post(url, {}, { 
          timeout: 10000 
        });
      } else {
        throw new Error(`\n Unsupported method: ${method}`);
      }

      console.log("\n Status:", liveResponse.status);
      console.log("\n Response:", liveResponse.data);
      return liveResponse.data;

    } catch (err) {
      console.error("\n Response Error for request with path:", endpoint, err.message);
      throw err;
    }
  }  

  throw new Error(`\n Unknown MODE ${config.mode}`);
}


export async function handleForwardToBE(method, endpoint, payload, headers) {
  if (config.mode === "LIVE") {
    const url = config.backendUrl.replace(/\/$/, "") + endpoint;
    console.log(`\n Forwarding ${endpoint} → ${url}`);
  
    const normalizedMethod = (method || "GET").trim().toUpperCase();
    // console.log({
    //   HTTPS_PROXY: process.env.HTTPS_PROXY,
    //   HTTP_PROXY: process.env.HTTP_PROXY,
    //   NODE_TLS_REJECT_UNAUTHORIZED: process.env.NODE_TLS_REJECT_UNAUTHORIZED
    // });
    
    const agent = new https.Agent({
      keepAlive: false,
      servername: "gateway.uat.superapp.m-pesa.com"
    });
    

    try {
      let liveResponse;

      if (normalizedMethod === "GET") {
        liveResponse = await axios.get("https://gateway.uat.superapp.m-pesa.com/ke-oat/consumerapp/v1/app/settings/versions", {
          httpsAgent: false,
          // httpsAgent: agent,
          timeout: 10000,
          headers: {
            'accept-language': 'en-KE',
            'content-type': 'application/vnd.mpesa.secure-v1+octet-stream',
            "h6": '66f29a68ce909943203b955585b3fd65cab972446fea50c082dd4f4c1f725f25',
            'x-sec-h1': 'Hg3ua+oqdNA32RvY',
            'x-sec-h2': 'ZFPI/HQaLF2ejnn7kg5ofoO/qA2Wqd8FjK+lBl+ZVbA=', //
            'x-sec-h3': '7D26FBC9-47E2-4E34-AEC4-3ADB0F7F3E21',
            'x-sec-h4': 'cvaSBHrXNE0OqclXasbesc:APA91bEXe_Z2ftJfVnHW6Y0V1W8kA8eSCHQ-Q8TeIiZ15ZfOJmjAhkMlo_1dj5XzPw92UugelRPfb8EygeWNGQPIxnRQls2XS7xuqzOTd2E8wyIkYbC5XZI',
            'x-sec-h5': 'CA8FEEF7-6228-4AB5-AD84-F618F6E6FAA4',
            'x-dynatrace': 'MT_3_5_6139794729796816_2-0_bf2d3ffb-1354-4c17-9244-5fe51952256e_0_32259_49',
            'user-agent': 'iOS 26.1 Consumer 4.0.5',
            'postman-token': '4669c2ca-451f-4a84-bd55-48e81947e2d1',
            "host": 'gateway.uat.superapp.m-pesa.com',
            'accept-encoding': 'gzip, deflate, br',
            "connection": 'keep-alive'
          }
        });
        
      } else if (normalizedMethod === "POST") {
        liveResponse = await axios.post(url, {payload}, { 
          timeout: 10000 
        });
      } else {
        throw new Error(`\n Unsupported method: ${method}`);
      }

      console.log("\n Status:", liveResponse.status);
      console.log("\n Response:", liveResponse.data);
      return liveResponse.data;

    } catch (err) {
      console.error("\n Response Error for request with path:", endpoint, err.message);
      throw err;
    }
  }  

  throw new Error(`\n Unknown MODE ${config.mode}`);
}
