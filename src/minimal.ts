import { Hono } from "hono";

// Define a minimal BoxRoom class just for testing
export class BoxRoom {
  constructor(state: DurableObjectState) {}
  
  async fetch(request: Request) {
    return new Response("Hello from BoxRoom");
  }
}

const app = new Hono();

app.get("/", (c) => c.text("Hello World"));

export default app;