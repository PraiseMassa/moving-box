import { useEffect, useRef, useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Badge } from "./components/ui/badge";

// Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 🔐 AUTH UI - Your beautiful login screen
  if (!session) {
    return (
      <div className="h-screen grid place-items-center bg-gray-100">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>{isSignUp ? "Create Account" : "Sign In"}</CardTitle>
            <CardDescription>
              {isSignUp 
                ? "Enter your email below to create your account" 
                : "Enter your credentials to access the moving box"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {authError && (
                <div className="text-sm text-red-500">
                  {authError}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button 
              className="w-full"
              onClick={async () => {
                setAuthError("");

                if (isSignUp) {
                  const { error } = await supabase.auth.signUp({
                    email,
                    password,
                  });

                  if (error) {
                    setAuthError(error.message);
                  } else {
                    alert("Account created! You can now sign in.");
                    setIsSignUp(false);
                  }
                } else {
                  const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                  });

                  if (error) {
                    setAuthError(error.message);
                  }
                }
              }}
            >
              {isSignUp ? "Sign Up" : "Sign In"}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setIsSignUp(!isSignUp)}
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "Don't have an account? Sign up"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => supabase.auth.signInWithOAuth({
                provider: "google",
              })}
            >
              Sign in with Google
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 🟦 MAIN APP with your working box
  return (
    <div 
      className="h-screen bg-gray-100 relative overflow-hidden"
      style={{ cursor: dragging.current ? "grabbing" : "default" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Status bar */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <Button 
          variant="destructive" 
          size="sm"
          onClick={handleLogout}
        >
          Logout
        </Button>
        
        <Badge variant={connected ? "default" : "destructive"}>
          {connected ? "🟢 Connected" : "🔴 Disconnected"}
        </Badge>
      </div>

      {/* Draggable Box */}
      <div
        ref={boxRef}
        onMouseDown={handleMouseDown}
        className="absolute w-20 h-20 bg-blue-500 rounded-lg cursor-grab shadow-lg hover:bg-blue-600 transition-colors border-3 border-white"
        style={{
          left: box.x,
          top: box.y,
        }}
      />
    </div>
  );
}

export default App;