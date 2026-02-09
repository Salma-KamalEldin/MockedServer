import { app } from "./app.js";
import { config } from "./config/env.js";

app.listen(config.port, () => {
  console.log(
    `🚀 Smart Mock Gateway running on port ${config.port} (mode=${config.mode}) and env ${config.environment}`
  );
});
