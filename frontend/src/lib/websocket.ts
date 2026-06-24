import { useState, useEffect, useCallback, useRef } from 'react';

type ClientType = 'admin' | 'display';

export function useWebSocket(clientType: ClientType) {
  const [gameState, setGameState] = useState<any>(null);
  const [lastEffect, setLastEffect] = useState<{ effect: string; timestamp: number; [key: string]: any } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // When using Vite dev server proxy, we connect to the same host but use the ws endpoint
    const wsUrl = import.meta.env.DEV 
      ? `ws://${window.location.host}/ws/${clientType}` 
      : `${protocol}//${window.location.host}/ws/${clientType}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`WebSocket connected as ${clientType}`);
      setIsConnected(true);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'state_update') {
          setGameState(message.data);
        } else if (message.type === 'effect') {
          setLastEffect({ ...message.data, timestamp: Date.now() });
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      wsRef.current = null;
      
      // Auto-reconnect after 2 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        console.log('Attempting to reconnect...');
        connect();
      }, 2000);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      ws.close();
    };

    wsRef.current = ws;
  }, [clientType]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  return { gameState, isConnected, lastEffect, send };
}
