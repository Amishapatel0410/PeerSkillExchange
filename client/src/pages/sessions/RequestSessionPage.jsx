import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { sessionApi } from '../../api/services';
import AvailabilityOverlapPicker from '../../components/sessions/AvailabilityOverlapPicker';

const RequestSessionPage = () => {
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const matchId         = searchParams.get('matchId');

  const [form, setForm]       = useState({
    title: '',
    learningGoals: '',
    duration: 60,
    requestedDateTime: '',
  });
  const [error,     setError]     = useState(null);
  const [success,   setSuccess]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [created,   setCreated]   = useState(null);

  if (!matchId) {
    return (
      <div className="page">
        <div className="container">
          <div className="alert alert-error">
            No match selected. <Link to="/matches">Go to your matches</Link> and click "Schedule" on an accepted match.
          </div>
        </div>
      </div>
    );
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await sessionApi.create({
        matchId,
        title:             form.title || undefined,
        learningGoals:     form.learningGoals,
        duration:          Number(form.duration),
        requestedDateTime: form.requestedDateTime || undefined,
      });
      setCreated(res.data.session);
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create session';
      const existId = err.response?.data?.existingSessionId;
      if (existId) {
        navigate(`/sessions/${existId}`);
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success && created) {
    return (
      <div className="page">
        <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
            <h2>Session Request Created!</h2>
            <p>Your session has been created. Now schedule a specific date and time.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
              <Link to={`/sessions/${created._id}`} className="btn btn-primary btn-lg">
                📅 Schedule Date & Time →
              </Link>
              <Link to="/sessions" className="btn btn-secondary">View All Sessions</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <Link to="/matches" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>← Back to Matches</Link>
          <h1 style={{ marginTop: '0.5rem' }}>📅 Request a Session</h1>
          <p>Schedule a skill exchange session with your matched partner.</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Availability overlap */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>🗓️ Availability Overview</h3>
          <AvailabilityOverlapPicker matchId={matchId} />
        </div>

        {/* Session form */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Session Details</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="session-title">Session Title (optional)</label>
              <input
                id="session-title"
                name="title"
                className="form-input"
                placeholder="e.g. Python for Beginners – Week 1"
                value={form.title}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="session-goals">Learning Goals</label>
              <textarea
                id="session-goals"
                name="learningGoals"
                className="form-textarea"
                placeholder="What do you hope to accomplish in this session? What outcomes are you targeting?"
                value={form.learningGoals}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="session-datetime">Preferred Date & Time</label>
                <input
                  id="session-datetime"
                  name="requestedDateTime"
                  type="datetime-local"
                  className="form-input"
                  value={form.requestedDateTime}
                  onChange={handleChange}
                  min={new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16)}
                />
                <p className="form-error" style={{ color: 'var(--text-muted)', marginTop: '0.3rem' }}>You can confirm the exact time on the next step.</p>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="session-duration">Duration (minutes)</label>
                <select id="session-duration" name="duration" className="form-select" value={form.duration} onChange={handleChange}>
                  {[30, 45, 60, 90, 120].map((d) => (
                    <option key={d} value={d}>{d} minutes{d === 60 ? ' (recommended)' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              id="request-session-btn"
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: '1.5rem' }}
              disabled={submitting}
            >
              {submitting ? <><span className="spinner spinner-sm" /> Creating session...</> : '🚀 Create Session Request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestSessionPage;
