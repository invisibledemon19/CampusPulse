import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, UserCheck, ShieldCheck } from 'lucide-react';
import { usePageMeta } from '../hooks/usePageMeta.js';
import {
  getMode,
  subscribeAuth,
  signInDemoUser,
  signInWithGoogle
} from '../services/index.js';

export default function Login() {
  usePageMeta({
    title: 'Sign in | CampusPlus',
    description: 'Sign in to access your student dashboard, track opportunities and calculate personalized fit scores.',
    path: '/login'
  });

  const navigate = useNavigate();
  const mode = getMode();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [educationLevel, setEducationLevel] = useState('undergraduate');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      if (user) {
        navigate('/', { replace: true });
      }
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [navigate]);

  const handleStudentSignIn = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('Please enter your name.');
      return;
    }

    setSubmitting(true);
    try {
      await signInDemoUser({
        displayName: trimmedName,
        email: email.trim() || `${trimmedName.toLowerCase().replace(/\s+/g, '')}@student.edu`
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoSignIn = async () => {
    setError('');
    setSubmitting(true);
    try {
      await signInDemoUser({
        displayName: 'Aarav Sharma',
        email: 'aarav.sharma@college.edu'
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to complete demo sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSubmitting(true);
    try {
      await signInWithGoogle();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Google sign in failed. Try demo student sign in instead.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-6 sm:p-8 shadow-sm">
        {/* Brand header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[var(--radius-control)] bg-[var(--color-brand)] text-white flex items-center justify-center font-bold text-xl select-none">
            +
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-ink)] leading-tight">
              Sign in to CampusPlus
            </h1>
            <p className="text-xs text-[var(--color-muted)]">
              Student Opportunity Portal
            </p>
          </div>
        </div>

        <p className="text-sm text-[var(--color-muted)] mb-6">
          Access hackathons, internships and workshops matched to your skills and budget.
        </p>

        {error && (
          <div
            className="mb-6 p-3 bg-[var(--color-danger-bg)] text-[var(--color-danger-ink)] rounded-[var(--radius-control)] text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Student credentials form */}
        <form onSubmit={handleStudentSignIn} className="space-y-4">
          <div>
            <label htmlFor="login-name" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
              Your Name <span className="text-[var(--color-danger-ink)]">*</span>
            </label>
            <input
              id="login-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              disabled={submitting}
              className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[var(--radius-control)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
              College Email (optional)
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. student@college.edu"
              disabled={submitting}
              className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[var(--radius-control)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="login-education" className="block text-sm font-medium text-[var(--color-ink)] mb-1">
              Education Level
            </label>
            <select
              id="login-education"
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value)}
              disabled={submitting}
              className="w-full px-3 py-2 border border-[var(--color-line)] rounded-[var(--radius-control)] text-sm text-[var(--color-ink)] bg-[var(--color-surface)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] min-h-[44px]"
            >
              <option value="undergraduate">Undergraduate</option>
              <option value="postgraduate">Postgraduate</option>
              <option value="diploma">Diploma</option>
              <option value="doctoral">Doctoral</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-brand)] text-white font-medium text-sm rounded-[var(--radius-control)] hover:bg-[var(--color-brand-hover)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] min-h-[44px]"
          >
            <LogIn size={16} aria-hidden="true" />
            <span>Sign In to Dashboard</span>
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-line)]" />
          </div>
          <span className="relative px-3 bg-[var(--color-surface)] text-xs text-[var(--color-muted)]">
            or choose an option below
          </span>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleQuickDemoSignIn}
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-[var(--color-line)] bg-[var(--color-canvas)] text-[var(--color-ink)] font-medium text-sm rounded-[var(--radius-control)] hover:bg-[var(--color-brand-soft)] hover:text-[var(--color-brand)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] min-h-[44px]"
          >
            <UserCheck size={16} aria-hidden="true" />
            <span>Quick Demo Student Sign In</span>
          </button>

          {mode === 'firebase' && (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] font-medium text-sm rounded-[var(--radius-control)] hover:bg-[var(--color-canvas)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] min-h-[44px]"
            >
              <ShieldCheck size={16} aria-hidden="true" />
              <span>Sign in with Google</span>
            </button>
          )}

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.setItem('campusplus:guest', 'true');
                } catch {
                  // ignore
                }
                navigate('/', { replace: true });
              }}
              className="text-xs text-[var(--color-brand)] hover:underline font-medium focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] cursor-pointer"
            >
              Continue to Dashboard as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
