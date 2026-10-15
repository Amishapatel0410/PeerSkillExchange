import { useState, useRef } from 'react';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

const MessageInput = ({ onSend, sending, disabled }) => {
  const [text,     setText]     = useState('');
  const [file,     setFile]     = useState(null);
  const [fileErr,  setFileErr]  = useState(null);
  const [sendErr,  setSendErr]  = useState(null);
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    setFileErr(null);
    if (!f) { setFile(null); return; }

    if (!ALLOWED_TYPES.includes(f.type)) {
      setFileErr('Unsupported type. Allowed: PDF, DOC, DOCX, PNG, JPG, GIF, WEBP');
      e.target.value = '';
      return;
    }
    if (f.size > MAX_SIZE) {
      setFileErr('File too large (max 10 MB)');
      e.target.value = '';
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !file) || sending || disabled) return;
    setSendErr(null);
    try {
      await onSend(text, file);
      setText('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setSendErr(err.response?.data?.message || 'Failed to send message');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ borderTop: '1px solid var(--border)', padding: '1rem' }}>
      {/* File preview */}
      {file && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem',
          background: 'var(--bg-card-2)',
          padding: '0.4rem 0.75rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
        }}>
          <span>📎 {file.name}</span>
          <span style={{ color: 'var(--text-muted)' }}>({(file.size / 1024).toFixed(1)} KB)</span>
          <button
            type="button"
            onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--danger-400)', cursor: 'pointer', fontSize: '1rem' }}
          >
            ×
          </button>
        </div>
      )}

      {/* Errors */}
      {fileErr && <div className="alert alert-error" style={{ marginBottom: '0.5rem', padding: '0.5rem 0.75rem' }}>{fileErr}</div>}
      {sendErr && <div className="alert alert-error" style={{ marginBottom: '0.5rem', padding: '0.5rem 0.75rem' }}>{sendErr}</div>}

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        {/* File upload button */}
        <input
          ref={fileRef}
          id="chat-file-input"
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.gif,.webp"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button
          type="button"
          id="chat-attach-btn"
          className="btn btn-secondary btn-sm"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          title="Attach file (PDF, DOC, DOCX, PNG, JPG — max 10 MB)"
          style={{ height: '44px', width: '44px', padding: 0, justifyContent: 'center', flexShrink: 0 }}
        >
          📎
        </button>

        {/* Text input */}
        <textarea
          id="chat-message-input"
          className="form-textarea"
          placeholder={disabled ? 'Chat unavailable' : 'Type a message... (Enter to send, Shift+Enter for newline)'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          style={{
            resize: 'none',
            minHeight: '44px',
            maxHeight: '120px',
            overflow: 'auto',
            flex: 1,
          }}
        />

        {/* Send button */}
        <button
          id="chat-send-btn"
          type="submit"
          className="btn btn-primary"
          disabled={disabled || sending || (!text.trim() && !file)}
          style={{ height: '44px', flexShrink: 0 }}
        >
          {sending ? <span className="spinner spinner-sm" /> : '➤'}
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
