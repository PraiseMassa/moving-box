import { Hono } from "hono";
import { cors } from "hono/cors";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { BoxRoom } from "./boRoom";

export interface Env {
  BOX_ROOM: DurableObjectNamespace;
  USER_PROFILES: KVNamespace;
}

const SUPABASE_URL = "https://klrfbcwwxowsixmijxcc.supabase.co";
const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`));

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use("/*", cors({
  origin: "http://localhost:5173",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Health check
app.get("/health", (c) => {
  console.log("✅ Health check");
  return c.json({ status: "ok" });
});

// WebSocket endpoint
app.get("/ws", async (c) => {
  const token = c.req.query("token");
  
  if (!token) {
    console.log("❌ No token provided");
    return c.text("Unauthorized", 401);
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    const userId = payload.sub as string;
    
    if (!userId) {
      console.log("❌ No user ID in token");
      return c.text("Unauthorized", 401);
    }

    console.log(`🔌 WebSocket connection for user: ${userId}`);

    const id = c.env.BOX_ROOM.idFromName("global-room");
    const room = c.env.BOX_ROOM.get(id);

    const url = new URL(c.req.url);
    url.searchParams.set("userId", userId);
    
    return room.fetch(new Request(url, c.req.raw));

  } catch (err) {
    console.error("❌ WebSocket auth error:", err);
    return c.text("Unauthorized", 401);
  }
});

export default app;
export { BoxRoom };