export class BoxRoom {
  private state: DurableObjectState;
  private sockets: Map<WebSocket, string>;
  private position: { x: number; y: number };

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sockets = new Map();
    this.position = { x: 100, y: 100 };

    // Load persisted position
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<{ x: number; y: number }>("position");
      if (stored) {
        this.position = stored;
        console.log(`📦 Loaded position: (${this.position.x}, ${this.position.y})`);
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    this.handleSession(server, userId);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private handleSession(socket: WebSocket, userId: string): void {
    socket.accept();
    this.sockets.set(socket, userId);

    console.log(`🔵 User connected: ${userId} (Total: ${this.sockets.size})`);
    
    // Send current position immediately
    socket.send(JSON.stringify(this.position));

    socket.addEventListener("message", async (event) => {
      try {
        const data = JSON.parse(event.data as string);
        
        if (typeof data.x === "number" && typeof data.y === "number") {
          this.position = { x: data.x, y: data.y };
          
          // Persist to storage
          await this.state.storage.put("position", this.position);
          
          // Broadcast to all connected clients
          const message = JSON.stringify(this.position);
          for (const [ws, uid] of this.sockets.entries()) {
            if (ws !== socket) {
              try {
                ws.send(message);
              } catch (err) {
                console.error(`❌ Failed to send to user ${uid}:`, err);
              }
            }
          }
          
          console.log(`📦 Position updated by ${userId}: (${this.position.x}, ${this.position.y})`);
        }
      } catch (err) {
        console.error("❌ Invalid message:", err);
      }
    });

    socket.addEventListener("close", () => {
      this.sockets.delete(socket);
      console.log(`🔴 User disconnected: ${userId} (Remaining: ${this.sockets.size})`);
    });

    socket.addEventListener("error", (err) => {
      console.error(`❌ WebSocket error for user ${userId}:`, err);
      this.sockets.delete(socket);
    });
  }
}