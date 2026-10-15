import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useReminders } from '../../hooks/useReminders';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { reminders }    = useReminders();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          SkillSync<span>Exchange</span>
        </Link>

        {user && (
          <div className="navbar-nav">
            <NavLink to="/discover" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              🔍 Discover
            </NavLink>
            <NavLink to="/matches" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              🤝 Matches
            </NavLink>
            <NavLink to="/sessions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              📅 Sessions
              {reminders.length > 0 && (
                <span style={{
                  background: 'var(--danger-500)',
                  color: '#fff',
                  borderRadius: '999px',
                  fontSize: '0.65rem',
                  padding: '0 5px',
                  minWidth: '16px',
                  textAlign: 'center',
                  lineHeight: '16px',
                }}>
                  {reminders.length}
                </span>
              )}
            </NavLink>
          </div>
        )}

        <div className="navbar-actions">
          {user ? (
            <>
              <div className="navbar-user">
                <div className="avatar avatar-sm avatar-placeholder" aria-label={user.name}>
                  {initials}
                </div>
                <span style={{ color: 'var(--text-primary)' }}>{user.name.split(' ')[0]}</span>
              </div>
              <button id="logout-btn" className="btn btn-ghost btn-sm" onClick={logout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login"    className="btn btn-ghost btn-sm">Sign in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Join Free</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
