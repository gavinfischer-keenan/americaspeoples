import { createStaticServer } from "./static-server.mjs";
const port = Number(process.env.PORT || 4173);
const server = createStaticServer("dist");
server.listen(port, "127.0.0.1", () =>
  console.log(`Local: http://127.0.0.1:${server.address().port}/`),
);
