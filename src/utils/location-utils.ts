import locationsData from '@/data/locations.json';

export interface Country {
  name: string;
  code: string;
  states: State[];
}

export interface State {
  name: string;
  code: string;
  cities: string[];
}

export interface City {
  name: string;
  state: string;
  country: string;
}

// Get all countries
export const getAllCountries = (): Country[] => {
  return locationsData.countries;
};

// Get all states for a specific country
export const getStatesByCountry = (countryName: string): State[] => {
  const country = locationsData.countries.find(c => c.name === countryName);
  return country ? country.states : [];
};

// Get all cities for a specific state in a country
export const getCitiesByStateAndCountry = (countryName: string, stateName: string): string[] => {
  const country = locationsData.countries.find(c => c.name === countryName);
  if (!country) return [];
  
  const state = country.states.find(s => s.name === stateName);
  return state ? state.cities : [];
};

// Get all cities for a country
export const getAllCitiesByCountry = (countryName: string): City[] => {
  const country = locationsData.countries.find(c => c.name === countryName);
  if (!country) return [];
  
  const cities: City[] = [];
  country.states.forEach(state => {
    state.cities.forEach(city => {
      cities.push({
        name: city,
        state: state.name,
        country: country.name
      });
    });
  });
  
  return cities;
};

// Search countries by name
export const searchCountries = (query: string): Country[] => {
  const lowercaseQuery = query.toLowerCase();
  return locationsData.countries.filter(country => 
    country.name.toLowerCase().includes(lowercaseQuery) ||
    country.code.toLowerCase().includes(lowercaseQuery)
  );
};

// Search states by name
export const searchStates = (query: string): State[] => {
  const lowercaseQuery = query.toLowerCase();
  const states: State[] = [];
  
  locationsData.countries.forEach(country => {
    country.states.forEach(state => {
      if (state.name.toLowerCase().includes(lowercaseQuery) ||
          state.code.toLowerCase().includes(lowercaseQuery)) {
        states.push(state);
      }
    });
  });
  
  return states;
};

// Search cities by name
export const searchCities = (query: string): City[] => {
  const lowercaseQuery = query.toLowerCase();
  const cities: City[] = [];
  
  locationsData.countries.forEach(country => {
    country.states.forEach(state => {
      state.cities.forEach(city => {
        if (city.toLowerCase().includes(lowercaseQuery)) {
          cities.push({
            name: city,
            state: state.name,
            country: country.name
          });
        }
      });
    });
  });
  
  return cities;
};

// Validate if country exists
export const isValidCountry = (countryName: string): boolean => {
  return locationsData.countries.some(c => c.name === countryName);
};

// Validate if state exists in country
export const isValidStateInCountry = (countryName: string, stateName: string): boolean => {
  const country = locationsData.countries.find(c => c.name === countryName);
  if (!country) return false;
  
  return country.states.some(s => s.name === stateName);
};

// Validate if city exists in state and country
export const isValidCityInStateAndCountry = (countryName: string, stateName: string, cityName: string): boolean => {
  const cities = getCitiesByStateAndCountry(countryName, stateName);
  return cities.includes(cityName);
};
