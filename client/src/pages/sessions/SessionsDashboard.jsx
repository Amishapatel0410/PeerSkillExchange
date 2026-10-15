import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSessions } from '../../hooks/useSessions';
import { useReminders } from '../../hooks/useReminders';
import SessionCard from '../../components/sessions/SessionCard';
import ReminderBanner from '../../components/common/ReminderBanner';

const TABS = [
  { key: 'all',       label: '📋 All'        },
  { key: 'pending',   label: '⏳ Pending'     },
  { key: 'scheduled', label: '📅 Scheduled'   },
  { key: 'completed', label: '✅ Completed'   },
  { key: 'cancelled', label: '❌ Cancelled'   },
];

const SessionsDashboard = () => {
  const [activeTab, setActiveTab] = useState('all');
  const { reminders, dismiss }    = useReminders();
  const { sessions, loading, error, refetch } = useSessions(
    activeTab !== 'all' ? { status: activeTab } : {}
  );

  return (
    <div className="page">
      <div className="container">
        <ReminderBanner reminders={reminders} onDismiss={dismiss} />

        {/* Hero */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div>
            <h1 style={{ marginBottom: '0.3rem' }}>📅 My Sessions</h1>
            <p>Track your skill exchange sessions — upcoming, past, and in progress.</p>
          </div>
          <Link to="/matches" className="btn btn-primary btn-lg">
            + Schedule a Session
          </Link>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="grid-3" style={{ marginBottom: '2rem' }}>
            {[
              { key: 'scheduled', label: 'Upcoming',  emoji: '📅', color: 'var(--brand-400)' },
              { key: 'completed', label: 'Completed', emoji: '✅', color: 'var(--success-400)' },
              { key: 'pending',   label: 'Pending',   emoji: '⏳', color: 'var(--warning-400)' },
            ].map(({ key, label, emoji, color }) => {
              const count = sessions.filter((s) => s.status === key).length;
              return (
                <div key={key} className="card" style={{ textAlign: 'center', padding: '1.2rem', cursor: 'pointer' }} onClick={() => setActiveTab(key)}>
                  <div style={{ fontSize: '1.8rem', marginBottom: '0.25rem' }}>{emoji}</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '800', color, fontFamily: 'Outfit, sans-serif' }}>{count}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>{label}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tabs */}
        <div className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading && <div className="loading-page"><div className="spinner" /><p>Loading sessions...</p></div>}
        {error   && <div className="alert alert-error">{error}</div>}

        {!loading && sessions.length === 0 && (
          <div className="empty-state">
            <span className="empty-state-icon">📅</span>
            <h3>No {activeTab !== 'all' ? activeTab : ''} sessions yet</h3>
            <p>
              {activeTab === 'all'
                ? 'Accept a match and schedule your first session to start learning!'
                : `No ${activeTab} sessions found.`}
            </p>
            <Link to="/matches" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Go to My Matches →
            </Link>
          </div>
        )}

        <div className="grid-2" style={{ gap: '1rem' }}>
          {sessions.map((session) => (
            <SessionCard key={session._id} session={session} onStatusChange={refetch} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SessionsDashboard;
