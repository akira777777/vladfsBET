import { createApp } from "./app.js";

const app = createApp();

export const fetchApp = async (request: Request): Promise<Response> => app.fetch(request);
