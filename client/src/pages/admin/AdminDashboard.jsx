import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { sessionApi, reviewApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';

const StarDisplay = ({ rating, size = '0.85rem' }) => (
  <span style={{ display: 'inline-flex', gap: '1px' }}>
    {[1,2,3,4,5].map((s) => (
      <span
        key={s}
        style={{
          fontSize: size,
          color: s <= Math.round(rating) ? 'var(--warning-400)' : 'var(--bg-card-2)',
        }}
      >★</span>
    ))}
  </span>
);

const STATUS_COLORS = {
  pending:   { badge: 'badge-pending',   label: 'Pending'   },
  scheduled: { badge: 'badge-scheduled', label: 'Scheduled' },
  completed: { badge: 'badge-completed', label: 'Completed' },
  cancelled: { badge: 'badge-cancelled', label: 'Cancelled' },
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab,   setActiveTab]   = useState('sessions');

  // Sessions state
  const [sessions, setSessions]     = useState([]);
  const [sessPage, setSessPage]     = useState(1);
  const [sessTotalPages, setSessTotalPages] = useState(1);
  const [sessStatus, setSessStatus] = useState('');
  const [sessLoading, setSessLoading] = useState(false);
  const [sessError,   setSessError]   = useState(null);

  // Reviews state
  const [reviews, setReviews]       = useState([]);
  const [revPage,  setRevPage]      = useState(1);
  const [revTotalPages, setRevTotalPages] = useState(1);
  const [revLoading, setRevLoading] = useState(false);
  const [revError,   setRevError]   = useState(null);

  // Fetch sessions
  const loadSessions = useCallback(async (page, status) => {
    setSessLoading(true);
    setSessError(null);
    try {
      const params = { page, limit: 15 };
      if (status) params.status = status;
      const res = await sessionApi.adminGetAll(params);
      setSessions(res.data.sessions);
      setSessTotalPages(res.data.pages || 1);
    } catch (err) {
      setSessError(err.response?.data?.message || 'Failed to load sessions');
    } finally {
      setSessLoading(false);
    }
  }, []);

  // Fetch reviews
  const loadReviews = useCallback(async (page) => {
    setRevLoading(true);
    setRevError(null);
    try {
      const res = await reviewApi.adminGetAll({ page, limit: 15 });
      setReviews(res.data.reviews);
      setRevTotalPages(res.data.pages || 1);
    } catch (err) {
      setRevError(err.response?.data?.message || 'Failed to load reviews');
    } finally {
      setRevLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'sessions') loadSessions(sessPage, sessStatus);
  }, [activeTab, sessPage, sessStatus, loadSessions]);

  useEffect(() => {
    if (activeTab === 'reviews') loadReviews(revPage);
  }, [activeTab, revPage, loadReviews]);

  if (!user?.isAdmin) {
    return (
      <div className="page">
        <div className="container">
          <div className="alert alert-error">
            🚫 Access denied. This page is for administrators only.{' '}
            <Link to="/">← Go home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1.8rem' }}>🛡️</span>
            <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
          </div>
          <p style={{ color: 'var(--text-muted)' }}>
            Monitor all platform activity — sessions, reviews, and more.
          </p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[
            { key: 'sessions', label: '📅 All Sessions' },
            { key: 'reviews',  label: '⭐ All Reviews'  },
          ].map((t) => (
            <button
              key={t.key}
              className={`tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── SESSIONS TAB ── */}
        {activeTab === 'sessions' && (
          <div>
            {/* Filter bar */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Filter:</label>
              {['', 'pending', 'scheduled', 'completed', 'cancelled'].map((s) => (
                <button
                  key={s || 'all'}
                  className={`btn btn-sm ${sessStatus === s ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setSessStatus(s); setSessPage(1); }}
                >
                  {s || 'All'}
                </button>
              ))}
            </div>

            {sessLoading && <div className="loading-page" style={{ minHeight: 200 }}><div className="spinner" /></div>}
            {sessError  && <div className="alert alert-error">{sessError}</div>}

            {!sessLoading && sessions.length === 0 && (
              <div className="empty-state">
                <span className="empty-state-icon">📅</span>
                <h3>No sessions found</h3>
              </div>
            )}

            {!sessLoading && sessions.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sessions.map((s) => {
                  const cfg = STATUS_COLORS[s.status] || STATUS_COLORS.pending;
                  return (
                    <div key={s._id} className="card" style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                            <Link
                              to={`/sessions/${s._id}`}
                              style={{ fontWeight: '600', color: 'var(--text-primary)' }}
                            >
                              {s.title || 'Untitled Session'}
                            </Link>
                            <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            <span>
                              👥 {s.participants?.map((p) => p.name).join(' & ') || '—'}
                            </span>
                            {s.scheduledDateTime && (
                              <span>
                                📅 {format(new Date(s.scheduledDateTime), 'MMM d, yyyy h:mm a')}
                              </span>
                            )}
                            <span>🕐 {s.duration} min</span>
                            <span style={{ color: 'var(--text-muted)', opacity: 0.7 }}>
                              Created {formatDistanceToNow(new Date(s.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <Link
                          to={`/sessions/${s._id}`}
                          className="btn btn-ghost btn-sm"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {sessTotalPages > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={sessPage === 1}
                  onClick={() => setSessPage((p) => p - 1)}
                >← Prev</button>
                <span style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {sessPage} / {sessTotalPages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={sessPage === sessTotalPages}
                  onClick={() => setSessPage((p) => p + 1)}
                >Next →</button>
              </div>
            )}
          </div>
        )}

        {/* ── REVIEWS TAB ── */}
        {activeTab === 'reviews' && (
          <div>
            {revLoading && <div className="loading-page" style={{ minHeight: 200 }}><div className="spinner" /></div>}
            {revError   && <div className="alert alert-error">{revError}</div>}

            {!revLoading && reviews.length === 0 && (
              <div className="empty-state">
                <span className="empty-state-icon">⭐</span>
                <h3>No reviews yet</h3>
              </div>
            )}

            {!revLoading && reviews.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {reviews.map((r) => (
                  <div key={r._id} className="card" style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                          <StarDisplay rating={r.rating} />
                          <span style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                            {r.reviewerId?.name || '?'} → {r.revieweeId?.name || '?'}
                          </span>
                        </div>
                        {r.comment && (
                          <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            "{r.comment}"
                          </p>
                        )}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          {r.sessionId && (
                            <span>
                              Session: <Link to={`/sessions/${r.sessionId._id}`} style={{ color: 'var(--brand-400)' }}>
                                {r.sessionId.title || r.sessionId._id}
                              </Link>
                            </span>
                          )}
                          <span>{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        {r.reviewerId?._id && (
                          <Link to={`/profile/${r.reviewerId._id}`} className="btn btn-ghost btn-sm">
                            Reviewer
                          </Link>
                        )}
                        {r.revieweeId?._id && (
                          <Link to={`/profile/${r.revieweeId._id}`} className="btn btn-ghost btn-sm">
                            Reviewee
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {revTotalPages > 1 && (
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={revPage === 1}
                  onClick={() => setRevPage((p) => p - 1)}
                >← Prev</button>
                <span style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  {revPage} / {revTotalPages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={revPage === revTotalPages}
                  onClick={() => setRevPage((p) => p + 1)}
                >Next →</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
