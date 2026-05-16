import { useEffect, useRef } from "react";

export function useWebSocket(onMessage) {
  const ws = useRef(null);
  const timeout = useRef(null);
  const onMessageRef = useRef(onMessage);

  // Keep the latest callback without triggering reconnects
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    let isMounted = true;
    
    const connect = () => {
      if (!isMounted) return;
      
      const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const wsProtocol = apiBase.startsWith("https") ? "wss" : "ws";
      const wsUrl = `${apiBase.replace(/^https?/, wsProtocol)}/ws`;
      
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        onMessageRef.current(msg);
      };
      
      ws.current.onerror = (e) => console.error("WS error", e);
      
      ws.current.onclose = () => {
        console.log("WS closed, reconnecting in 2s...");
        if (isMounted) {
          timeout.current = setTimeout(connect, 2000);
        }
      };
    };

    connect();
    
    return () => {
      isMounted = false;
      clearTimeout(timeout.current);
      if (ws.current) {
        ws.current.onclose = null; // Prevent reconnect logic on unmount
        ws.current.close();
      }
    };
  }, []);
}
