'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ArrowLeft, Building2, Map, MapPin, DollarSign, Search } from 'lucide-react';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import type { State, City, CityFormData } from '@/types/shipping';

interface StateManagementProps {
  countryId: string;
  countryName: string;
}

export function StateManagement({ countryId, countryName }: StateManagementProps) {
  const router = useRouter();
  
  // State management
  const [selectedStateId, setSelectedStateId] = useState<string>('');
  const [selectedState, setSelectedState] = useState<State | null>(null);
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [editingState, setEditingState] = useState<State | null>(null);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [stateName, setStateName] = useState('');
  const [cityFormData, setCityFormData] = useState<CityFormData>({ name: '', defaultPrice: 0 });
  const [searchTerm, setSearchTerm] = useState('');

  const { data: states, loading: statesLoading } = useFirebaseData('shipping_states');
  const { data: cities, loading: citiesLoading } = useFirebaseData('shipping_cities');
  const { createWithKey, update, remove, loading: operationLoading } = useFirebaseOperations();

  const loading = statesLoading || citiesLoading;

  // Get states for this country
  const countryStates = Object.values(states || {}).filter((state: any) => state.countryId === countryId);

  // Get cities for selected state
  const selectedStateCities = selectedStateId 
    ? Object.values(cities || {}).filter((city: any) => city.stateId === selectedStateId)
    : [];

  // Filter cities based on search term
  const filteredCities = selectedStateCities.filter((city: any) =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update selected state when state ID changes
  useEffect(() => {
    if (selectedStateId && countryStates.length > 0) {
      const state = countryStates.find((state: any) => state.id === selectedStateId);
      setSelectedState((state as State) || null);
    } else {
      setSelectedState(null);
    }
  }, [selectedStateId, countryStates]);

  const handleStateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stateName.trim()) {
      return;
    }

    try {
      const stateData = {
        countryId: countryId,
        name: stateName.trim(),
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
    setStateName(state.name);
    setIsStateDialogOpen(true);
  };

  const handleDeleteState = async (id: string, stateName: string) => {
    try {
      console.log('Starting deletion process for state:', id, stateName);
      
      // Delete associated cities first
      const stateCities = Object.values(cities || {}).filter((city: any) => city.stateId === id);
      console.log('Found cities to delete:', stateCities.length);
      
      for (const city of stateCities) {
        try {
          const cityData = city as any;
          console.log('Deleting city:', cityData.id, cityData.name);
          await remove(`shipping_cities/${cityData.id}`);
          console.log('Successfully deleted city:', cityData.name);
        } catch (cityError) {
          const cityData = city as any;
          const error = cityError as Error;
          console.error('Error deleting city:', cityData.name, cityError);
          alert(`Error deleting city ${cityData.name}: ${error.message || cityError}`);
          return;
        }
      }
      
      console.log('Deleting state:', id, stateName);
      await remove(`shipping_states/${id}`);
      console.log('Successfully deleted state:', stateName);
      
      // Clear selection if deleted state was selected
      if (selectedStateId === id) {
        setSelectedStateId('');
        setSelectedState(null);
      }
    } catch (error) {
      const err = error as Error;
      console.error('Error deleting state:', error);
      alert(`Error deleting state ${stateName}: ${err.message || error}`);
    }
  };

  const handleCloseStateDialog = () => {
    setIsStateDialogOpen(false);
    setEditingState(null);
    setStateName('');
  };

  // City handlers
  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStateId) {
      return;
    }

    if (!cityFormData.name.trim()) {
      return;
    }

    if (cityFormData.defaultPrice < 0) {
      return;
    }

    try {
      const cityData = {
        countryId: countryId,
        stateId: selectedStateId,
        name: cityFormData.name.trim(),
        defaultPrice: Number(cityFormData.defaultPrice),
        createdAt: editingCity ? editingCity.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingCity) {
        await update(`shipping_cities/${editingCity.id}`, cityData);
      } else {
        await createWithKey('shipping_cities', cityData);
      }

      handleCloseCityDialog();
    } catch (error) {
      console.error('Error saving city:', error);
    }
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setCityFormData({ name: city.name, defaultPrice: city.defaultPrice });
    setIsCityDialogOpen(true);
  };

  const handleDeleteCity = async (id: string, cityName: string) => {
    try {
      await remove(`shipping_cities/${id}`);
    } catch (error) {
      console.error('Error deleting city:', error);
    }
  };

  const handleCloseCityDialog = () => {
    setIsCityDialogOpen(false);
    setEditingCity(null);
    setCityFormData({ name: '', defaultPrice: 0 });
  };

  const formatPrice = (price: number) => {
    return `₹${price}`;
  };

  const getTotalRevenue = (): number => {
    return selectedStateCities.reduce((total, city: any) => total + (city.defaultPrice || 0), 0);
  };

  const getAveragePrice = (): number => {
    if (selectedStateCities.length === 0) return 0;
    return getTotalRevenue() / selectedStateCities.length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/shipping/countries')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Countries
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-8 w-8 text-blue-600" />
            {countryName}
          </h1>
          <p className="text-muted-foreground">
            Manage states and cities for {countryName}
          </p>
        </div>
      </div>

      {/* State Selection and Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* State Management Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              States
            </CardTitle>
            <CardDescription>
              Select a state to manage its cities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* State Dropdown */}
            <div className="space-y-2">
              <Label>Select State</Label>
              <Select value={selectedStateId} onValueChange={setSelectedStateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a state" />
                </SelectTrigger>
                <SelectContent>
                  {countryStates.map((state: any) => (
                    <SelectItem key={state.id} value={state.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{state.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {Object.values(cities || {}).filter((city: any) => city.stateId === state.id).length}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add State Button */}
            <Dialog open={isStateDialogOpen} onOpenChange={setIsStateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add State
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingState ? 'Edit State' : 'Add New State'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingState 
                      ? 'Update the state name.'
                      : `Add a new state to ${countryName}.`
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleStateSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stateName">State Name *</Label>
                    <Input
                      id="stateName"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
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

            {/* State Actions */}
            {selectedState && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditState(selectedState)}
                    className="flex-1"
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteState(selectedState.id, selectedState.name)}
                    className="flex-1"
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* City Management Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="h-5 w-5" />
              Cities {selectedState && `- ${selectedState.name}`}
            </CardTitle>
            <CardDescription>
              {selectedState 
                ? `Manage cities in ${selectedState.name}`
                : 'Select a state to manage its cities'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedState ? (
              <div className="space-y-4">
                {/* Statistics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <p className="text-2xl font-bold">{selectedStateCities.length}</p>
                    <p className="text-sm text-muted-foreground">Cities</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <p className="text-2xl font-bold">{formatPrice(getTotalRevenue())}</p>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded">
                    <p className="text-2xl font-bold">{formatPrice(getAveragePrice())}</p>
                    <p className="text-sm text-muted-foreground">Avg Price</p>
                  </div>
                </div>

                {/* Search and Add City */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search cities..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Dialog open={isCityDialogOpen} onOpenChange={setIsCityDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => setIsCityDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add City
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[400px]">
                      <DialogHeader>
                        <DialogTitle>
                          {editingCity ? 'Edit City' : 'Add New City'}
                        </DialogTitle>
                        <DialogDescription>
                          {editingCity 
                            ? 'Update the city name and default price.'
                            : `Add a new city to ${selectedState.name}, ${countryName}.`
                          }
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCitySubmit} className="space-y-4">
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
                </div>

                {/* Cities Grid */}
                {filteredCities.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredCities.map((city: any) => (
                      <div key={city.id} className="p-3 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Map className="h-4 w-4" />
                            <span className="font-medium">{city.name}</span>
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
                              onClick={() => handleDeleteCity(city.id, city.name)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">{formatPrice(city.defaultPrice)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Map className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    {searchTerm ? (
                      <p>No cities found matching &quot;{searchTerm}&quot;</p>
                    ) : (
                      <p>No cities added yet. Add your first city to get started.</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>Select a state from the dropdown to manage its cities.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
