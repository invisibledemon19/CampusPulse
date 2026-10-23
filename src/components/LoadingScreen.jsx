import { useState, useEffect } from 'react';

export default function LoadingScreen({ onComplete, minDuration = 1600 }) {
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Connecting to student opportunity services...');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(55);
      setStatusText('Loading hackathons, internships and workshops...');
    }, 500);

    const timer2 = setTimeout(() => {
      setProgress(90);
      setStatusText('Preparing your opportunity dashboard...');
    }, 1100);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Ready');
    }, 1450);

    const timer4 = setTimeout(() => {
      if (typeof onComplete === 'function') {
        onComplete();
      }
    }, minDuration);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete, minDuration]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-canvas)] text-[var(--color-ink)] px-4"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-sm text-center">
        {/* Logo mark */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-[var(--radius-card)] bg-[var(--color-brand)] text-white flex items-center justify-center text-3xl font-bold select-none shadow-sm">
          +
        </div>

        {/* Brand name */}
        <h1 className="text-2xl font-bold text-[var(--color-ink)] mb-2">
          CampusPlus
        </h1>

        <p className="text-sm text-[var(--color-muted)] mb-8">
          Hackathons, internships and workshops that fit your skills and budget
        </p>

        {/* Progress bar container */}
        <div className="w-full bg-[var(--color-line)] h-2 rounded-[var(--radius-control)] overflow-hidden mb-3">
          <div
            className="bg-[var(--color-brand)] h-full transition-all duration-300 ease-out rounded-[var(--radius-control)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status text */}
        <p className="text-xs text-[var(--color-muted)] h-5">
          {statusText}
        </p>
      </div>
    </div>
  );
}
