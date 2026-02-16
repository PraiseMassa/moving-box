import { useEffect, useRef, useState } from "react";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [box, setBox] = useState({ x: 100, y: 100 });
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<any>(null);
  const boxRef = useRef<any>(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // WebSocket
  useEffect(() => {
    if (!session) return;

    const token = session.access_token;
    const ws = new WebSocket(`ws://127.0.0.1:8787/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected");
      setConnected(true);
    };

    ws.onclose = () => {
      console.log("❌ WebSocket disconnected");
      setConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnected(false);
    };

    ws.onmessage = (e) => {
      setBox(JSON.parse(e.data));
    };

    return () => ws.close();
  }, [session]);

  // Drag handlers
  // Drag handlers
const handleMouseDown = (e: any) => {
  dragging.current = true;
  const rect = boxRef.current.getBoundingClientRect();
  offset.current = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
};

const handleMouseMove = (e: any) => {
  if (!dragging.current || !wsRef.current) return;
  
  const x = e.clientX - offset.current.x;
  const y = e.clientY - offset.current.y;
  
  // Update local position immediately
  setBox({ x, y });
  
  // Send to server for other clients
  wsRef.current.send(JSON.stringify({ x, y }));
};

const handleMouseUp = () => {
  dragging.current = false;
};

const handleMouseLeave = () => {
  dragging.current = false;
};

  // Auth handlers
  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else alert("Check your email for confirmation!");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
  };

  // Login screen
  if (!session) {
    return (
      <div style={{ 
        height: "100vh", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center",
        background: "#f0f0f0",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        <div style={{
          background: "white",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          width: "320px"
        }}>
          <h2 style={{ 
            marginBottom: "1.5rem", 
            textAlign: "center",
            color: "#333"
          }}>
            Moving Box
          </h2>
          
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "1rem",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "1rem",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box"
            }}
          />
          
          <div style={{ display: "flex", gap: "8px", marginBottom: "1rem" }}>
            <button 
              onClick={handleLogin}
              style={{
                flex: 1,
                padding: "10px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer"
              }}
            >
              Login
            </button>
            
            <button 
              onClick={handleSignup}
              style={{
                flex: 1,
                padding: "10px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer"
              }}
            >
              Sign Up
            </button>
          </div>

          <button 
            onClick={handleGoogleSignIn}
            style={{
              width: "100%",
              padding: "10px",
              background: "white",
              color: "#333",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <span>Continue with Google</span>
          </button>
        </div>
      </div>
    );
  }

  // Main app
  return (
    <div 
      style={{ 
        height: "100vh", 
        background: "#f0f0f0",
        position: "relative",
        overflow: "hidden",
        cursor: dragging.current ? "grabbing" : "default",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Status bar */}
      <div style={{
        position: "absolute",
        top: "10px",
        left: "10px",
        right: "10px",
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 16px",
        background: "rgba(255,255,255,0.95)",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        zIndex: 10,
        border: "1px solid #e0e0e0"
      }}>
        <button 
          onClick={handleLogout}
          style={{
            padding: "6px 16px",
            background: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer"
          }}
        >
          Logout
        </button>
        
        <span style={{ 
          padding: "6px 16px",
          background: connected ? "#10b981" : "#ef4444",
          color: "white",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: "500"
        }}>
          {connected ? "🟢 Connected" : "🔴 Disconnected"}
        </span>
      </div>

      {/* Draggable Box */}
      <div
        ref={boxRef}
        onMouseDown={handleMouseDown}
        style={{
          position: "absolute",
          left: box.x,
          top: box.y,
          width: "80px",
          height: "80px",
          background: "#3b82f6",
          borderRadius: "12px",
          cursor: "grab",
          boxShadow: "0 8px 12px rgba(0,0,0,0.15)",
          userSelect: "none",
          transition: "box-shadow 0.2s",
          border: "3px solid white"
        }}
      />
    </div>
  );
}

export default App;