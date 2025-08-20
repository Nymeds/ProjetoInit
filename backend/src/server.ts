import { app } from "./app.js"; 
import { env } from "./env/index.js";

app
  .listen({
    host: "0.0.0.0",
    port: 3333
  })
  .then(() => {
    console.log("SERVER RODANDO NA PORTA 3333");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
