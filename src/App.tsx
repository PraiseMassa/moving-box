import { useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function App() {
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected">("disconnected");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const [position, setPosition] = useState({ x: 100, y: 100 });

  // Profile state with KV caching
  const [profile, setProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const lastSentRef = useRef(0);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // 🔐 AUTH STATE
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 👤 FETCH PROFILE WITH KV CACHING
  const fetchProfile = async () => {
    if (!session) return;
    
    setProfileLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8787/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
        setIsCached(data.cached || false);
        console.log(`Profile ${data.cached ? '✅ (cached)' : '🆕 (fresh)'}:`, data.profile);
      } else {
        console.error('Profile fetch failed:', await response.text());
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  // Fetch profile when session is available
  useEffect(() => {
    if (session) {
      fetchProfile();
    }
  }, [session]);

  // 🔌 WEBSOCKET CONNECT
  useEffect(() => {
    if (!session) return;

    const token = session.access_token;
    console.log('Connecting WebSocket with token:', token.substring(0, 10) + '...');

    const ws = new WebSocket(
      `ws://127.0.0.1:8787/ws?token=${encodeURIComponent(token)}`
    );

    wsRef.current = ws;

    ws.onopen = () => {
      console.log("✅ WebSocket connected successfully");
      setConnectionStatus("connected");
    };

    ws.onmessage = (event) => {
      console.log("📩 Received message:", event.data);
      setPosition(JSON.parse(event.data));
    };

    ws.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
      setConnectionStatus("disconnected");
    };

    ws.onclose = (event) => {
      console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason}`);
      setConnectionStatus("disconnected");
    };

    return () => ws.close();
  }, [session]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (!boxRef.current) return;
    
    const rect = boxRef.current.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!wsRef.current || !dragOffsetRef.current) return;
    if (e.buttons !== 1) return; // Left mouse button not pressed

    const now = Date.now();
    if (now - lastSentRef.current < 16) return; // ~60fps throttle

    const newX = e.clientX - dragOffsetRef.current.x;
    const newY = e.clientY - dragOffsetRef.current.y;

    // Constrain to viewport
    const constrainedX = Math.max(0, Math.min(newX, window.innerWidth - 80));
    const constrainedY = Math.max(0, Math.min(newY, window.innerHeight - 80));

    lastSentRef.current = now;

    wsRef.current.send(JSON.stringify({ x: constrainedX, y: constrainedY }));
  };

  const handleDragEnd = () => {
    dragOffsetRef.current = null;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // ⏳ LOADING
  if (loading) {
    return (
      <div className="h-screen grid place-items-center">
        <div>Loading...</div>
      </div>
    );
  }

  // 🔐 AUTH UI
  if (!session) {
    return (
      <div className="h-screen grid place-items-center bg-gray-100">
        <Card className="w-87.5">
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
                setAuthError(null);

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

  // 🟦 MAIN APP
  return (
    <div className="w-screen h-screen bg-gray-100 relative">
      {/* Top Bar with Status Indicators */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center">
        {/* Left side - Profile Info with Cache Status */}
        <div className="flex items-center gap-2">
          {profile && (
            <Badge variant={isCached ? "default" : "outline"} className="flex items-center gap-1 px-3 py-1">
              <span className="font-medium">{profile.name || profile.email}</span>
              {isCached ? (
                <span className="text-xs ml-1" title="Cached in KV">💾</span>
              ) : (
                <span className="text-xs ml-1" title="Fresh from database">🆕</span>
              )}
              {profileLoading && <span className="text-xs text-gray-500">...</span>}
            </Badge>
          )}
          
          {/* Sign Out Button */}
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>

        {/* Right side - Connection Status */}
        <Badge variant={connectionStatus === "connected" ? "default" : "destructive"} className="px-3 py-1">
          {connectionStatus === "connected" ? "🟢 Connected" : "🔴 Disconnected"}
        </Badge>
      </div>

      {/* Draggable Box */}
      {position && (
        <div
          ref={boxRef}
          onMouseDown={handleDragStart}
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          onMouseLeave={handleDragEnd}
          style={{
            left: position.x,
            top: position.y,
          }}
          className="absolute w-20 h-20 bg-blue-500 rounded-lg cursor-grab active:cursor-grabbing transition-none select-none shadow-lg hover:bg-blue-600"
        />
      )}
    </div>
  );
}

export default App;