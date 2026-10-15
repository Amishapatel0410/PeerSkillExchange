import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  { emoji: '🤝', title: 'Peer Matching', desc: 'Connect with people who teach what you want to learn — and learn what they want to teach.' },
  { emoji: '📅', title: 'Session Scheduling', desc: 'Book sessions that fit both schedules. Availability overlap shown automatically.' },
  { emoji: '💬', title: 'Real-Time Chat', desc: 'Communicate with your partner before, during, and after sessions. Share files seamlessly.' },
  { emoji: '📝', title: 'Progress Tracking', desc: 'Log session notes, set milestones, and mark your learning achievements.' },
  { emoji: '📹', title: 'Meeting Links', desc: 'Jump straight into your session with a generated meeting link.' },
  { emoji: '🔔', title: 'Smart Reminders', desc: 'Never miss a session. In-app reminders keep you on track automatically.' },
];

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero */}
      <section style={{
        padding: '6rem 1.5rem 5rem',
        textAlign: 'center',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.2) 0%, transparent 70%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '10%', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(99,102,241,0.12)',
            border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '999px',
            padding: '0.35rem 1rem',
            fontSize: '0.85rem',
            fontWeight: '600',
            color: 'var(--brand-400)',
            marginBottom: '1.5rem',
            letterSpacing: '0.03em',
          }}>
            ✨ Peer-to-Peer Skill Swapping Platform
          </div>

          <h1 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: 'clamp(2.5rem, 6vw, 4rem)',
            fontWeight: '800',
            lineHeight: 1.1,
            marginBottom: '1.5rem',
            maxWidth: '800px',
            margin: '0 auto 1.5rem',
          }}>
            Trade Skills,{' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--brand-400), var(--accent-400))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Grow Together
            </span>
          </h1>

          <p style={{ fontSize: '1.15rem', maxWidth: '600px', margin: '0 auto 2.5rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            SkillSync connects you with motivated peers for one-on-one skill exchanges.
            Teach what you know, learn what you love — no money needed.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <>
                <Link to="/sessions" className="btn btn-primary btn-lg">📅 My Sessions</Link>
                <Link to="/discover" className="btn btn-secondary btn-lg">🔍 Discover Peers</Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary btn-lg">🚀 Get Started — Free</Link>
                <Link to="/login"    className="btn btn-secondary btn-lg">Sign In</Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '0.75rem' }}>Everything you need to swap skills</h2>
        <p style={{ textAlign: 'center', marginBottom: '3rem', color: 'var(--text-muted)' }}>
          A complete platform built for meaningful peer-to-peer learning.
        </p>
        <div className="grid-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{f.emoji}</div>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.05rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          margin: '0 1.5rem 5rem',
          padding: '4rem 2rem',
          textAlign: 'center',
          maxWidth: '1200px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          <h2 style={{ marginBottom: '0.75rem' }}>Ready to start swapping?</h2>
          <p style={{ marginBottom: '2rem' }}>Join thousands of learners and teachers on SkillSync.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Your Free Account →
          </Link>
        </section>
      )}
    </div>
  );
};

export default LandingPage;
