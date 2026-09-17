import "./setup-env.js";
import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

const port = Number(process.env.API_PORT ?? 4000);
const hostname = process.env.API_HOST ?? "127.0.0.1";
const app = createApp();

const server = serve({
  fetch: app.fetch,
  port,
  hostname,
  serverOptions: {
    maxHeaderSize: 16 * 1024,
    headersTimeout: 10_000,
    requestTimeout: 15_000,
    keepAliveTimeout: 5_000,
  },
}, () => {
  console.log(`VladfsBET API http://${hostname}:${port}`);
});

server.maxConnections = Number(process.env.API_MAX_CONNECTIONS ?? 1_024);
if ("maxRequestsPerSocket" in server) server.maxRequestsPerSocket = 1_000;
