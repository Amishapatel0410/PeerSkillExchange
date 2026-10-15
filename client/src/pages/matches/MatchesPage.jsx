import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchApi } from '../../api/services';
import { useReminders } from '../../hooks/useReminders';
import ReminderBanner from '../../components/common/ReminderBanner';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   emoji: '⏳', cls: 'badge-pending'   },
  accepted:  { label: 'Accepted',  emoji: '✅', cls: 'badge-accepted'  },
  declined:  { label: 'Declined',  emoji: '❌', cls: 'badge-declined'  },
  cancelled: { label: 'Cancelled', emoji: '🚫', cls: 'badge-cancelled' },
};

const MatchesPage = () => {
  const { user }               = useAuth();
  const { reminders, dismiss } = useReminders();
  const [matches,  setMatches]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [updating, setUpdating] = useState({});
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    matchApi.getMine()
      .then((res) => setMatches(res.data.matches))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load matches'))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusUpdate = async (matchId, status) => {
    setUpdating((p) => ({ ...p, [matchId]: true }));
    try {
      const res = await matchApi.updateStatus(matchId, status);
      setMatches((prev) => prev.map((m) => m._id === matchId ? res.data.match : m));
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setUpdating((p) => ({ ...p, [matchId]: false }));
    }
  };

  const initials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const filtered = activeTab === 'all' ? matches
    : matches.filter((m) => m.status === activeTab);

  const tabs = [
    { key: 'all',       label: 'All' },
    { key: 'pending',   label: 'Pending' },
    { key: 'accepted',  label: 'Accepted' },
    { key: 'declined',  label: 'Declined' },
  ];

  return (
    <div className="page">
      <div className="container">
        <ReminderBanner reminders={reminders} onDismiss={dismiss} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ marginBottom: '0.25rem' }}>🤝 My Matches</h1>
            <p>Manage your skill swap connections</p>
          </div>
          <Link to="/discover" className="btn btn-primary">+ Discover People</Link>
        </div>

        <div className="tabs">
          {tabs.map((t) => {
            const count = t.key === 'all' ? matches.length : matches.filter((m) => m.status === t.key).length;
            return (
              <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                {t.label} {count > 0 && <span style={{ marginLeft: '0.25rem', opacity: 0.7 }}>({count})</span>}
              </button>
            );
          })}
        </div>

        {loading && <div className="loading-page"><div className="spinner" /><p>Loading matches...</p></div>}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && filtered.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">🤝</span>
            <h3>No matches yet</h3>
            <p><Link to="/discover">Discover peers</Link> and send a connection request to get started.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((match) => {
            const isRequester = match.requester._id === user?._id;
            const otherUser   = isRequester ? match.receiver : match.requester;
            const cfg         = STATUS_CONFIG[match.status] || STATUS_CONFIG.pending;
            const busy        = updating[match._id];

            return (
              <div key={match._id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {/* Avatar */}
                <div className="avatar avatar-md avatar-placeholder">{initials(otherUser.name)}</div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                    <h3 style={{ fontSize: '1rem', margin: 0 }}>{otherUser.name}</h3>
                    <span className={`badge ${cfg.cls}`}>{cfg.emoji} {cfg.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <span>📤 <strong style={{ color: 'var(--brand-400)' }}>{match.skillOffered}</strong></span>
                    <span>↔</span>
                    <span>📥 <strong style={{ color: 'var(--accent-400)' }}>{match.skillWanted}</strong></span>
                    <span>· {formatDistanceToNow(new Date(match.updatedAt), { addSuffix: true })}</span>
                  </div>
                  {match.message && (
                    <p style={{ fontSize: '0.82rem', marginTop: '0.3rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                      "{match.message}"
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flexShrink: 0 }}>
                  {/* Receiver can accept/decline pending */}
                  {!isRequester && match.status === 'pending' && (
                    <>
                      <button
                        id={`accept-match-${match._id}`}
                        className="btn btn-success btn-sm"
                        disabled={busy}
                        onClick={() => handleStatusUpdate(match._id, 'accepted')}
                      >
                        {busy ? <span className="spinner spinner-sm" /> : '✅ Accept'}
                      </button>
                      <button
                        id={`decline-match-${match._id}`}
                        className="btn btn-danger btn-sm"
                        disabled={busy}
                        onClick={() => handleStatusUpdate(match._id, 'declined')}
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {/* Requester can cancel pending */}
                  {isRequester && match.status === 'pending' && (
                    <button
                      id={`cancel-match-${match._id}`}
                      className="btn btn-ghost btn-sm"
                      disabled={busy}
                      onClick={() => handleStatusUpdate(match._id, 'cancelled')}
                    >
                      Cancel
                    </button>
                  )}

                  {/* Accepted: chat + session buttons */}
                  {match.status === 'accepted' && (
                    <>
                      <Link to={`/chat/${match._id}`} className="btn btn-secondary btn-sm">💬 Chat</Link>
                      <Link to={`/sessions/new?matchId=${match._id}`} className="btn btn-primary btn-sm">📅 Schedule</Link>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MatchesPage;
