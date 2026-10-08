import { useEffect, useRef } from 'react';
import { useSocket } from '../contexts/SocketContext';

/** Subscribes to a Socket.IO event for the component's lifetime; always calls the latest handler. */
const useSocketEvent = (event, handler) => {
  const { socket } = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket) return undefined;
    const listener = (payload) => handlerRef.current(payload);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [socket, event]);
};

export default useSocketEvent;
