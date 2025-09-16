'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Plus, Edit, Trash2, Truck, MapPin, Building2, Map } from 'lucide-react';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import type { Country, State, City, CountryFormData, StateFormData, CityFormData } from '@/types/shipping';

export function ShippingTable() {
  // Country management
  const [isCountryDialogOpen, setIsCountryDialogOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [countryFormData, setCountryFormData] = useState<CountryFormData>({ name: '' });

  // State management
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const [editingState, setEditingState] = useState<State | null>(null);
  const [stateFormData, setStateFormData] = useState<StateFormData>({ name: '' });
  const [selectedCountryForState, setSelectedCountryForState] = useState<string>('');

  // City management
  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [cityFormData, setCityFormData] = useState<CityFormData>({ name: '', defaultPrice: 0 });
  const [selectedCountryForCity, setSelectedCountryForCity] = useState<string>('');
  const [selectedStateForCity, setSelectedStateForCity] = useState<string>('');

  // Expanded sections
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());

  const { data: countries, loading: countriesLoading } = useFirebaseData('shipping_countries');
  const { data: states, loading: statesLoading } = useFirebaseData('shipping_states');
  const { data: cities, loading: citiesLoading } = useFirebaseData('shipping_cities');
  const { createWithKey, update, remove, loading: operationLoading } = useFirebaseOperations();

  const loading = countriesLoading || statesLoading || citiesLoading;

  // Country handlers
  const handleCountrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const countryData = {
        name: countryFormData.name.trim(),
        createdAt: editingCountry ? editingCountry.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingCountry) {
        await update(`shipping_countries/${editingCountry.id}`, countryData);
      } else {
        await createWithKey('shipping_countries', countryData);
      }

      handleCloseCountryDialog();
    } catch (error) {
      console.error('Error saving country:', error);
    }
  };

  const handleEditCountry = (country: Country) => {
    setEditingCountry(country);
    setCountryFormData({ name: country.name });
    setIsCountryDialogOpen(true);
  };

  const handleDeleteCountry = async (id: string) => {
    if (confirm('Are you sure you want to delete this country? This will also delete all associated states and cities.')) {
      try {
        // Delete associated states and cities first
        const countryStates = Object.values(states || {}).filter((state: any) => state.countryId === id);
        const countryCities = Object.values(cities || {}).filter((city: any) => city.countryId === id);
        
        for (const state of countryStates) {
          await remove(`shipping_states/${(state as any).id}`);
        }
        for (const city of countryCities) {
          await remove(`shipping_cities/${(city as any).id}`);
        }
        
        await remove(`shipping_countries/${id}`);
      } catch (error) {
        console.error('Error deleting country:', error);
      }
    }
  };

  const handleCloseCountryDialog = () => {
    setIsCountryDialogOpen(false);
    setEditingCountry(null);
    setCountryFormData({ name: '' });
  };

  // State handlers
  const handleStateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const stateData = {
        countryId: selectedCountryForState,
        name: stateFormData.name.trim(),
        createdAt: editingState ? editingState.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingState) {
        await update(`shipping_states/${editingState.id}`, stateData);
      } else {
        await createWithKey('shipping_states', stateData);
      }

      handleCloseStateDialog();
    } catch (error) {
      console.error('Error saving state:', error);
    }
  };

  const handleEditState = (state: State) => {
    setEditingState(state);
    setStateFormData({ name: state.name });
    setSelectedCountryForState(state.countryId);
    setIsStateDialogOpen(true);
  };

  const handleDeleteState = async (id: string) => {
    if (confirm('Are you sure you want to delete this state? This will also delete all associated cities.')) {
      try {
        // Delete associated cities first
        const stateCities = Object.values(cities || {}).filter((city: any) => city.stateId === id);
        for (const city of stateCities) {
          await remove(`shipping_cities/${(city as any).id}`);
        }
        
        await remove(`shipping_states/${id}`);
      } catch (error) {
        console.error('Error deleting state:', error);
      }
    }
  };

  const handleCloseStateDialog = () => {
    setIsStateDialogOpen(false);
    setEditingState(null);
    setStateFormData({ name: '' });
    setSelectedCountryForState('');
  };

  // City handlers
  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!selectedCountryForCity || !selectedStateForCity) {
      alert('Please select both country and state');
      return;
    }

    if (!cityFormData.name.trim()) {
      alert('Please enter a city name');
      return;
    }

    try {
      const cityData = {
        countryId: selectedCountryForCity,
        stateId: selectedStateForCity,
        name: cityFormData.name.trim(),
        defaultPrice: Number(cityFormData.defaultPrice),
        createdAt: editingCity ? editingCity.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('Creating city with data:', cityData);

      if (editingCity) {
        await update(`shipping_cities/${editingCity.id}`, cityData);
      } else {
        await createWithKey('shipping_cities', cityData);
      }

      handleCloseCityDialog();
    } catch (error) {
      console.error('Error saving city:', error);
      alert('Error saving city. Please try again.');
    }
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setCityFormData({ name: city.name, defaultPrice: city.defaultPrice });
    setSelectedCountryForCity(city.countryId);
    setSelectedStateForCity(city.stateId);
    setIsCityDialogOpen(true);
  };

  const handleDeleteCity = async (id: string) => {
    if (confirm('Are you sure you want to delete this city?')) {
      try {
        await remove(`shipping_cities/${id}`);
      } catch (error) {
        console.error('Error deleting city:', error);
      }
    }
  };

  const handleCloseCityDialog = () => {
    setIsCityDialogOpen(false);
    setEditingCity(null);
    setCityFormData({ name: '', defaultPrice: 0 });
    setSelectedCountryForCity('');
    setSelectedStateForCity('');
  };

  // Toggle expanded sections
  const toggleCountryExpanded = (countryId: string) => {
    const newExpanded = new Set(expandedCountries);
    if (newExpanded.has(countryId)) {
      newExpanded.delete(countryId);
    } else {
      newExpanded.add(countryId);
    }
    setExpandedCountries(newExpanded);
  };

  const toggleStateExpanded = (stateId: string) => {
    const newExpanded = new Set(expandedStates);
    if (newExpanded.has(stateId)) {
      newExpanded.delete(stateId);
    } else {
      newExpanded.add(stateId);
    }
    setExpandedStates(newExpanded);
  };

  // Helper functions
  const getStatesForCountry = (countryId: string) => {
    return Object.values(states || {}).filter((state: any) => state.countryId === countryId);
  };

  const getCitiesForState = (stateId: string) => {
    return Object.values(cities || {}).filter((city: any) => city.stateId === stateId);
  };

  const formatPrice = (price: number) => {
    return `₹${price}`;
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Dialog open={isCountryDialogOpen} onOpenChange={setIsCountryDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCountryDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Country
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {editingCountry ? 'Edit Country' : 'Add New Country'}
              </DialogTitle>
              <DialogDescription>
                {editingCountry 
                  ? 'Update the country name.'
                  : 'Add a new country to start setting up shipping rules.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCountrySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="countryName">Country Name *</Label>
                <Input
                  id="countryName"
                  value={countryFormData.name}
                  onChange={(e) => setCountryFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter country name"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseCountryDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={operationLoading}>
                  {operationLoading ? 'Saving...' : (editingCountry ? 'Update' : 'Create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* State Dialog */}
      <Dialog open={isStateDialogOpen} onOpenChange={setIsStateDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingState ? 'Edit State' : 'Add New State'}
            </DialogTitle>
            <DialogDescription>
              {editingState 
                ? 'Update the state name.'
                : 'Add a new state under the selected country.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStateSubmit} className="space-y-4">
            {!editingState && (
              <div className="space-y-2">
                <Label htmlFor="stateCountry">Country *</Label>
                <select
                  id="stateCountry"
                  value={selectedCountryForState}
                  onChange={(e) => setSelectedCountryForState(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  required
                >
                  <option value="">Select a country</option>
                  {Object.entries(countries || {}).map(([id, country]: [string, any]) => (
                    <option key={id} value={id}>{country.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="stateName">State Name *</Label>
              <Input
                id="stateName"
                value={stateFormData.name}
                onChange={(e) => setStateFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter state name"
                required
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCloseStateDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={operationLoading}>
                {operationLoading ? 'Saving...' : (editingState ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* City Dialog */}
      <Dialog open={isCityDialogOpen} onOpenChange={setIsCityDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingCity ? 'Edit City' : 'Add New City'}
            </DialogTitle>
            <DialogDescription>
              {editingCity 
                ? 'Update the city name and default price.'
                : 'Add a new city under the selected state with default shipping price.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCitySubmit} className="space-y-4">
            {!editingCity && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cityCountry">Country *</Label>
                  <select
                    id="cityCountry"
                    value={selectedCountryForCity}
                    onChange={(e) => {
                      setSelectedCountryForCity(e.target.value);
                      setSelectedStateForCity('');
                    }}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                  >
                    <option value="">Select a country</option>
                    {Object.entries(countries || {}).map(([id, country]: [string, any]) => (
                      <option key={id} value={id}>{country.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cityState">State *</Label>
                  <select
                    id="cityState"
                    value={selectedStateForCity}
                    onChange={(e) => {
                      console.log('State selected:', e.target.value);
                      setSelectedStateForCity(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    required
                    disabled={!selectedCountryForCity}
                  >
                    <option value="">Select a state</option>
                    {selectedCountryForCity && getStatesForCountry(selectedCountryForCity).map((state: any) => (
                      <option key={state.id} value={state.id}>{state.name}</option>
                    ))}
                  </select>
                  {selectedCountryForCity && (
                    <p className="text-xs text-muted-foreground">
                      Available states: {getStatesForCountry(selectedCountryForCity).length}
                    </p>
                  )}
                </div>
              </>
            )}

            {editingCity && (
              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {countries?.[editingCity.countryId]?.name} → {states?.[editingCity.stateId]?.name}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cityName">City Name *</Label>
              <Input
                id="cityName"
                value={cityFormData.name}
                onChange={(e) => setCityFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter city name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultPrice">Default Price (₹) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  ₹
                </span>
                <Input
                  id="defaultPrice"
                  type="number"
                  value={cityFormData.defaultPrice}
                  onChange={(e) => setCityFormData(prev => ({ ...prev, defaultPrice: parseFloat(e.target.value) || 0 }))}
                  placeholder="Enter default shipping price"
                  className="pl-8"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCloseCityDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={operationLoading}>
                {operationLoading ? 'Saving...' : (editingCity ? 'Update' : 'Create')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hierarchical View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Rules
          </CardTitle>
          <CardDescription>
            Manage shipping rules hierarchically by Country → State → City
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : countries && Object.keys(countries).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(countries).map(([countryId, country]: [string, any]) => {
                const countryStates = getStatesForCountry(countryId);
                const isCountryExpanded = expandedCountries.has(countryId);
                
                return (
                  <div key={countryId} className="border rounded-lg">
                    <Collapsible open={isCountryExpanded} onOpenChange={() => toggleCountryExpanded(countryId)}>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer">
                          <div className="flex items-center gap-2">
                            {isCountryExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">{country.name}</span>
                            <span className="text-sm text-muted-foreground">
                              ({countryStates.length} states)
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCountryForState(countryId);
                                setIsStateDialogOpen(true);
                              }}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditCountry({ ...country, id: countryId });
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCountry(countryId);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="px-4 pb-4 space-y-2">
                          {countryStates.map((state: any) => {
                            const stateCities = getCitiesForState(state.id);
                            const isStateExpanded = expandedStates.has(state.id);
                            
                            return (
                              <div key={state.id} className="ml-6 border-l-2 border-muted pl-4">
                                <Collapsible open={isStateExpanded} onOpenChange={() => toggleStateExpanded(state.id)}>
                                  <CollapsibleTrigger asChild>
                                    <div className="flex items-center justify-between p-2 hover:bg-muted/30 cursor-pointer rounded">
                                      <div className="flex items-center gap-2">
                                        {isStateExpanded ? (
                                          <ChevronDown className="h-3 w-3" />
                                        ) : (
                                          <ChevronRight className="h-3 w-3" />
                                        )}
                                        <Building2 className="h-3 w-3" />
                                        <span className="text-sm font-medium">{state.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          ({stateCities.length} cities)
                                        </span>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            console.log('Adding city for country:', countryId, 'state:', state.id);
                                            setSelectedCountryForCity(countryId);
                                            setSelectedStateForCity(state.id);
                                            setCityFormData({ name: '', defaultPrice: 0 });
                                            setIsCityDialogOpen(true);
                                          }}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditState({ ...state, id: state.id });
                                          }}
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteState(state.id);
                                          }}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CollapsibleTrigger>
                                  
                                  <CollapsibleContent>
                                    <div className="ml-6 space-y-1">
                                      {stateCities.map((city: any) => (
                                        <div key={city.id} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                                          <div className="flex items-center gap-2">
                                            <Map className="h-3 w-3" />
                                            <span className="text-sm">{city.name}</span>
                                            <span className="text-sm font-medium text-green-600">
                                              {formatPrice(city.defaultPrice)}
                                            </span>
                                          </div>
                                          <div className="flex gap-1">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleEditCity({ ...city, id: city.id })}
                                            >
                                              <Edit className="h-3 w-3" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleDeleteCity(city.id)}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No countries found. Add your first country to start setting up shipping rules.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
