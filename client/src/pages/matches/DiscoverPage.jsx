import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchApi } from '../../api/services';
import { useReminders } from '../../hooks/useReminders';
import ReminderBanner from '../../components/common/ReminderBanner';

const DiscoverPage = () => {
  const [users,    setUsers]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [skill,    setSkill]    = useState('');
  const [search,   setSearch]   = useState('');
  const [sending,  setSending]  = useState({});
  const [sentMap,  setSentMap]  = useState({});
  const { reminders, dismiss }  = useReminders();

  const fetchUsers = async (s = '') => {
    setLoading(true);
    setError(null);
    try {
      const res = await matchApi.discover({ skill: s, limit: 20 });
      setUsers(res.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(skill); }, [skill]);

  const handleSendRequest = async (receiverId, skillOffered, skillWanted) => {
    setSending((p) => ({ ...p, [receiverId]: true }));
    try {
      await matchApi.create({ receiverId, skillOffered, skillWanted });
      setSentMap((p) => ({ ...p, [receiverId]: true }));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not send request');
    } finally {
      setSending((p) => ({ ...p, [receiverId]: false }));
    }
  };

  const initials = (name) => name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="page">
      <div className="container">
        <ReminderBanner reminders={reminders} onDismiss={dismiss} />

        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.5rem' }}>🔍 Discover Skills</h1>
          <p>Find people who can teach what you want to learn — and teach them something in return.</p>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <input
            id="discover-search"
            className="form-input"
            placeholder="Filter by skill (e.g. Python, Guitar)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setSkill(search)}
            style={{ maxWidth: '360px', flex: 1 }}
          />
          <button id="discover-filter-btn" className="btn btn-primary" onClick={() => setSkill(search)}>Search</button>
          {skill && <button className="btn btn-ghost" onClick={() => { setSkill(''); setSearch(''); }}>Clear</button>}
        </div>

        {loading && (
          <div className="loading-page"><div className="spinner" /><p>Finding peers...</p></div>
        )}
        {error && <div className="alert alert-error">{error}</div>}

        {!loading && users.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">👤</span>
            <h3>No users found</h3>
            <p>Try a different skill filter, or{' '}
              <Link to="/register">invite friends</Link> to join SkillSync!</p>
          </div>
        )}

        <div className="grid-3">
          {users.map((u) => (
            <div key={u._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="avatar avatar-lg avatar-placeholder">{initials(u.name)}</div>
                <div>
                  <h3 style={{ fontSize: '1rem', marginBottom: '0.1rem' }}>{u.name}</h3>
                  {u.location && <p style={{ fontSize: '0.8rem', margin: 0 }}>📍 {u.location}</p>}
                  {u.rating > 0 && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--warning-400)', fontWeight: '600' }}>
                      ★ {u.rating.toFixed(1)} ({u.reviewCount} reviews)
                    </span>
                  )}
                </div>
              </div>

              {u.bio && <p style={{ fontSize: '0.85rem', margin: 0 }}>{u.bio.slice(0, 100)}{u.bio.length > 100 ? '…' : ''}</p>}

              {/* Skills */}
              {u.skillsOffered?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Can Teach</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {u.skillsOffered.slice(0, 4).map((s) => (
                      <span key={s} style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--brand-400)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: '600' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {u.skillsWanted?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Wants to Learn</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                    {u.skillsWanted.slice(0, 4).map((s) => (
                      <span key={s} style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--accent-400)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: '600' }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action */}
              {sentMap[u._id] ? (
                <div className="alert alert-success" style={{ padding: '0.5rem', margin: 0, fontSize: '0.85rem' }}>✅ Request sent!</div>
              ) : (
                <button
                  id={`send-request-${u._id}`}
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 'auto' }}
                  disabled={sending[u._id]}
                  onClick={() => handleSendRequest(
                    u._id,
                    u.skillsOffered?.[0] || '',
                    u.skillsWanted?.[0] || ''
                  )}
                >
                  {sending[u._id] ? <><span className="spinner spinner-sm" /> Sending...</> : '🤝 Connect'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DiscoverPage;
