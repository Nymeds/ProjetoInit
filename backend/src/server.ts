import { app } from "./app.js"; 
import { env } from "./env/index.js";

app
  .listen({
    host: "0.0.0.0",
    port: env.PORT
  })
  .then(() => {
    console.log(`SERVER ON PORT ${env.PORT}`);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
