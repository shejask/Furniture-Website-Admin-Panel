'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Map, Plus, Edit, Trash2, Search } from 'lucide-react';
import { useCountry, useShippingOperations } from '@/hooks/use-shipping-data';
import { getCitiesByStateAndCountry } from '@/utils/location-utils';
import type { City } from '@/lib/shipping-database';

interface StateDetailNewProps {
  countryId: string;
  stateId: string;
  countryName: string;
  stateName: string;
}

export function StateDetailNew({ countryId, countryName, stateName }: StateDetailNewProps) {
  const router = useRouter();
  
  const [isAddCityDialogOpen, setIsAddCityDialogOpen] = useState(false);
  const [isMultiSelectDialogOpen, setIsMultiSelectDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [cityName, setCityName] = useState('');
  const [selectedCityFromDropdown, setSelectedCityFromDropdown] = useState<string>('');
  const [shippingRate, setShippingRate] = useState<number>(0);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [bulkShippingRate, setBulkShippingRate] = useState<number>(100);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [cityToDelete, setCityToDelete] = useState<{name: string} | null>(null);

  const { country, loading } = useCountry(countryName);
  const { addCity, removeCity, loading: operationLoading } = useShippingOperations();

  // Get cities for this state from the nested structure
  const stateCities = country?.states?.find(s => s.state === stateName)?.cities || [];

  // Get available cities from JSON data
  const availableCities = getCitiesByStateAndCountry(countryName, stateName) || [];

  // Ensure all arrays are properly initialized
  const safeStateCities = Array.isArray(stateCities) ? stateCities : [];
  const safeAvailableCities = Array.isArray(availableCities) ? availableCities : [];

  // Filter cities based on search
  const filteredCities = safeStateCities.filter((city: City) =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cityName.trim()) {
      return;
    }

    try {
      await addCity(countryName, stateName, cityName.trim(), Number(shippingRate));
      handleCloseAddCityDialog();
    } catch (error) {
      alert(`Error adding city: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setCityName(city.name);
    setSelectedCityFromDropdown('');
    setShippingRate(city.price);
    setIsAddCityDialogOpen(true);
  };

  const handleUpdateCity = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cityName.trim() || !editingCity) {
      return;
    }

    try {
      // For now, we'll remove the old city and add the new one
      // In a more sophisticated implementation, you might want to update the city directly
      await removeCity(countryName, stateName, editingCity.name);
      await addCity(countryName, stateName, cityName.trim(), Number(shippingRate));
      handleCloseAddCityDialog();
    } catch (error) {
      alert(`Error updating city: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteCity = async (cityName: string) => {
    setCityToDelete({ name: cityName });
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteCity = async () => {
    if (!cityToDelete) return;
    
    try {
      await removeCity(countryName, stateName, cityToDelete.name);
      
      // Close dialog and reset state
      setIsDeleteDialogOpen(false);
      setCityToDelete(null);
    } catch (error) {
      alert(`Error deleting city: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCloseAddCityDialog = () => {
    setIsAddCityDialogOpen(false);
    setEditingCity(null);
    setCityName('');
    setSelectedCityFromDropdown('');
    setShippingRate(0);
  };

  const handleMultiSelectCities = async () => {
    if (selectedCities.length === 0) {
      return;
    }

    try {
      for (const cityName of selectedCities) {
        await addCity(countryName, stateName, cityName, bulkShippingRate);
      }

      handleCloseMultiSelectDialog();
    } catch (error) {
      alert(`Error adding cities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCloseMultiSelectDialog = () => {
    setIsMultiSelectDialogOpen(false);
    setSelectedCities([]);
    setBulkShippingRate(100);
  };

  const handleCitySelectionChange = (cityName: string, checked: boolean) => {
    if (checked) {
      setSelectedCities(prev => [...prev, cityName]);
    } else {
      setSelectedCities(prev => prev.filter(name => name !== cityName));
    }
  };

  // Removed formatPrice function as we're not using currency symbols

  // Removed getTotalRevenue function as we removed KPIs

  // Removed unused function

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
          onClick={() => router.push(`/dashboard/shipping/countries/${countryId}?name=${encodeURIComponent(countryName)}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {countryName}
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Map className="h-8 w-8 text-green-600" />
            {stateName}
          </h1>
          <p className="text-muted-foreground">
            Manage cities and shipping rates for {stateName}, {countryName}
          </p>
        </div>
      </div>

      {/* Simple Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <Map className="h-4 w-4" />
          <span>{safeStateCities.length} Cities Added</span>
        </div>
        <div className="flex items-center gap-1">
          <Map className="h-4 w-4" />
          <span>{safeAvailableCities.length} Available</span>
        </div>
      </div>

      {/* Add City Actions */}
      <div className="flex gap-2">
        <Dialog open={isAddCityDialogOpen} onOpenChange={setIsAddCityDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddCityDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Single City
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {editingCity ? 'Edit City' : 'Add New City'}
              </DialogTitle>
              <DialogDescription>
                {editingCity 
                  ? 'Update the city name and shipping rate.'
                  : `Add a new city to ${stateName}, ${countryName}.`
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={editingCity ? handleUpdateCity : handleAddCity} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cityName">City Name *</Label>
                <div className="space-y-2">
                  <Select value={selectedCityFromDropdown} onValueChange={(value) => {
                    setSelectedCityFromDropdown(value);
                    setCityName(value);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a city from stored cities" />
                    </SelectTrigger>
                    <SelectContent>
                      {safeAvailableCities
                        .filter(city => !safeStateCities.some((stateCity: City) => stateCity.name === city))
                        .map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <div className="text-center text-sm text-muted-foreground">OR</div>
                  <Input
                    id="cityName"
                    value={cityName}
                    onChange={(e) => setCityName(e.target.value)}
                    placeholder="Enter custom city name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shippingRate">
                  Shipping Rate *
                </Label>
                <Input
                  id="shippingRate"
                  type="number"
                  value={shippingRate}
                  onChange={(e) => setShippingRate(parseFloat(e.target.value) || 0)}
                  placeholder="Enter shipping rate"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseAddCityDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={operationLoading}>
                  {operationLoading ? 'Saving...' : (editingCity ? 'Update' : 'Add')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isMultiSelectDialogOpen} onOpenChange={setIsMultiSelectDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" onClick={() => setIsMultiSelectDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Multiple Cities
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Add Multiple Cities</DialogTitle>
              <DialogDescription>
                Select multiple cities from the available dataset for {stateName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Available Cities ({safeAvailableCities.length})</Label>
                <Badge variant="outline">
                  {selectedCities.length} selected
                </Badge>
              </div>
              
              <div className="max-h-60 overflow-y-auto border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2">
                  {safeAvailableCities
                    .filter(city => !safeStateCities.some((stateCity: City) => stateCity.name === city))
                    .map((city) => (
                      <div key={city} className="flex items-center space-x-2">
                        <Checkbox
                          id={city}
                          checked={selectedCities.includes(city)}
                          onCheckedChange={(checked) => handleCitySelectionChange(city, checked as boolean)}
                        />
                        <Label htmlFor={city} className="text-sm">
                          {city}
                        </Label>
                      </div>
                    ))}
                </div>
              </div>
              
              {selectedCities.length > 0 && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-medium mb-2">Selected Cities:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedCities.map((city) => (
                        <Badge key={city} variant="secondary" className="text-xs">
                          {city}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bulkShippingRate">
                      Shipping Cost for All Selected Cities
                    </Label>
                    <Input
                      id="bulkShippingRate"
                      type="number"
                      value={bulkShippingRate}
                      onChange={(e) => setBulkShippingRate(parseFloat(e.target.value) || 0)}
                      placeholder="Enter shipping cost"
                      min="0"
                      step="0.01"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      This cost will be applied to all {selectedCities.length} selected cities
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={handleCloseMultiSelectDialog}>
                Cancel
              </Button>
              <Button 
                onClick={handleMultiSelectCities} 
                disabled={selectedCities.length === 0 || operationLoading}
              >
                {operationLoading ? 'Adding...' : `Add ${selectedCities.length} Cities`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cities Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Cities ({safeStateCities.length})
          </CardTitle>
          <CardDescription>
            Manage cities and their shipping rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>City</TableHead>
                    <TableHead>Shipping Rate</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        {safeStateCities.length === 0 
                          ? 'No cities added yet. Start by adding cities to this state.'
                          : 'No cities found matching your search.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCities.map((city: City) => (
                      <TableRow key={city.name}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Map className="h-4 w-4" />
                            <span className="font-medium">{city.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-green-600">
                            {city.price}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditCity(city)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCity(city.name)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete City</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{cityToDelete?.name}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteCity}
              disabled={operationLoading}
            >
              {operationLoading ? 'Deleting...' : 'Delete City'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
