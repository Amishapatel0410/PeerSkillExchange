import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useSession, useSessionNotes } from '../../hooks/useSessions';
import { useAuth } from '../../context/AuthContext';
import { sessionApi } from '../../api/services';
import ProgressNotes from '../../components/sessions/ProgressNotes';
import AvailabilityOverlapPicker from '../../components/sessions/AvailabilityOverlapPicker';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   emoji: '⏳', color: 'var(--warning-400)' },
  scheduled: { label: 'Scheduled', emoji: '📅', color: 'var(--brand-400)'   },
  completed: { label: 'Completed', emoji: '✅', color: 'var(--success-400)' },
  cancelled: { label: 'Cancelled', emoji: '❌', color: 'var(--danger-400)'  },
};

const SessionDetailPage = () => {
  const { id }       = useParams();
  const { user }     = useAuth();
  const navigate     = useNavigate();

  const { session, setSession, loading, error, refetch } = useSession(id);
  const { notes, setNotes, loading: notesLoading }       = useSessionNotes(id);

  const [scheduleForm, setScheduleForm] = useState({ scheduledDateTime: '', duration: '' });
  const [scheduling,   setScheduling]   = useState(false);
  const [schedErr,     setSchedErr]     = useState(null);
  const [statusErr,    setStatusErr]    = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [copied,       setCopied]       = useState(false);
  const [activeTab,    setActiveTab]    = useState('details');

  if (loading) return <div className="loading-page"><div className="spinner" /><p>Loading session...</p></div>;
  if (error)   return <div className="page"><div className="container"><div className="alert alert-error">{error} <Link to="/sessions">← Back</Link></div></div></div>;
  if (!session) return null;

  const isParticipant = session.participants?.some((p) => p._id === user?._id);
  const cfg           = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending;
  const otherParticipant = session.participants?.find((p) => p._id !== user?._id);
  const matchIdStr    = typeof session.matchId === 'object' ? session.matchId?._id : session.matchId;

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleForm.scheduledDateTime) return;
    setScheduling(true);
    setSchedErr(null);
    try {
      const res = await sessionApi.schedule(id, {
        scheduledDateTime: scheduleForm.scheduledDateTime,
        duration: scheduleForm.duration ? Number(scheduleForm.duration) : session.duration,
      });
      setSession(res.data.session);
    } catch (err) {
      setSchedErr(err.response?.data?.message || 'Failed to schedule session');
    } finally {
      setScheduling(false);
    }
  };

  const handleStatusChange = async (status) => {
    setUpdatingStatus(true);
    setStatusErr(null);
    try {
      const res = await sessionApi.updateStatus(id, status);
      setSession(res.data.session);
    } catch (err) {
      setStatusErr(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const copyMeetingLink = () => {
    navigator.clipboard.writeText(session.meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNoteAdded = (newNote, isUpdate = false) => {
    if (isUpdate) {
      setNotes((prev) => prev.map((n) => n._id === newNote._id ? newNote : n));
    } else {
      setNotes((prev) => [...prev, newNote]);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          <Link to="/sessions" style={{ color: 'var(--text-muted)' }}>Sessions</Link>
          {' / '}
          <span style={{ color: 'var(--text-primary)' }}>{session.title || 'Session Details'}</span>
        </div>

        {/* Header card */}
        <div className="card" style={{ marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.05) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>{session.title || 'Skill Exchange Session'}</h2>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.9rem' }}>
                <span style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--brand-400)', padding: '0.2rem 0.7rem', borderRadius: '4px', fontWeight: '600' }}>
                  📤 {session.skillOffered}
                </span>
                <span style={{ color: 'var(--text-muted)' }}>↔</span>
                <span style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--accent-400)', padding: '0.2rem 0.7rem', borderRadius: '4px', fontWeight: '600' }}>
                  📥 {session.skillWanted}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <span className={`badge badge-${session.status}`} style={{ fontSize: '0.85rem' }}>
                {cfg.emoji} {cfg.label}
              </span>
              {session.completedAt && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Completed {format(new Date(session.completedAt), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[
            { key: 'details',  label: '📋 Details'  },
            { key: 'notes',    label: `📝 Notes (${notes.length})` },
            { key: 'schedule', label: '📅 Scheduling' },
          ].map((t) => (
            <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── DETAILS TAB ── */}
        {activeTab === 'details' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {statusErr && <div className="alert alert-error">{statusErr}</div>}

            {/* Participant info */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>👥 Participants</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {session.participants?.map((p) => (
                  <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div className="avatar avatar-md avatar-placeholder">
                      {p.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                        {p.name} {p._id === user?._id && <span style={{ fontSize: '0.75rem', color: 'var(--brand-400)' }}>(you)</span>}
                      </div>
                      {p.rating > 0 && <div style={{ fontSize: '0.75rem', color: 'var(--warning-400)' }}>★ {p.rating.toFixed(1)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Schedule info */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>🕐 Schedule</h3>
              {session.scheduledDateTime ? (
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <div>
                    <div className="text-muted text-xs" style={{ textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Date</div>
                    <div style={{ fontWeight: '600' }}>{format(new Date(session.scheduledDateTime), 'EEEE, MMMM d, yyyy')}</div>
                  </div>
                  <div>
                    <div className="text-muted text-xs" style={{ textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Time</div>
                    <div style={{ fontWeight: '600' }}>{format(new Date(session.scheduledDateTime), 'h:mm a')}</div>
                  </div>
                  <div>
                    <div className="text-muted text-xs" style={{ textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>Duration</div>
                    <div style={{ fontWeight: '600' }}>{session.duration} minutes</div>
                  </div>
                </div>
              ) : (
                <div className="alert alert-info">⏳ Not yet scheduled. <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('schedule')}>Schedule now →</button></div>
              )}
            </div>

            {/* Meeting link */}
            {session.meetingLink && (
              <div className="card">
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>📹 Meeting Link</h3>
                {session.meetingLinkType === 'placeholder' && (
                  <div className="alert alert-warning" style={{ marginBottom: '0.75rem', fontSize: '0.82rem' }}>
                    ⚠️ <strong>Demo link only.</strong> This is a placeholder for demonstration purposes. In production, integrate Google Meet or Zoom (see <code>server/src/utils/meetingLink.js</code>).
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <code style={{ flex: 1, background: 'var(--bg-secondary)', padding: '0.6rem 0.9rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', wordBreak: 'break-all', color: 'var(--brand-400)' }}>
                    {session.meetingLink}
                  </code>
                  <button id="copy-meeting-link" className="btn btn-secondary btn-sm" onClick={copyMeetingLink}>
                    {copied ? '✅ Copied!' : '📋 Copy'}
                  </button>
                  <a href={session.meetingLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                    🚀 Join
                  </a>
                </div>
              </div>
            )}

            {/* Learning goals */}
            {session.learningGoals && (
              <div className="card">
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>🎯 Learning Goals</h3>
                <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{session.learningGoals}</p>
              </div>
            )}

            {/* Status actions */}
            {isParticipant && (session.status === 'scheduled' || session.status === 'pending') && (
              <div className="card" style={{ background: 'var(--bg-secondary)' }}>
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>⚡ Actions</h3>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {matchIdStr && (
                    <Link to={`/chat/${matchIdStr}`} className="btn btn-secondary">💬 Open Chat</Link>
                  )}
                  {session.status === 'scheduled' && (
                    <button
                      id="complete-session-btn"
                      className="btn btn-success"
                      disabled={updatingStatus}
                      onClick={() => handleStatusChange('completed')}
                    >
                      {updatingStatus ? <span className="spinner spinner-sm" /> : '✅ Mark Completed'}
                    </button>
                  )}
                  <button
                    id="cancel-session-btn"
                    className="btn btn-danger"
                    disabled={updatingStatus}
                    onClick={() => handleStatusChange('cancelled')}
                  >
                    {updatingStatus ? <span className="spinner spinner-sm" /> : '❌ Cancel Session'}
                  </button>
                </div>
              </div>
            )}

            {/* Post-completion review prompt */}
            {session.status === 'completed' && isParticipant && otherParticipant && (
              <div className="alert alert-success">
                🎉 Session completed! Leave a review for <strong>{otherParticipant.name}</strong>.{' '}
                <em>(Review feature coming in Member D's module)</em>
              </div>
            )}
          </div>
        )}

        {/* ── NOTES TAB ── */}
        {activeTab === 'notes' && (
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>📝 Progress Notes & Milestones</h3>
            {notesLoading ? (
              <div className="loading-page" style={{ minHeight: 150 }}><div className="spinner" /></div>
            ) : (
              <ProgressNotes
                sessionId={id}
                notes={notes}
                onNoteAdded={handleNoteAdded}
                isParticipant={isParticipant}
              />
            )}
          </div>
        )}

        {/* ── SCHEDULE TAB ── */}
        {activeTab === 'schedule' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Availability */}
            {matchIdStr && (
              <div className="card">
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>🗓️ Shared Availability</h3>
                <AvailabilityOverlapPicker matchId={matchIdStr} />
              </div>
            )}

            {/* Schedule form */}
            {session.status === 'pending' && isParticipant && (
              <div className="card">
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>📅 Confirm Date & Time</h3>
                {schedErr && <div className="alert alert-error">{schedErr}</div>}
                <form onSubmit={handleSchedule}>
                  <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="sched-datetime">Date & Time *</label>
                      <input
                        id="sched-datetime"
                        type="datetime-local"
                        className="form-input"
                        value={scheduleForm.scheduledDateTime}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledDateTime: e.target.value })}
                        min={new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)}
                        required
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" htmlFor="sched-duration">Duration (minutes)</label>
                      <select
                        id="sched-duration"
                        className="form-select"
                        value={scheduleForm.duration || session.duration}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, duration: e.target.value })}
                      >
                        {[30, 45, 60, 90, 120].map((d) => (
                          <option key={d} value={d}>{d} min</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="alert alert-info" style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
                    ℹ️ A meeting link will be generated automatically when you confirm.
                    {' '}Currently using <strong>placeholder links</strong> (see .env for real integration).
                  </div>
                  <button
                    id="confirm-schedule-btn"
                    type="submit"
                    className="btn btn-primary"
                    disabled={scheduling || !scheduleForm.scheduledDateTime}
                  >
                    {scheduling ? <><span className="spinner spinner-sm" /> Scheduling...</> : '📅 Confirm Schedule & Generate Link'}
                  </button>
                </form>
              </div>
            )}

            {session.status !== 'pending' && (
              <div className="alert alert-info">
                This session is <strong>{session.status}</strong> — scheduling is locked.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionDetailPage;
