import { 
  ref, 
  get, 
  set, 
  update, 
  remove, 
  onValue, 
  off, 
  type DatabaseReference 
} from 'firebase/database';
import { database } from './firebase';

export interface City {
  name: string;
  price: number;
}

export interface State {
  state: string;
  cities: City[];
}

export interface Country {
  country: string;
  states: State[];
}

// Get all countries with their nested structure
export const getCountries = async (): Promise<Country[]> => {
  try {
    const dbRef = ref(database, 'shipping');
    const snapshot = await get(dbRef);
    return snapshot.exists() ? Object.values(snapshot.val()) : [];
  } catch (error) {
    console.error('Error fetching countries:', error);
    throw error;
  }
};

// Get a specific country by name
export const getCountry = async (countryName: string): Promise<Country | null> => {
  try {
    const dbRef = ref(database, `shipping/${countryName}`);
    const snapshot = await get(dbRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error('Error fetching country:', error);
    throw error;
  }
};

// Create or update a country
export const saveCountry = async (country: Country): Promise<void> => {
  try {
    const dbRef = ref(database, `shipping/${country.country}`);
    await set(dbRef, country);
  } catch (error) {
    console.error('Error saving country:', error);
    throw error;
  }
};

// Add a state to a country
export const addStateToCountry = async (countryName: string, stateName: string): Promise<void> => {
  try {
    const country = await getCountry(countryName);
    if (!country) {
      // Create new country if it doesn't exist
      const newCountry: Country = {
        country: countryName,
        states: [{ state: stateName, cities: [] }]
      };
      await saveCountry(newCountry);
    } else {
      // Ensure states array exists
      if (!Array.isArray(country.states)) {
        country.states = [];
      }
      
      // Check if state already exists
      const stateExists = country.states.some(s => s.state === stateName);
      if (!stateExists) {
        country.states.push({ state: stateName, cities: [] });
        await saveCountry(country);
      }
    }
  } catch (error) {
    console.error('Error adding state to country:', error);
    throw error;
  }
};

// Remove a state from a country
export const removeStateFromCountry = async (countryName: string, stateName: string): Promise<void> => {
  try {
    const country = await getCountry(countryName);
    if (country) {
      country.states = country.states.filter(s => s.state !== stateName);
      await saveCountry(country);
    }
  } catch (error) {
    console.error('Error removing state from country:', error);
    throw error;
  }
};

// Add a city to a state
export const addCityToState = async (countryName: string, stateName: string, cityName: string, price: number): Promise<void> => {
  try {
    const country = await getCountry(countryName);
    
    if (country) {
      const state = country.states.find(s => s.state === stateName);
      
      if (state) {
        // Ensure cities array exists
        if (!Array.isArray(state.cities)) {
          state.cities = [];
        }
        
        // Check if city already exists
        const cityExists = state.cities.some(c => c.name === cityName);
        
        if (!cityExists) {
          state.cities.push({ name: cityName, price });
          await saveCountry(country);
        }
      } else {
        throw new Error(`State "${stateName}" not found in country "${countryName}"`);
      }
    } else {
      throw new Error(`Country "${countryName}" not found`);
    }
  } catch (error) {
    console.error('Error adding city to state:', error);
    throw error;
  }
};

// Remove a city from a state
export const removeCityFromState = async (countryName: string, stateName: string, cityName: string): Promise<void> => {
  try {
    const country = await getCountry(countryName);
    if (country) {
      const state = country.states.find(s => s.state === stateName);
      if (state) {
        state.cities = state.cities.filter(c => c.name !== cityName);
        await saveCountry(country);
      }
    }
  } catch (error) {
    console.error('Error removing city from state:', error);
    throw error;
  }
};

// Update city price
export const updateCityPrice = async (countryName: string, stateName: string, cityName: string, newPrice: number): Promise<void> => {
  try {
    const country = await getCountry(countryName);
    if (country) {
      const state = country.states.find(s => s.state === stateName);
      if (state) {
        const city = state.cities.find(c => c.name === cityName);
        if (city) {
          city.price = newPrice;
          await saveCountry(country);
        }
      }
    }
  } catch (error) {
    console.error('Error updating city price:', error);
    throw error;
  }
};

// Listen to real-time changes for a specific country
export const subscribeToCountry = (
  countryName: string,
  callback: (country: Country | null) => void,
  errorCallback?: (error: any) => void
): (() => void) => {
  const dbRef = ref(database, `shipping/${countryName}`);
  
  const unsubscribe = onValue(dbRef, (snapshot) => {
    const country = snapshot.exists() ? snapshot.val() : null;
    callback(country);
  }, errorCallback);

  return () => {
    off(dbRef, 'value', unsubscribe);
  };
};

// Listen to real-time changes for all countries
export const subscribeToAllCountries = (
  callback: (countries: Country[]) => void,
  errorCallback?: (error: any) => void
): (() => void) => {
  const dbRef = ref(database, 'shipping');
  
  const unsubscribe = onValue(dbRef, (snapshot) => {
    const countries = snapshot.exists() ? Object.values(snapshot.val()) : [];
    callback(countries);
  }, errorCallback);

  return () => {
    off(dbRef, 'value', unsubscribe);
  };
};
