import { useState, useEffect } from 'react';
import { sessionApi } from '../../api/services';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

/**
 * AvailabilityOverlapPicker
 * Displays both participants' availability and highlights overlapping slots.
 * Allows selecting a day/time from within the overlap for scheduling.
 */
const AvailabilityOverlapPicker = ({ matchId, onSelect, selectedDate }) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!matchId) return;
    setLoading(true);
    sessionApi.getOverlap(matchId)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load availability'))
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) return <div className="loading-page" style={{ minHeight: 120 }}><div className="spinner-sm spinner" /><span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading availability...</span></div>;
  if (error)   return <div className="alert alert-error">{error}</div>;
  if (!data)   return null;

  const { overlaps, participants } = data;

  return (
    <div>
      {/* Participants availability */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {participants?.map((p) => (
          <div key={p.id} className="card" style={{ padding: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
              📅 {p.name}'s Availability
            </h4>
            {p.availability?.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No availability set</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {DAYS.map((day) => {
                  const slots = p.availability?.filter((s) => s.day === day) || [];
                  if (!slots.length) return null;
                  return (
                    <div key={day} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem' }}>
                      <span style={{ width: '80px', color: 'var(--text-muted)', fontWeight: '600' }}>{day.slice(0,3)}</span>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        {slots.map((s, i) => (
                          <span key={i} style={{
                            background: 'rgba(99,102,241,0.1)',
                            color: 'var(--brand-400)',
                            padding: '0.1rem 0.5rem',
                            borderRadius: '4px',
                          }}>
                            {s.startTime}–{s.endTime}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Overlapping slots */}
      <div>
        <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '0.75rem', color: 'var(--success-400)' }}>
          ✅ Shared Availability (overlapping windows)
        </h4>
        {overlaps.length === 0 ? (
          <div className="alert alert-warning">
            No overlapping availability found. You can still schedule a session — the time won't be validated against availability.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {overlaps.map((slot, i) => (
              <span key={i} style={{
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: 'var(--success-400)',
                padding: '0.3rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: '600',
              }}>
                {slot.day} {slot.startTime}–{slot.endTime}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityOverlapPicker;
