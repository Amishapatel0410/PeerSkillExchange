import { useState } from 'react';
import { sessionApi } from '../../api/services';

const ProgressNotes = ({ sessionId, notes, onNoteAdded, isParticipant }) => {
  const [content,    setContent]    = useState('');
  const [milestones, setMilestones] = useState([{ title: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);
  const [success,    setSuccess]    = useState(false);

  const handleMilestoneChange = (i, val) => {
    const updated = [...milestones];
    updated[i].title = val;
    setMilestones(updated);
  };

  const addMilestoneField = () => setMilestones([...milestones, { title: '' }]);
  const removeMilestoneField = (i) => {
    if (milestones.length === 1) return;
    setMilestones(milestones.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const validMilestones = milestones.filter((m) => m.title.trim());
      const res = await sessionApi.addNote(sessionId, {
        content: content.trim(),
        milestones: validMilestones,
      });
      onNoteAdded(res.data.note);
      setContent('');
      setMilestones([{ title: '' }]);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMilestone = async (note, milestone) => {
    try {
      const res = await sessionApi.toggleMilestone(
        sessionId,
        note._id,
        milestone._id,
        !milestone.completed
      );
      onNoteAdded(res.data.note, true); // true = update existing
    } catch (err) {
      console.error('Toggle failed', err);
    }
  };

  return (
    <div>
      {/* Existing notes */}
      {notes.length === 0 ? (
        <div className="empty-state" style={{ padding: '2rem' }}>
          <span className="empty-state-icon">📝</span>
          <h3>No progress notes yet</h3>
          <p>Add notes to track learning progress and milestones.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {notes.map((note) => (
            <div key={note._id} className="card" style={{ padding: '1rem', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div className="avatar avatar-sm avatar-placeholder">
                    {note.authorId?.name?.charAt(0) || '?'}
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                    {note.authorId?.name}
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(note.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: note.milestones?.length ? '0.75rem' : 0 }}>
                {note.content}
              </p>
              {note.milestones?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>
                    Milestones
                  </div>
                  {note.milestones.map((m) => (
                    <div
                      key={m._id}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', cursor: isParticipant ? 'pointer' : 'default' }}
                      onClick={() => isParticipant && handleToggleMilestone(note, m)}
                    >
                      <span style={{ fontSize: '1rem' }}>{m.completed ? '✅' : '⬜'}</span>
                      <span style={{
                        fontSize: '0.85rem',
                        textDecoration: m.completed ? 'line-through' : 'none',
                        color: m.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                      }}>
                        {m.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add note form */}
      {isParticipant && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">✅ Note added!</div>}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Progress Note</label>
            <textarea
              id="note-content"
              className="form-textarea"
              placeholder="What did you learn? What did you work on?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              required
            />
          </div>
          <div>
            <label className="form-label">Milestones (optional)</label>
            {milestones.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <input
                  className="form-input"
                  placeholder={`Milestone ${i + 1}`}
                  value={m.title}
                  onChange={(e) => handleMilestoneChange(i, e.target.value)}
                />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeMilestoneField(i)} style={{ padding: '0 0.6rem' }}>
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="btn btn-ghost btn-sm" onClick={addMilestoneField}>
              + Add Milestone
            </button>
          </div>
          <button id="add-note-btn" type="submit" className="btn btn-primary" disabled={submitting || !content.trim()}>
            {submitting ? <><span className="spinner spinner-sm" /> Saving...</> : '📝 Add Progress Note'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ProgressNotes;
