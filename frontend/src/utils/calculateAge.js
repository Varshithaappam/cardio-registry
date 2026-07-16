/**
 * Calculate age in whole years from a date of birth.
 * @param {string|Date|null|undefined} dateOfBirth - ISO date string (YYYY-MM-DD) or Date object
 * @returns {number|null} Age in years, or null if DOB is missing or invalid
 */
export function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}
