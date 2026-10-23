import { useState, useEffect } from 'react';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { getMode, subscribeAuth, submitOpportunity, signInWithGoogle } from '../services/index.js';
import { isSafeHttpUrl } from '../utils/url.js';
import TextField from '../components/TextField.jsx';
import SelectField from '../components/SelectField.jsx';
import Button from '../components/Button.jsx';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function SubmitOpportunity() {
  usePageMeta({
    title: 'Suggest an opportunity | CampusPlus',
    description: 'Send a hackathon, internship or workshop for review. Listings are checked before they are marked verified.',
    path: '/submit',
    noindex: true
  });

  const mode = getMode();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: '',
    organizer: '',
    category: 'hackathon',
    description: '',
    format: 'online',
    registrationUrl: '',
    city: '',
    deadline: ''
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAuth((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccess(false);
    setSubmitError('');
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const errs = {};
    const title = formData.title.trim();
    if (!title || title.length < 3 || title.length > 120) {
      errs.title = 'Title must be between 3 and 120 characters.';
    }

    const organizer = formData.organizer.trim();
    if (!organizer || organizer.length > 120) {
      errs.organizer = 'Organizer must be between 1 and 120 characters.';
    }

    if (!formData.category) {
      errs.category = 'Select a valid category.';
    }

    const desc = formData.description.trim();
    if (desc.length > 2000) {
      errs.description = 'Description cannot exceed 2000 characters.';
    }

    const regUrl = formData.registrationUrl.trim();
    if (!regUrl) {
      errs.registrationUrl = 'Registration URL is required.';
    } else if (!regUrl.startsWith('https://') || !isSafeHttpUrl(regUrl) || regUrl.length > 500) {
      errs.registrationUrl = 'Registration URL must be a valid https link up to 500 characters.';
    }

    if (formData.city && formData.city.trim().length > 120) {
      errs.city = 'City cannot exceed 120 characters.';
    }

    if (formData.deadline) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.deadline.trim())) {
        errs.deadline = 'Deadline must be in YYYY-MM-DD format.';
      }
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      await submitOpportunity({
        title: formData.title.trim(),
        organizer: formData.organizer.trim(),
        category: formData.category,
        description: formData.description.trim(),
        format: formData.format,
        registrationUrl: formData.registrationUrl.trim(),
        city: formData.city.trim() || null,
        deadline: formData.deadline.trim() || null
      });

      setSuccess(true);
      setFormData({
        title: '',
        organizer: '',
        category: 'hackathon',
        description: '',
        format: 'online',
        registrationUrl: '',
        city: '',
        deadline: ''
      });
    } catch (err) {
      setSubmitError(err.message || 'Unable to submit opportunity. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: 'hackathon', label: 'Hackathon' },
    { value: 'internship', label: 'Internship' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'event', label: 'Event' }
  ];

  const formatOptions = [
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Live announcement region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {success ? 'Opportunity submitted successfully.' : submitError}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)] mb-2">
          Suggest an opportunity
        </h1>
        <p className="text-base text-[var(--color-muted)]">
          Send a hackathon, internship or workshop for review. Listings are checked before they are marked verified.
        </p>
      </div>

      {mode === 'demo' ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-6 text-center space-y-4">
          <p className="text-base text-[var(--color-muted)]">
            Suggesting opportunities requires an active account with Firebase mode enabled.
          </p>
          <p className="text-sm text-[var(--color-muted)]">
            You are currently in demo mode. Connect Firebase to submit new listings for review.
          </p>
        </div>
      ) : !currentUser ? (
        <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-6 text-center space-y-4">
          <p className="text-base text-[var(--color-muted)]">
            Please sign in to suggest an opportunity.
          </p>
          <Button type="button" onClick={signInWithGoogle} variant="primary">
            Sign in with Google
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {success && (
            <div
              role="status"
              className="bg-[var(--color-success-bg)] border border-[var(--color-success-ink)] text-[var(--color-success-ink)] rounded-[var(--radius-card)] p-4 flex items-center gap-2 text-sm font-medium"
            >
              <CheckCircle size={18} aria-hidden="true" />
              <span>
                Your suggestion was sent for review. Listings are checked before they are added to CampusPlus.
              </span>
            </div>
          )}

          {submitError && (
            <div
              role="alert"
              className="bg-[var(--color-danger-bg)] border border-[var(--color-danger-ink)] text-[var(--color-danger-ink)] rounded-[var(--radius-card)] p-4 flex items-center gap-2 text-sm font-medium"
            >
              <AlertCircle size={18} aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-6 md:p-8 space-y-5">
            <TextField
              id="submit-title"
              label="Title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="e.g. National Student Hackathon"
              error={errors.title}
              required
            />

            <TextField
              id="submit-organizer"
              label="Organizer"
              value={formData.organizer}
              onChange={(e) => handleChange('organizer', e.target.value)}
              placeholder="e.g. Technology Club"
              error={errors.organizer}
              required
            />

            <SelectField
              id="submit-category"
              label="Category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              options={categoryOptions}
              error={errors.category}
              required
            />

            <div className="space-y-1">
              <label htmlFor="submit-description" className="block text-sm font-medium text-[var(--color-ink)]">
                Description
              </label>
              <textarea
                id="submit-description"
                rows={4}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Brief summary of requirements, dates and perks"
                maxLength={2000}
                className="w-full p-3 border border-[var(--color-line)] rounded-[var(--radius-control)] text-sm bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
              />
              {errors.description && (
                <p className="text-xs text-[var(--color-danger-ink)] font-medium">
                  {errors.description}
                </p>
              )}
            </div>

            <SelectField
              id="submit-format"
              label="Format"
              value={formData.format}
              onChange={(e) => handleChange('format', e.target.value)}
              options={formatOptions}
              error={errors.format}
              required
            />

            <TextField
              id="submit-url"
              label="Registration URL"
              type="url"
              value={formData.registrationUrl}
              onChange={(e) => handleChange('registrationUrl', e.target.value)}
              placeholder="https://example.com/register"
              helpText="Must start with https://"
              error={errors.registrationUrl}
              required
            />

            <TextField
              id="submit-city"
              label="City"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="e.g. Delhi (leave empty for online events)"
              error={errors.city}
            />

            <TextField
              id="submit-deadline"
              label="Application deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => handleChange('deadline', e.target.value)}
              placeholder="YYYY-MM-DD"
              error={errors.deadline}
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Sending...' : 'Suggest opportunity'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
