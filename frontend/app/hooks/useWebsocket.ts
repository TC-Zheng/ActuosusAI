import { useEffect, useRef, useState, useCallback } from 'react';

interface UseWebsocketOptions {
  onMessage?: (message: MessageEvent) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}

export const useWebsocket = (url: string, options?: UseWebsocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const websocketRef = useRef<WebSocket | null>(null);

  // Function to send a message via the WebSocket
  const sendToWebsocket = useCallback((message: string) => {
    if (
      websocketRef.current &&
      websocketRef.current.readyState === WebSocket.OPEN
    ) {
      websocketRef.current.send(message);
    }
  }, []);

  // Function to close the WebSocket connection
  const closeConnection = useCallback(() => {
    if (
      websocketRef.current &&
      websocketRef.current.readyState !== WebSocket.CLOSED
    ) {
      websocketRef.current.close();
    }
  }, []);

  useEffect(() => {
    setIsConnecting(true);

    // Create a new WebSocket connection
    websocketRef.current = new WebSocket(url);

    const ws = websocketRef.current;

    ws.onopen = (event) => {
      setIsConnecting(false);
      setIsConnected(true);
      options?.onOpen?.(event);
    };

    ws.onmessage = (message) => {
      options?.onMessage?.(message);
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      options?.onClose?.(event);
    };

    ws.onerror = (event) => {
      options?.onError?.(event);
    };

    // Cleanup on unmount or when the url changes
    return () => {
      ws.close();
    };
  }, [options, url]);

  return {
    isConnected,
    isConnecting,
    sendToWebsocket,
    closeConnection,
  };
};
