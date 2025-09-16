export interface Country {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface State {
  id: string;
  countryId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  id: string;
  stateId: string;
  countryId: string;
  name: string;
  defaultPrice: number;
  createdAt: string;
  updatedAt: string;
}

// Legacy interface for backward compatibility
export interface ShippingRule {
  id: string;
  country: string;
  state: string;
  city: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingFormData {
  country: string;
  state: string;
  city: string;
  price: number;
}

export interface CountryFormData {
  name: string;
}

export interface StateFormData {
  name: string;
}

export interface CityFormData {
  name: string;
  defaultPrice: number;
}

export interface ShippingRulesByCountry {
  [country: string]: {
    [state: string]: {
      [city: string]: ShippingRule;
    };
  };
}

export interface HierarchicalShippingData {
  countries: { [id: string]: Country };
  states: { [id: string]: State };
  cities: { [id: string]: City };
}
