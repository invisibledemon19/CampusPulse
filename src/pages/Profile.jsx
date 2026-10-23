import { useState, useEffect, useRef } from 'react';
import { usePageMeta } from '../hooks/usePageMeta.js';
import { getProfile, saveProfile } from '../services/index.js';
import { validateProfile } from '../utils/validate.js';
import TextField from '../components/TextField.jsx';
import SelectField from '../components/SelectField.jsx';
import TagInput from '../components/TagInput.jsx';
import Button from '../components/Button.jsx';
import { MapPin, CheckCircle } from 'lucide-react';

export default function Profile() {
  usePageMeta({
    title: 'Your profile | CampusPlus',
    description: 'Set your skills, interests, city, format and fee limit to get fit scores.',
    path: '/profile',
    noindex: true
  });

  const [formData, setFormData] = useState({
    displayName: '',
    educationLevel: 'undergraduate',
    location: '',
    maxDistanceKm: '',
    maxRegistrationFee: '',
    skills: [],
    interests: [],
    preferredFormat: 'any',
    latitude: null,
    longitude: null
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [geoStatus, setGeoStatus] = useState('');
  const [loading, setLoading] = useState(true);

  // Field refs for focus management on validation failure
  const nameRef = useRef(null);
  const educationRef = useRef(null);
  const locationRef = useRef(null);
  const distanceRef = useRef(null);
  const feeRef = useRef(null);
  const skillsRef = useRef(null);
  const interestsRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const existing = await getProfile();
        if (existing) {
          setFormData({
            displayName: existing.displayName || '',
            educationLevel: existing.educationLevel || 'undergraduate',
            location: existing.location || '',
            maxDistanceKm: existing.maxDistanceKm !== null && existing.maxDistanceKm !== undefined ? String(existing.maxDistanceKm) : '',
            maxRegistrationFee: existing.maxRegistrationFee !== null && existing.maxRegistrationFee !== undefined ? String(existing.maxRegistrationFee) : '',
            skills: Array.isArray(existing.skills) ? existing.skills : [],
            interests: Array.isArray(existing.interests) ? existing.interests : [],
            preferredFormat: existing.preferredFormat || 'any',
            latitude: existing.latitude || null,
            longitude: existing.longitude || null
          });
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const validateField = (field, value) => {
    const testData = { ...formData, [field]: value };
    const { errors: allErrors } = validateProfile({
      ...testData,
      maxDistanceKm: testData.maxDistanceKm === '' ? null : Number(testData.maxDistanceKm),
      maxRegistrationFee: testData.maxRegistrationFee === '' ? null : Number(testData.maxRegistrationFee)
    });
    setErrors((prev) => ({
      ...prev,
      [field]: allErrors[field] || undefined
    }));
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSuccessMessage('');
  };

  const handleBlur = (field) => {
    validateField(field, formData[field]);
  };

  const handleUseLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoStatus('Geolocation is not supported by your browser.');
      return;
    }

    setGeoStatus('Requesting location permission...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));
        setGeoStatus('Coordinates added for distance calculations.');
      },
      (err) => {
        setGeoStatus('Could not retrieve coordinates. Location permission denied.');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');

    const profilePayload = {
      displayName: formData.displayName.trim(),
      educationLevel: formData.educationLevel,
      location: formData.location.trim(),
      maxDistanceKm: formData.maxDistanceKm === '' ? null : Number(formData.maxDistanceKm),
      maxRegistrationFee: formData.maxRegistrationFee === '' ? null : Number(formData.maxRegistrationFee),
      skills: formData.skills,
      interests: formData.interests,
      preferredFormat: formData.preferredFormat,
      latitude: formData.latitude,
      longitude: formData.longitude
    };

    const result = validateProfile(profilePayload);
    if (!result.valid) {
      setErrors(result.errors);

      // Focus first invalid field
      if (result.errors.displayName && nameRef.current) {
        nameRef.current.focus();
      } else if (result.errors.educationLevel && educationRef.current) {
        educationRef.current.focus();
      } else if (result.errors.location && locationRef.current) {
        locationRef.current.focus();
      } else if (result.errors.maxDistanceKm && distanceRef.current) {
        distanceRef.current.focus();
      } else if (result.errors.maxRegistrationFee && feeRef.current) {
        feeRef.current.focus();
      } else if (result.errors.skills && skillsRef.current) {
        skillsRef.current.focus();
      } else if (result.errors.interests && interestsRef.current) {
        interestsRef.current.focus();
      }
      return;
    }

    try {
      await saveProfile(profilePayload);
      setErrors({});
      setSuccessMessage('Profile saved');
    } catch (err) {
      if (err.fieldErrors) {
        setErrors(err.fieldErrors);
      } else {
        setErrors({ form: err.message || 'Unable to save profile.' });
      }
    }
  };

  const educationOptions = [
    { value: 'diploma', label: 'Diploma' },
    { value: 'undergraduate', label: 'Undergraduate' },
    { value: 'postgraduate', label: 'Postgraduate' },
    { value: 'doctoral', label: 'Doctoral' }
  ];

  const formatOptions = [
    { value: 'any', label: 'Any' },
    { value: 'online', label: 'Online' },
    { value: 'offline', label: 'Offline' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8" role="status" aria-label="Loading profile">
        <div className="w-64 h-8 bg-[var(--color-line)] rounded-[var(--radius-control)] mb-4" />
        <div className="h-96 bg-[var(--color-line)] rounded-[var(--radius-card)]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Live status announcement */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {successMessage || (errors.form && `Error: ${errors.form}`)}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--color-ink)] mb-2">
          Your skills, budget and location
        </h1>
        <p className="text-base text-[var(--color-muted)]">
          Set your skills, interests, city, format and fee limit to get fit scores.
        </p>
      </div>

      {successMessage && (
        <div
          role="status"
          className="bg-[var(--color-success-bg)] border border-[var(--color-success-ink)] text-[var(--color-success-ink)] rounded-[var(--radius-card)] p-4 mb-6 flex items-center gap-2 text-sm font-medium"
        >
          <CheckCircle size={18} aria-hidden="true" />
          <span>{successMessage}</span>
        </div>
      )}

      {errors.form && (
        <div
          role="alert"
          className="bg-[var(--color-danger-bg)] border border-[var(--color-danger-ink)] text-[var(--color-danger-ink)] rounded-[var(--radius-card)] p-4 mb-6 text-sm font-medium"
        >
          {errors.form}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-[var(--radius-card)] p-6 md:p-8 space-y-6">
        <TextField
          ref={nameRef}
          id="profile-name"
          label="Name"
          value={formData.displayName}
          onChange={(e) => handleChange('displayName', e.target.value)}
          onBlur={() => handleBlur('displayName')}
          error={errors.displayName}
          required
        />

        <SelectField
          ref={educationRef}
          id="profile-education"
          label="Education level"
          value={formData.educationLevel}
          onChange={(e) => handleChange('educationLevel', e.target.value)}
          onBlur={() => handleBlur('educationLevel')}
          options={educationOptions}
          error={errors.educationLevel}
          required
        />

        <TextField
          ref={locationRef}
          id="profile-location"
          label="City"
          value={formData.location}
          onChange={(e) => handleChange('location', e.target.value)}
          onBlur={() => handleBlur('location')}
          error={errors.location}
          helpText="Used to rank local and regional offline events."
        />

        <TextField
          ref={distanceRef}
          id="profile-distance"
          label="Maximum travel distance (km)"
          type="number"
          min="0"
          max="2000"
          value={formData.maxDistanceKm}
          onChange={(e) => handleChange('maxDistanceKm', e.target.value)}
          onBlur={() => handleBlur('maxDistanceKm')}
          error={errors.maxDistanceKm}
        />

        <TextField
          ref={feeRef}
          id="profile-fee"
          label="Maximum registration fee (₹, leave empty for no limit)"
          type="number"
          min="0"
          value={formData.maxRegistrationFee}
          onChange={(e) => handleChange('maxRegistrationFee', e.target.value)}
          onBlur={() => handleBlur('maxRegistrationFee')}
          error={errors.maxRegistrationFee}
        />

        <TagInput
          ref={skillsRef}
          id="profile-skills"
          label="Skills"
          tags={formData.skills}
          onAddTag={(tag) => handleChange('skills', [...formData.skills, tag])}
          onRemoveTag={(tag) => handleChange('skills', formData.skills.filter((t) => t !== tag))}
          maxTags={30}
          error={errors.skills}
          helpText="Type and press Enter or click Add. Maximum 30."
        />

        <TagInput
          ref={interestsRef}
          id="profile-interests"
          label="Interests"
          tags={formData.interests}
          onAddTag={(tag) => handleChange('interests', [...formData.interests, tag])}
          onRemoveTag={(tag) => handleChange('interests', formData.interests.filter((t) => t !== tag))}
          maxTags={30}
          error={errors.interests}
          helpText="Type and press Enter or click Add. Maximum 30."
        />

        <SelectField
          id="profile-format"
          label="Preferred format"
          value={formData.preferredFormat}
          onChange={(e) => handleChange('preferredFormat', e.target.value)}
          options={formatOptions}
          error={errors.preferredFormat}
        />

        {/* Optional Location Coordinate Setting */}
        <div className="pt-2 border-t border-[var(--color-line)]">
          <button
            type="button"
            onClick={handleUseLocation}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-[var(--radius-control)] bg-[var(--color-surface)] border border-[var(--color-line)] text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-canvas)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
          >
            <MapPin size={16} aria-hidden="true" />
            <span>Use my location for distance</span>
          </button>
          <p className="text-xs text-[var(--color-muted)] mt-1.5">
            Used only to calculate distance. Your browser will ask for permission.
          </p>
          {geoStatus && (
            <p className="text-xs font-medium text-[var(--color-brand)] mt-1">
              {geoStatus}
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-[var(--color-line)]">
          <Button type="submit" variant="primary">
            Save profile
          </Button>

          <p className="text-xs text-[var(--color-muted)] mt-4">
            Your profile is stored in this browser until you sign in. After sign in it is stored in your account.
          </p>
        </div>
      </form>
    </div>
  );
}
