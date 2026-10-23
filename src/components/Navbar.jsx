import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Compass, MapPin, Bookmark, User, LogIn, LogOut } from 'lucide-react';
import { subscribeAuth, signOut } from '../services/index.js';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeAuth((user) => {
      setCurrentUser(user);
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleSignOut = async () => {
    try {
      sessionStorage.removeItem('campusplus:guest');
    } catch {
      // ignore
    }
    await signOut();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: 'Discover', icon: Compass, end: true },
    { to: '/nearby', label: 'Nearby', icon: MapPin },
    { to: '/my-opportunities', label: 'My Opportunities', icon: Bookmark },
    { to: '/profile', label: 'My Profile', icon: User }
  ];

  return (
    <>
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-line)] sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-xl font-bold text-[var(--color-brand)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
          >
            <span className="w-8 h-8 rounded-[var(--radius-control)] bg-[var(--color-brand)] text-white flex items-center justify-center font-bold text-lg select-none">
              +
            </span>
            <span>CampusPlus</span>
          </Link>

          {/* Desktop & Tablet Navigation */}
          <nav aria-label="Main navigation" className="hidden sm:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-[var(--radius-control)] text-sm font-medium min-h-[44px] ${
                    isActive
                      ? 'text-[var(--color-brand)] bg-[var(--color-brand-soft)]'
                      : 'text-[var(--color-ink)] hover:text-[var(--color-brand)] hover:bg-[var(--color-canvas)]'
                  }`
                }
              >
                <Icon size={16} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}

            {currentUser ? (
              <div className="ml-3 flex items-center gap-2">
                <span className="text-xs text-[var(--color-muted)] hidden md:inline truncate max-w-[120px]">
                  {currentUser.displayName}
                </span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-3 py-1.5 border border-[var(--color-line)] rounded-[var(--radius-control)] text-xs font-medium text-[var(--color-ink)] hover:bg-[var(--color-canvas)] min-h-[36px] flex items-center gap-1"
                >
                  <LogOut size={14} aria-hidden="true" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="ml-3 px-3 py-1.5 bg-[var(--color-brand)] text-white rounded-[var(--radius-control)] text-xs font-medium hover:bg-[var(--color-brand-hover)] min-h-[36px] flex items-center gap-1"
              >
                <LogIn size={14} aria-hidden="true" />
                <span>Sign in</span>
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile Fixed Bottom Bar */}
      <nav
        aria-label="Mobile navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-line)] z-40 flex items-center justify-around px-2 py-1"
      >
        {navLinks.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center min-h-[44px] min-w-[64px] px-2 py-1 rounded-[var(--radius-control)] text-xs font-medium ${
                isActive
                  ? 'text-[var(--color-brand)]'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]'
              }`
            }
          >
            <Icon size={20} aria-hidden="true" />
            <span className="mt-1 leading-none">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
