import { createServer } from "node:http";
import { prepareBucket, servePhoto } from "./fieldservice_workflow.js";

await prepareBucket();
const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/work-orders/photo-link") { res.writeHead(404).end(); return; }
  try {
    const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const result = await servePhoto(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(result));
  } catch (error) { const message = error instanceof Error ? error.message : "request rejected"; res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: message })); }
});
server.listen(Number(process.env.PORT ?? 3000), () => console.log("field-service server listening on http://localhost:3000"));
