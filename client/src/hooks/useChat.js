import { useState, useEffect, useCallback, useRef } from 'react';
import { chatApi } from '../api/services';
import { useSocket } from '../context/SocketContext';

/**
 * useChat — manages real-time chat for a given matchId.
 * Uses Socket.IO for real-time delivery with a polling fallback every 10s
 * in case the socket disconnects.
 */
export const useChat = (matchId) => {
  const [messages,  setMessages]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [sending,   setSending]   = useState(false);
  const { joinMatch, leaveMatch, onMessage, connected } = useSocket() || {};
  const pollingRef = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!matchId) return;
    try {
      const res = await chatApi.getMessages(matchId);
      setMessages(res.data.messages);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  // Initial load + Socket.IO room
  useEffect(() => {
    if (!matchId) return;
    setLoading(true);
    fetchMessages();

    if (joinMatch) joinMatch(matchId);

    // Real-time: append incoming messages from socket
    let cleanup = () => {};
    if (onMessage) {
      cleanup = onMessage((msg) => {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === msg._id);
          return exists ? prev : [...prev, msg];
        });
      });
    }

    // Polling fallback — every 10s when socket not connected
    pollingRef.current = setInterval(() => {
      if (!connected) fetchMessages();
    }, 10000);

    return () => {
      if (leaveMatch) leaveMatch(matchId);
      cleanup();
      clearInterval(pollingRef.current);
    };
  }, [matchId, connected]);

  const sendMessage = useCallback(async (text, file) => {
    if (!text?.trim() && !file) return;
    setSending(true);
    try {
      const formData = new FormData();
      if (text?.trim()) formData.append('message', text.trim());
      if (file)         formData.append('file', file);

      const res = await chatApi.sendMessage(matchId, formData);
      // Optimistically append if socket hasn't already pushed it
      setMessages((prev) => {
        const exists = prev.some((m) => m._id === res.data.message._id);
        return exists ? prev : [...prev, res.data.message];
      });
      return res.data.message;
    } catch (err) {
      throw err;
    } finally {
      setSending(false);
    }
  }, [matchId]);

  return { messages, loading, error, sending, sendMessage, refetch: fetchMessages };
};
