import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { matchApi } from '../../api/services';
import { useChat } from '../../hooks/useChat';
import MessageList from '../../components/chat/MessageList';
import MessageInput from '../../components/chat/MessageInput';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';

const ChatPage = () => {
  const { matchId }      = useParams();
  const { user }         = useAuth();
  const { connected }    = useSocket() || {};
  const { messages, loading, error, sending, sendMessage } = useChat(matchId);

  const [match,       setMatch]       = useState(null);
  const [matchErr,    setMatchErr]    = useState(null);
  const [matchLoading, setMatchLoading] = useState(true);

  useEffect(() => {
    if (!matchId) return;
    matchApi.getById(matchId)
      .then((res) => setMatch(res.data.match))
      .catch((err) => setMatchErr(err.response?.data?.message || 'Failed to load match'))
      .finally(() => setMatchLoading(false));
  }, [matchId]);

  const isAccepted  = match?.status === 'accepted';
  const otherUser   = match
    ? (match.requester._id === user?._id ? match.receiver : match.requester)
    : null;

  const initials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  if (matchLoading) {
    return <div className="loading-page"><div className="spinner" /><p>Loading chat...</p></div>;
  }

  return (
    <div style={{ height: 'calc(100vh - 70px)', display: 'flex', flexDirection: 'column' }}>
      {/* Chat header */}
      <div style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexShrink: 0,
      }}>
        <Link to="/matches" style={{ color: 'var(--text-muted)', fontSize: '1.2rem', lineHeight: 1 }}>←</Link>

        {otherUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <div className="avatar avatar-md avatar-placeholder">{initials(otherUser.name)}</div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '1rem' }}>{otherUser.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {match?.skillOffered} ↔ {match?.skillWanted}
                {match?.acceptedAt && ` · matched ${formatDistanceToNow(new Date(match.acceptedAt), { addSuffix: true })}`}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          {/* Real-time indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: connected ? 'var(--success-400)' : 'var(--text-muted)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? 'var(--success-400)' : 'var(--text-muted)', display: 'inline-block' }} />
            {connected ? 'Live' : 'Polling'}
          </div>

          {/* Session link */}
          <Link
            to={`/sessions/new?matchId=${matchId}`}
            className="btn btn-secondary btn-sm"
          >
            📅 Schedule Session
          </Link>
        </div>
      </div>

      {/* Match status gate */}
      {matchErr && (
        <div className="alert alert-error" style={{ margin: '1rem' }}>{matchErr}</div>
      )}

      {match && !isAccepted && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div className="empty-state">
            <span className="empty-state-icon">🔒</span>
            <h3>Chat unavailable</h3>
            <p>
              Chat is only enabled after both parties accept the match.
              {match.status === 'pending' && ' This match is still pending.'}
              {match.status === 'declined' && ' This match was declined.'}
              {match.status === 'cancelled' && ' This match was cancelled.'}
            </p>
            <Link to="/matches" className="btn btn-primary" style={{ marginTop: '1rem' }}>View My Matches</Link>
          </div>
        </div>
      )}

      {isAccepted && (
        <>
          {/* Messages area */}
          <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-primary)' }}>
            <MessageList messages={messages} loading={loading} error={error} />
          </div>

          {/* Input area */}
          <div style={{ flexShrink: 0, background: 'var(--bg-secondary)' }}>
            <MessageInput onSend={sendMessage} sending={sending} disabled={!isAccepted} />
            <div style={{ padding: '0.3rem 1rem 0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              📎 Attach PDF, DOC, DOCX, PNG, JPG (max 10 MB) · Enter to send · Shift+Enter for new line
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatPage;
