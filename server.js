import { startProdServer } from "vinext/server/prod-server";

await startProdServer({
  port: parseInt(process.env.PORT || "3000"),
  host: process.env.HOSTNAME || "0.0.0.0",
});
