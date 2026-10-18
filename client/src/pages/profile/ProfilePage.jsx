import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { authApi, reviewApi } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const StarDisplay = ({ rating, size = '1rem' }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <span
        key={i}
        style={{
          fontSize: size,
          color: i <= Math.round(rating) ? 'var(--warning-400)' : 'var(--bg-card-2)',
          filter: i <= Math.round(rating) ? 'drop-shadow(0 0 3px rgba(251,191,36,0.4))' : 'none',
        }}
      >★</span>
    );
  }
  return <span style={{ display: 'inline-flex', gap: '1px' }}>{stars}</span>;
};

const ProfilePage = () => {
  const { id } = useParams();
  const { user: authUser } = useAuth();

  const [profile,  setProfile]  = useState(null);
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [activeTab, setActiveTab] = useState('about');

  const isOwnProfile = authUser?._id === id;

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      authApi.getUser(id),
      reviewApi.getForUser(id),
    ])
      .then(([userRes, reviewRes]) => {
        setProfile(userRes.data.user);
        setReviews(reviewRes.data.reviews);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-page"><div className="spinner" /><p>Loading profile...</p></div>;
  if (error)   return (
    <div className="page"><div className="container">
      <div className="alert alert-error">{error} <Link to="/">← Home</Link></div>
    </div></div>
  );
  if (!profile) return null;

  const initials = profile.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Hero card */}
        <div className="card" style={{
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative glow */}
          <div style={{
            position: 'absolute', top: '-60px', right: '-60px',
            width: '200px', height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Avatar */}
            {profile.avatar ? (
              <img
                src={`${import.meta.env.VITE_API_URL?.replace('/api', '')}${profile.avatar}`}
                alt={profile.name}
                className="avatar avatar-xl"
                style={{ border: '3px solid var(--brand-500)' }}
              />
            ) : (
              <div className="avatar avatar-xl avatar-placeholder" style={{ fontSize: '1.6rem', border: '3px solid var(--brand-500)' }}>
                {initials}
              </div>
            )}

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                <h1 style={{ margin: 0 }}>{profile.name}</h1>
                {profile.isAdmin && (
                  <span className="badge" style={{ background: 'rgba(251,191,36,0.2)', color: 'var(--warning-400)' }}>
                    🛡️ Admin
                  </span>
                )}
                {isOwnProfile && (
                  <span className="badge badge-scheduled">You</span>
                )}
              </div>

              {/* Rating */}
              {profile.reviewCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <StarDisplay rating={profile.rating} size="1.1rem" />
                  <span style={{ fontWeight: '700', color: 'var(--warning-400)' }}>{profile.rating.toFixed(1)}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    ({profile.reviewCount} review{profile.reviewCount !== 1 ? 's' : ''})
                  </span>
                </div>
              )}

              {profile.location && (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>
                  📍 {profile.location}
                </p>
              )}

              {profile.bio && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', margin: 0 }}>
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Actions */}
            {isOwnProfile && (
              <Link to="/settings" className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
                ✏️ Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {[
            { key: 'about',   label: '👤 About' },
            { key: 'reviews', label: `⭐ Reviews (${reviews.length})` },
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

        {/* ── ABOUT TAB ── */}
        {activeTab === 'about' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Skills Offered */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
                <span style={{ color: 'var(--brand-400)' }}>📤</span> Skills I Can Teach
              </h3>
              {profile.skillsOffered?.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {profile.skillsOffered.map((s, i) => (
                    <span key={i} style={{
                      background: 'rgba(99,102,241,0.15)',
                      color: 'var(--brand-400)',
                      padding: '0.35rem 0.9rem',
                      borderRadius: '999px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      border: '1px solid rgba(99,102,241,0.3)',
                    }}>{s}</span>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No skills listed yet.</p>
              )}
            </div>

            {/* Skills Wanted */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>
                <span style={{ color: 'var(--accent-400)' }}>📥</span> Skills I Want to Learn
              </h3>
              {profile.skillsWanted?.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {profile.skillsWanted.map((s, i) => (
                    <span key={i} style={{
                      background: 'rgba(139,92,246,0.15)',
                      color: 'var(--accent-400)',
                      padding: '0.35rem 0.9rem',
                      borderRadius: '999px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      border: '1px solid rgba(139,92,246,0.3)',
                    }}>{s}</span>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No skills listed yet.</p>
              )}
            </div>

            {/* Availability */}
            {profile.availability?.length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>🗓️ Availability</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {profile.availability.map((slot, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '0.5rem 0.75rem',
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                    }}>
                      <span style={{ fontWeight: '600', color: 'var(--brand-400)', minWidth: '90px' }}>{slot.day}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {slot.startTime} – {slot.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="card">
              <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>📊 Stats</h3>
              <div className="grid-3" style={{ gap: '1rem' }}>
                {[
                  { label: 'Rating',   value: profile.reviewCount > 0 ? `${profile.rating.toFixed(1)} / 5` : '—', icon: '⭐' },
                  { label: 'Reviews',  value: profile.reviewCount,                                                  icon: '💬' },
                  { label: 'Badges',   value: profile.badges?.length || 0,                                          icon: '🏅' },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{icon}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>{value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── REVIEWS TAB ── */}
        {activeTab === 'reviews' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reviews.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state-icon">⭐</span>
                <h3>No reviews yet</h3>
                <p>Reviews appear here after completed skill-swap sessions.</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div className="avatar avatar-sm avatar-placeholder" style={{ flexShrink: 0 }}>
                      {review.reviewerId?.name?.charAt(0) || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                          {review.reviewerId?.name || 'Anonymous'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <StarDisplay rating={review.rating} size="0.9rem" />
                      {review.comment && (
                        <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          "{review.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
