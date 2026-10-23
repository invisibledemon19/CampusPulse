import { useState, forwardRef } from 'react';
import { X } from 'lucide-react';
import Badge from './Badge.jsx';

const TagInput = forwardRef(function TagInput(
  {
    id,
    label,
    tags = [],
    onAddTag,
    onRemoveTag,
    maxTags = 30,
    placeholder = 'Add a tag',
    error,
    helpText,
    className = ''
  },
  ref
) {
  const [inputValue, setInputValue] = useState('');
  const [localError, setLocalError] = useState('');

  const errorId = (error || localError) ? `${id}-error` : undefined;
  const helpId = helpText ? `${id}-help` : undefined;
  const describedBy = [errorId, helpId].filter(Boolean).join(' ') || undefined;

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    if (tags.length >= maxTags) {
      setLocalError(`Maximum ${maxTags} items allowed.`);
      return;
    }

    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setLocalError('Item already added.');
      return;
    }

    setLocalError('');
    onAddTag(trimmed);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const activeError = error || localError;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label htmlFor={id} className="block text-sm font-medium text-[var(--color-ink)]">
        {label} ({tags.length}/{maxTags})
      </label>

      <div className="flex gap-2">
        <input
          ref={ref}
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (localError) setLocalError('');
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-invalid={Boolean(activeError)}
          aria-describedby={describedBy}
          className={`flex-1 min-h-[44px] px-3 border rounded-[var(--radius-control)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] ${
            activeError ? 'border-[var(--color-danger-ink)]' : 'border-[var(--color-line)]'
          }`}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-line)] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-canvas)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
        >
          Add
        </button>
      </div>

      {/* Render Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="default" className="gap-1 pr-1">
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                aria-label={`Remove ${tag}`}
                className="text-[var(--color-muted)] hover:text-[var(--color-ink)] p-0.5 rounded-[var(--radius-badge)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {helpText && !activeError && (
        <p id={helpId} className="text-xs text-[var(--color-muted)]">
          {helpText}
        </p>
      )}

      {activeError && (
        <p id={errorId} className="text-xs text-[var(--color-danger-ink)] font-medium">
          {activeError}
        </p>
      )}
    </div>
  );
});

export default TagInput;
