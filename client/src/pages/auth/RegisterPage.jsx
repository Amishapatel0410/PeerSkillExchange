import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [step, setStep]   = useState(1); // 1=basics, 2=skills+availability
  const [form, setForm]   = useState({
    name: '', email: '', password: '',
    bio: '', location: '',
    skillsOffered: '', skillsWanted: '',
    availability: [],
  });
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleAvailability = (day, startTime, endTime) => {
    const existing = form.availability.findIndex((s) => s.day === day && s.startTime === startTime);
    if (existing >= 0) {
      setForm({ ...form, availability: form.availability.filter((_, i) => i !== existing) });
    } else {
      setForm({ ...form, availability: [...form.availability, { day, startTime, endTime }] });
    }
  };

  const isSlotSelected = (day, start) =>
    form.availability.some((s) => s.day === day && s.startTime === start);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({
        name:          form.name,
        email:         form.email,
        password:      form.password,
        bio:           form.bio,
        location:      form.location,
        skillsOffered: form.skillsOffered.split(',').map((s) => s.trim()).filter(Boolean),
        skillsWanted:  form.skillsWanted.split(',').map((s) => s.trim()).filter(Boolean),
        availability:  form.availability,
      });
      navigate('/sessions');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const TIME_SLOTS = [
    { start: '06:00', end: '09:00', label: '6–9 AM' },
    { start: '09:00', end: '12:00', label: '9 AM–12 PM' },
    { start: '12:00', end: '15:00', label: '12–3 PM' },
    { start: '15:00', end: '18:00', label: '3–6 PM' },
    { start: '18:00', end: '21:00', label: '6–9 PM' },
    { start: '21:00', end: '23:59', label: '9 PM–midnight' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', background: 'radial-gradient(ellipse at 40% 30%, rgba(139,92,246,0.1) 0%, transparent 60%)' }}>
      <div style={{ width: '100%', maxWidth: '560px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', background: 'linear-gradient(135deg, var(--brand-400), var(--accent-400))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Join SkillSync
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>Exchange skills with peers worldwide</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[1, 2].map((s) => (
            <div key={s} style={{
              width: '32px', height: '4px', borderRadius: '2px',
              background: s <= step ? 'var(--brand-500)' : 'var(--bg-card-2)',
              transition: 'var(--transition)',
            }} />
          ))}
        </div>

        <div className="card-glass" style={{ padding: '2rem' }}>
          {error && <div className="alert alert-error">{error}</div>}

          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <h3 style={{ marginBottom: '1.2rem', color: 'var(--text-secondary)' }}>Step 1: Your Account</h3>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">Full Name</label>
                <input id="reg-name" name="name" className="form-input" placeholder="Alex Johnson" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">Email</label>
                <input id="reg-email" name="email" type="email" className="form-input" placeholder="alex@example.com" value={form.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-password">Password</label>
                <input id="reg-password" name="password" type="password" className="form-input" placeholder="At least 6 characters" value={form.password} onChange={handleChange} required minLength={6} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-location">Location (optional)</label>
                <input id="reg-location" name="location" className="form-input" placeholder="Mumbai, India" value={form.location} onChange={handleChange} />
              </div>
              <button id="reg-next-btn" type="submit" className="btn btn-primary btn-full btn-lg" style={{ marginTop: '0.5rem' }}>
                Continue →
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <h3 style={{ marginBottom: '1.2rem', color: 'var(--text-secondary)' }}>Step 2: Skills & Availability</h3>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-skills-offered">Skills You Can Teach</label>
                <input id="reg-skills-offered" name="skillsOffered" className="form-input" placeholder="Python, Guitar, Spanish (comma-separated)" value={form.skillsOffered} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-skills-wanted">Skills You Want to Learn</label>
                <input id="reg-skills-wanted" name="skillsWanted" className="form-input" placeholder="React, Piano, French (comma-separated)" value={form.skillsWanted} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Availability (select your free slots)</label>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {DAYS.map((day) => (
                    <div key={day} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ width: '85px', fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-muted)', flexShrink: 0 }}>{day}</span>
                      {TIME_SLOTS.map((slot) => {
                        const selected = isSlotSelected(day, slot.start);
                        return (
                          <button
                            key={slot.start}
                            type="button"
                            onClick={() => toggleAvailability(day, slot.start, slot.end)}
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '4px',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              border: '1px solid',
                              borderColor: selected ? 'var(--brand-500)' : 'var(--border)',
                              background: selected ? 'rgba(99,102,241,0.2)' : 'transparent',
                              color: selected ? 'var(--brand-400)' : 'var(--text-muted)',
                              fontFamily: 'inherit',
                              transition: 'var(--transition)',
                            }}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button id="reg-submit-btn" type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? <><span className="spinner spinner-sm" /> Creating account...</> : '🚀 Create Account'}
                </button>
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--brand-400)', fontWeight: '600' }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
