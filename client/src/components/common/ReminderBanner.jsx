import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';

/**
 * ReminderBanner — appears at the top of authenticated pages
 * when a session is within 24h.
 */
const ReminderBanner = ({ reminders, onDismiss }) => {
  if (!reminders || reminders.length === 0) return null;

  return (
    <div style={{ padding: '0 0 0.5rem' }}>
      {reminders.map((session) => {
        const timeUntil = formatDistanceToNow(new Date(session.scheduledDateTime), { addSuffix: true });
        const dateStr   = format(new Date(session.scheduledDateTime), 'MMM d, yyyy h:mm a');

        return (
          <div
            key={session._id}
            className="alert alert-warning"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}
          >
            <span>
              🔔 <strong>{session.title || 'Session'}</strong> starts <strong>{timeUntil}</strong> — {dateStr}
              {session.meetingLinkType === 'placeholder' && (
                <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', opacity: 0.7 }}>
                  (demo meeting link)
                </span>
              )}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Link
                to={`/sessions/${session._id}`}
                className="btn btn-sm btn-secondary"
                style={{ fontSize: '0.8rem' }}
              >
                View Session
              </Link>
              {session.meetingLink && (
                <a
                  href={session.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-primary"
                  style={{ fontSize: '0.8rem' }}
                >
                  Join Meeting
                </a>
              )}
              <button
                id={`dismiss-reminder-${session._id}`}
                className="btn btn-ghost btn-sm"
                onClick={() => onDismiss(session._id)}
                aria-label="Dismiss reminder"
                style={{ fontSize: '1rem', padding: '0.3rem 0.6rem' }}
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReminderBanner;
