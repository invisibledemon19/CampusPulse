export const REGIONS = {
  NCR: [
    'delhi',
    'new delhi',
    'noida',
    'greater noida',
    'ghaziabad',
    'gurugram',
    'gurgaon',
    'faridabad'
  ]
};

export function getRegionForCity(city) {
  if (!city || typeof city !== 'string') return null;
  const normalized = city.trim().toLowerCase();
  for (const [regionName, cities] of Object.entries(REGIONS)) {
    if (cities.includes(normalized)) {
      return regionName;
    }
  }
  return null;
}
