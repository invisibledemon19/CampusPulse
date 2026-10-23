export function getScoreTier(score) {
  if (score === null || score === undefined) return null;
  if (score >= 80) return 'Strong fit';
  if (score >= 60) return 'Good fit';
  if (score >= 40) return 'Partial fit';
  return 'Weak fit';
}

export default function MatchScore({ score }) {
  if (score === null || score === undefined) {
    return (
      <div className="text-xs text-[var(--color-muted)] font-medium">
        Fit score unavailable. Add your profile.
      </div>
    );
  }

  const tier = getScoreTier(score);
  const clampedScore = Math.max(0, Math.min(100, score));

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-[var(--color-ink)]">
          Fit score {score} out of 100
        </span>
        <span className="text-[var(--color-brand)] font-semibold">
          {tier}
        </span>
      </div>
      <div className="w-full bg-[var(--color-line)] h-1.5 rounded-[2px] overflow-hidden">
        <div
          className="bg-[var(--color-brand)] h-full rounded-[2px]"
          style={{ width: `${clampedScore}%` }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
