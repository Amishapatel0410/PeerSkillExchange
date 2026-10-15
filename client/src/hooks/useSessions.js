import { useState, useEffect, useCallback } from 'react';
import { sessionApi } from '../api/services';

export const useSessions = (params = {}) => {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await sessionApi.getMine(params);
      setSessions(res.data.sessions);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  return { sessions, loading, error, refetch: fetchSessions };
};

export const useSession = (id) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchSession = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await sessionApi.getById(id);
      setSession(res.data.session);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  return { session, setSession, loading, error, refetch: fetchSession };
};

export const useSessionNotes = (sessionId) => {
  const [notes,   setNotes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchNotes = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await sessionApi.getNotes(sessionId);
      setNotes(res.data.notes);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  return { notes, setNotes, loading, error, refetch: fetchNotes };
};
