import { serve } from "@hono/node-server";
import { createApp } from "./app.js";

const port = Number(process.env.API_PORT ?? 4000);
const app = createApp();

serve({ fetch: app.fetch, port }, () => {
  console.log(`VladfsBET API http://127.0.0.1:${port}`);
});
