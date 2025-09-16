'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, ArrowLeft, Building2, Map, MapPin, DollarSign } from 'lucide-react';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import type { City, CityFormData } from '@/types/shipping';

interface StateDetailProps {
  countryId: string;
  stateId: string;
  countryName: string;
  stateName: string;
}

export function StateDetail({ countryId, stateId, countryName, stateName }: StateDetailProps) {
  const router = useRouter();
  
  // City management
  const [isCityDialogOpen, setIsCityDialogOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [cityFormData, setCityFormData] = useState<CityFormData>({ name: '', defaultPrice: 0 });

  const { data: cities, loading: citiesLoading } = useFirebaseData('shipping_cities');
  const { createWithKey, update, remove, loading: operationLoading } = useFirebaseOperations();

  const loading = citiesLoading;

  // Get cities for this state
  const stateCities = Object.values(cities || {}).filter((city: any) => city.stateId === stateId);

  const handleCitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cityFormData.name.trim()) {
      return;
    }

    if (cityFormData.defaultPrice < 0) {
      return;
    }

    try {
      const cityData = {
        countryId: countryId,
        stateId: stateId,
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
      alert('Error saving city. Please try again.');
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

  const getTotalRevenue = () => {
    return stateCities.reduce((total, city: any) => total + city.defaultPrice, 0);
  };

  const getAveragePrice = () => {
    if (stateCities.length === 0) return 0;
    return getTotalRevenue() / stateCities.length;
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
          onClick={() => router.push(`/dashboard/shipping/countries/${countryId}?name=${encodeURIComponent(countryName)}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {countryName}
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-green-600" />
            {stateName}
          </h1>
          <p className="text-muted-foreground">
            Manage cities and shipping prices for {stateName}, {countryName}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Map className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stateCities.length}</p>
                <p className="text-sm text-muted-foreground">Total Cities</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{formatPrice(getTotalRevenue())}</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{formatPrice(getAveragePrice())}</p>
                <p className="text-sm text-muted-foreground">Average Price</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add City Button */}
      <div className="flex justify-end">
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
                  ? 'Update the city name and default shipping price.'
                  : `Add a new city to ${stateName}, ${countryName} with default shipping price.`
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
                <Label htmlFor="defaultPrice">Default Shipping Price (₹) *</Label>
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
                <p className="text-xs text-muted-foreground">
                  This will be the default shipping cost for this city
                </p>
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

      {/* Cities Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Cities in {stateName}
          </CardTitle>
          <CardDescription>
            Manage cities and their default shipping prices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stateCities.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City</TableHead>
                  <TableHead>Default Price</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stateCities.map((city: any) => (
                  <TableRow key={city.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Map className="h-4 w-4" />
                        <span className="font-medium">{city.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-600">
                          {formatPrice(city.defaultPrice)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(city.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(city.updatedAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCity({ ...city, id: city.id })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCity(city.id, city.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Map className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No Cities Added Yet</h3>
              <p className="mb-4">
                Start by adding cities to {stateName} with their default shipping prices.
              </p>
              <Button onClick={() => setIsCityDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First City
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
