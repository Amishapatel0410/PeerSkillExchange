import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   emoji: '⏳', cls: 'badge-pending'   },
  scheduled: { label: 'Scheduled', emoji: '📅', cls: 'badge-scheduled' },
  completed: { label: 'Completed', emoji: '✅', cls: 'badge-completed' },
  cancelled: { label: 'Cancelled', emoji: '❌', cls: 'badge-cancelled' },
};

const SessionCard = ({ session, onStatusChange }) => {
  const { user } = useAuth();
  const cfg      = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending;

  const otherParticipant = session.participants?.find(
    (p) => p._id !== user?._id
  );

  const initials = otherParticipant?.name
    ? otherParticipant.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="card session-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h3 style={{ marginBottom: '0.25rem', fontSize: '1rem' }}>
            {session.title || 'Skill Exchange Session'}
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--brand-400)', borderRadius: '4px', padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}>
              {session.skillOffered}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>↔</span>
            <span className="badge" style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--accent-400)', borderRadius: '4px', padding: '0.1rem 0.5rem', fontSize: '0.75rem' }}>
              {session.skillWanted}
            </span>
          </div>
        </div>
        <span className={`badge ${cfg.cls}`}>{cfg.emoji} {cfg.label}</span>
      </div>

      {/* Participant */}
      {otherParticipant && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div className="avatar avatar-sm avatar-placeholder">{initials}</div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            with <strong style={{ color: 'var(--text-primary)' }}>{otherParticipant.name}</strong>
          </span>
        </div>
      )}

      {/* Schedule info */}
      {session.scheduledDateTime && (
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date & Time</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
              {format(new Date(session.scheduledDateTime), 'MMM d, yyyy')}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {format(new Date(session.scheduledDateTime), 'h:mm a')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</div>
            <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{session.duration} min</div>
          </div>
          {session.status === 'scheduled' && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Starts</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--warning-400)', fontWeight: '600' }}>
                {formatDistanceToNow(new Date(session.scheduledDateTime), { addSuffix: true })}
              </div>
            </div>
          )}
        </div>
      )}

      {!session.scheduledDateTime && session.status === 'pending' && (
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⏳ Awaiting scheduling</p>
      )}

      {/* Meeting link preview */}
      {session.meetingLink && session.status === 'scheduled' && (
        <div style={{
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.5rem 0.8rem',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
        }}>
          📹 Meeting link available
          {session.meetingLinkType === 'placeholder' && ' (demo)'}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
        <Link to={`/sessions/${session._id}`} className="btn btn-primary btn-sm">
          View Details
        </Link>
        {session.matchId && (
          <Link to={`/chat/${typeof session.matchId === 'object' ? session.matchId._id : session.matchId}`} className="btn btn-secondary btn-sm">
            💬 Chat
          </Link>
        )}
      </div>
    </div>
  );
};

export default SessionCard;
