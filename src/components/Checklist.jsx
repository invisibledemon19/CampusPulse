import { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function Checklist({
  opportunityId,
  steps = [],
  onUpdateSteps
}) {
  const [newStepText, setNewStepText] = useState('');
  const [error, setError] = useState('');

  const handleToggle = (stepId) => {
    const updated = steps.map((s) => (s.id === stepId ? { ...s, completed: !s.completed } : s));
    onUpdateSteps(updated);
  };

  const handleRemove = (stepId) => {
    const updated = steps.filter((s) => s.id !== stepId);
    onUpdateSteps(updated);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const text = newStepText.trim();
    if (!text) return;

    if (steps.length >= 20) {
      setError('Maximum 20 steps allowed.');
      return;
    }

    if (text.length > 120) {
      setError('Step text must be 120 characters or fewer.');
      return;
    }

    setError('');
    const newStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      task: text,
      completed: false
    };

    onUpdateSteps([...steps, newStep]);
    setNewStepText('');
  };

  const completedCount = steps.filter((s) => s.completed).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">
          Next steps
        </h3>
        <span className="text-xs text-[var(--color-muted)]">
          {completedCount} of {steps.length} completed
        </span>
      </div>

      {/* Steps list */}
      {steps.length > 0 && (
        <ul className="space-y-2">
          {steps.map((step) => {
            const inputId = `step-${opportunityId}-${step.id}`;
            return (
              <li
                key={step.id}
                className="flex items-start justify-between gap-2 p-2 rounded-[var(--radius-control)] bg-[var(--color-canvas)] text-sm border border-[var(--color-line)]"
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={step.completed}
                    onChange={() => handleToggle(step.id)}
                    className="mt-0.5 h-4 w-4 rounded-[var(--radius-badge)] border-[var(--color-line)] text-[var(--color-brand)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] cursor-pointer"
                  />
                  <label
                    htmlFor={inputId}
                    className={`text-sm cursor-pointer break-words flex-1 ${
                      step.completed ? 'line-through text-[var(--color-muted)]' : 'text-[var(--color-ink)]'
                    }`}
                  >
                    {step.task}
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(step.id)}
                  aria-label={`Remove step: ${step.task}`}
                  className="p-1 text-[var(--color-muted)] hover:text-[var(--color-danger-ink)] rounded-[var(--radius-badge)] min-h-[32px] min-w-[32px] flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add a step form */}
      <form onSubmit={handleAdd} className="space-y-1">
        <label htmlFor={`add-step-${opportunityId}`} className="sr-only">
          Add a step
        </label>
        <div className="flex gap-2">
          <input
            id={`add-step-${opportunityId}`}
            type="text"
            value={newStepText}
            onChange={(e) => {
              setNewStepText(e.target.value);
              if (error) setError('');
            }}
            placeholder="Add a step"
            maxLength={120}
            className="flex-1 min-h-[44px] px-3 border border-[var(--color-line)] rounded-[var(--radius-control)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-line)] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-canvas)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
          >
            Add step
          </button>
        </div>
        {error && (
          <p className="text-xs text-[var(--color-danger-ink)] font-medium pt-1">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
