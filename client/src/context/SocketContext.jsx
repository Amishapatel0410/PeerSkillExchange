import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    const token = localStorage.getItem('skillsync_token');
    const socket = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', ()    => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const joinMatch = (matchId) => {
    if (socketRef.current) {
      const token = localStorage.getItem('skillsync_token');
      socketRef.current.emit('join_match', { matchId, token });
    }
  };

  const leaveMatch = (matchId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_match', { matchId });
    }
  };

  const onMessage = (handler) => {
    if (socketRef.current) {
      socketRef.current.on('new_message', handler);
      return () => socketRef.current?.off('new_message', handler);
    }
    return () => {};
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, joinMatch, leaveMatch, onMessage }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
