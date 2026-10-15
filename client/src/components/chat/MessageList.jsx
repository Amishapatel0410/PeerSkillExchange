import { useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const FILE_ICONS = {
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'image/png':  '🖼️',
  'image/jpeg': '🖼️',
  'image/gif':  '🎞️',
  'image/webp': '🖼️',
};

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const MessageBubble = ({ msg, isOwn }) => {
  const hasAttachment = msg.type === 'file' && msg.attachment;
  const isImage = hasAttachment && msg.attachment.mimetype?.startsWith('image/');

  return (
    <div style={{
      display: 'flex',
      flexDirection: isOwn ? 'row-reverse' : 'row',
      gap: '0.5rem',
      alignItems: 'flex-end',
    }}>
      {/* Avatar */}
      {!isOwn && (
        <div className="avatar avatar-sm avatar-placeholder" style={{ flexShrink: 0 }}>
          {msg.senderId?.name?.charAt(0) || '?'}
        </div>
      )}

      <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
        {/* Sender name */}
        {!isOwn && (
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '0.5rem', fontWeight: '600' }}>
            {msg.senderId?.name}
          </span>
        )}

        {/* Bubble */}
        <div style={{
          background: isOwn
            ? 'linear-gradient(135deg, var(--brand-600), var(--accent-500))'
            : 'var(--bg-card-2)',
          color: 'var(--text-primary)',
          padding: '0.7rem 1rem',
          borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          boxShadow: 'var(--shadow-sm)',
        }}>
          {/* Text message */}
          {msg.message && (
            <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5', wordBreak: 'break-word' }}>
              {msg.message}
            </p>
          )}

          {/* File attachment */}
          {hasAttachment && (
            <div style={{ marginTop: msg.message ? '0.5rem' : 0 }}>
              {isImage ? (
                <a href={`${API_BASE}${msg.attachment.url}`} target="_blank" rel="noopener noreferrer">
                  <img
                    src={`${API_BASE}${msg.attachment.url}`}
                    alt={msg.attachment.originalName}
                    style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px', display: 'block' }}
                  />
                </a>
              ) : (
                <a
                  href={`${API_BASE}${msg.attachment.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    color: 'inherit',
                    textDecoration: 'none',
                  }}
                >
                  <span>{FILE_ICONS[msg.attachment.mimetype] || '📁'}</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', wordBreak: 'break-all' }}>
                      {msg.attachment.originalName}
                    </div>
                    <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>
                      {(msg.attachment.size / 1024).toFixed(1)} KB — click to download
                    </div>
                  </div>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span style={{
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          paddingLeft: isOwn ? 0 : '0.5rem',
          paddingRight: isOwn ? '0.5rem' : 0,
          alignSelf: isOwn ? 'flex-end' : 'flex-start',
        }}>
          {format(new Date(msg.createdAt), 'h:mm a')}
        </span>
      </div>
    </div>
  );
};

const MessageList = ({ messages, loading, error }) => {
  const { user }     = useAuth();
  const bottomRef    = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="loading-page" style={{ minHeight: 200 }}>
        <div className="spinner" />
        <p>Loading messages...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error" style={{ margin: '1rem' }}>{error}</div>;
  }

  if (messages.length === 0) {
    return (
      <div className="empty-state" style={{ minHeight: 200 }}>
        <span className="empty-state-icon">💬</span>
        <h3>No messages yet</h3>
        <p>Start the conversation with your skill swap partner!</p>
      </div>
    );
  }

  // Group messages by date
  const grouped = messages.reduce((acc, msg) => {
    const dateKey = format(new Date(msg.createdAt), 'MMMM d, yyyy');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
      {Object.entries(grouped).map(([date, msgs]) => (
        <div key={date}>
          {/* Date separator */}
          <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
            <span style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-secondary)',
              padding: '0.2rem 0.75rem',
              borderRadius: '999px',
            }}>
              {date}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {msgs.map((msg) => (
              <MessageBubble
                key={msg._id}
                msg={msg}
                isOwn={msg.senderId?._id === user?._id || msg.senderId === user?._id}
              />
            ))}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

export default MessageList;
