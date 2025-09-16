import type { 
  ShippingRule, 
  ShippingRulesByCountry, 
  Country, 
  State, 
  City, 
  HierarchicalShippingData 
} from '@/types/shipping';

/**
 * Groups shipping rules by country, state, and city (legacy support)
 */
export const groupShippingRulesByLocation = (rules: { [id: string]: ShippingRule }): ShippingRulesByCountry => {
  const grouped: ShippingRulesByCountry = {};

  Object.values(rules).forEach((rule) => {
    if (!grouped[rule.country]) {
      grouped[rule.country] = {};
    }
    
    if (!grouped[rule.country][rule.state]) {
      grouped[rule.country][rule.state] = {};
    }
    
    grouped[rule.country][rule.state][rule.city] = rule;
  });

  return grouped;
};

/**
 * Gets states for a specific country
 */
export const getStatesForCountry = (states: { [id: string]: State }, countryId: string): State[] => {
  return Object.values(states).filter((state) => state.countryId === countryId);
};

/**
 * Gets cities for a specific state
 */
export const getCitiesForState = (cities: { [id: string]: City }, stateId: string): City[] => {
  return Object.values(cities).filter((city) => city.stateId === stateId);
};

/**
 * Gets cities for a specific country
 */
export const getCitiesForCountry = (cities: { [id: string]: City }, countryId: string): City[] => {
  return Object.values(cities).filter((city) => city.countryId === countryId);
};

/**
 * Finds a country by name
 */
export const findCountryByName = (countries: { [id: string]: Country }, name: string): Country | null => {
  return Object.values(countries).find(
    (country) => country.name.toLowerCase() === name.toLowerCase()
  ) || null;
};

/**
 * Finds a state by name within a country
 */
export const findStateByName = (states: { [id: string]: State }, countryId: string, name: string): State | null => {
  return Object.values(states).find(
    (state) => 
      state.countryId === countryId && 
      state.name.toLowerCase() === name.toLowerCase()
  ) || null;
};

/**
 * Finds a city by name within a state
 */
export const findCityByName = (cities: { [id: string]: City }, stateId: string, name: string): City | null => {
  return Object.values(cities).find(
    (city) => 
      city.stateId === stateId && 
      city.name.toLowerCase() === name.toLowerCase()
  ) || null;
};

/**
 * Gets shipping price for a specific location
 */
export const getShippingPrice = (
  countries: { [id: string]: Country },
  states: { [id: string]: State },
  cities: { [id: string]: City },
  countryName: string,
  stateName: string,
  cityName: string
): number | null => {
  const country = findCountryByName(countries, countryName);
  if (!country) return null;

  const state = findStateByName(states, country.id, stateName);
  if (!state) return null;

  const city = findCityByName(cities, state.id, cityName);
  if (!city) return null;

  return city.defaultPrice;
};

/**
 * Validates country form data
 */
export const validateCountryForm = (formData: { name: string }): string[] => {
  const errors: string[] = [];

  if (!formData.name.trim()) {
    errors.push('Country name is required');
  }

  return errors;
};

/**
 * Validates state form data
 */
export const validateStateForm = (formData: { name: string }, countryId: string): string[] => {
  const errors: string[] = [];

  if (!countryId) {
    errors.push('Country selection is required');
  }

  if (!formData.name.trim()) {
    errors.push('State name is required');
  }

  return errors;
};

/**
 * Validates city form data
 */
export const validateCityForm = (formData: { name: string; defaultPrice: number }, countryId: string, stateId: string): string[] => {
  const errors: string[] = [];

  if (!countryId) {
    errors.push('Country selection is required');
  }

  if (!stateId) {
    errors.push('State selection is required');
  }

  if (!formData.name.trim()) {
    errors.push('City name is required');
  }

  if (formData.defaultPrice < 0) {
    errors.push('Default price must be greater than or equal to 0');
  }

  return errors;
};

/**
 * Creates a hierarchical data structure from separate collections
 */
export const createHierarchicalData = (
  countries: { [id: string]: Country },
  states: { [id: string]: State },
  cities: { [id: string]: City }
): HierarchicalShippingData => {
  return {
    countries,
    states,
    cities
  };
};

/**
 * Gets the total count of items in the hierarchy
 */
export const getHierarchyStats = (
  countries: { [id: string]: Country },
  states: { [id: string]: State },
  cities: { [id: string]: City }
) => {
  return {
    totalCountries: Object.keys(countries).length,
    totalStates: Object.keys(states).length,
    totalCities: Object.keys(cities).length
  };
};
