const VALID_EDUCATION_LEVELS = ['diploma', 'undergraduate', 'postgraduate', 'doctoral'];
const VALID_FORMATS = ['any', 'online', 'offline', 'hybrid'];
const VALID_STATUSES = ['interested', 'preparing', 'applied', 'registered', 'completed'];

export function validateProfile(profile) {
  const errors = {};

  if (!profile || typeof profile !== 'object') {
    return { valid: false, errors: { form: 'Invalid profile data' } };
  }

  const name = typeof profile.displayName === 'string' ? profile.displayName.trim() : '';
  if (!name || name.length > 80) {
    errors.displayName = 'Name must be between 1 and 80 characters.';
  }

  if (!profile.educationLevel || !VALID_EDUCATION_LEVELS.includes(profile.educationLevel)) {
    errors.educationLevel = 'Select a valid education level.';
  }

  const loc = typeof profile.location === 'string' ? profile.location.trim() : '';
  if (loc.length > 80) {
    errors.location = 'City name cannot exceed 80 characters.';
  }

  if (profile.maxDistanceKm !== null && profile.maxDistanceKm !== undefined && profile.maxDistanceKm !== '') {
    const dist = Number(profile.maxDistanceKm);
    if (isNaN(dist) || dist < 0 || dist > 2000) {
      errors.maxDistanceKm = 'Maximum distance must be between 0 and 2000 km.';
    }
  }

  if (profile.maxRegistrationFee !== null && profile.maxRegistrationFee !== undefined && profile.maxRegistrationFee !== '') {
    const fee = Number(profile.maxRegistrationFee);
    if (isNaN(fee) || fee < 0) {
      errors.maxRegistrationFee = 'Maximum fee must be 0 or greater.';
    }
  }

  if (profile.skills && Array.isArray(profile.skills)) {
    if (profile.skills.length > 30) {
      errors.skills = 'Maximum 30 skills allowed.';
    }
  }

  if (profile.interests && Array.isArray(profile.interests)) {
    if (profile.interests.length > 30) {
      errors.interests = 'Maximum 30 interests allowed.';
    }
  }

  if (profile.preferredFormat && !VALID_FORMATS.includes(profile.preferredFormat)) {
    errors.preferredFormat = 'Select a valid format.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

export function validateSaved(saved) {
  if (!saved || typeof saved !== 'object') return false;
  if (!saved.opportunityId || typeof saved.opportunityId !== 'string' || saved.opportunityId.length > 128) return false;
  if (!saved.applicationStatus || !VALID_STATUSES.includes(saved.applicationStatus)) return false;
  if (saved.nextSteps && (!Array.isArray(saved.nextSteps) || saved.nextSteps.length > 20)) return false;
  if (saved.notes && (typeof saved.notes !== 'string' || saved.notes.length > 1000)) return false;
  return true;
}
