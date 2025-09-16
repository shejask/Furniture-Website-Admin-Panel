'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, MapPin, ArrowRight } from 'lucide-react';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import type { Country } from '@/types/shipping';

export function CountriesOverview() {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [countryName, setCountryName] = useState('');

  const { data: countries, loading: countriesLoading } = useFirebaseData('shipping_countries');
  const { data: states, loading: statesLoading } = useFirebaseData('shipping_states');
  const { data: cities, loading: citiesLoading } = useFirebaseData('shipping_cities');
  const { createWithKey, update, remove, loading: operationLoading } = useFirebaseOperations();

  const loading = countriesLoading || statesLoading || citiesLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!countryName.trim()) {
      return;
    }

    try {
      const countryData = {
        name: countryName.trim(),
        createdAt: editingCountry ? editingCountry.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingCountry) {
        await update(`shipping_countries/${editingCountry.id}`, countryData);
      } else {
        await createWithKey('shipping_countries', countryData);
      }

      handleCloseDialog();
    } catch (error) {
      console.error('Error saving country:', error);
    }
  };

  const handleEdit = (country: Country) => {
    setEditingCountry(country);
    setCountryName(country.name);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string, countryName: string) => {
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
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCountry(null);
    setCountryName('');
  };

  const getStatesForCountry = (countryId: string) => {
    return Object.values(states || {}).filter((state: any) => state.countryId === countryId);
  };

  const getCitiesForCountry = (countryId: string) => {
    return Object.values(cities || {}).filter((city: any) => city.countryId === countryId);
  };

  const navigateToState = (countryId: string, countryName: string) => {
    router.push(`/dashboard/shipping/countries/${countryId}?name=${encodeURIComponent(countryName)}`);
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
      {/* Add Country Button */}
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="countryName">Country Name *</Label>
                <Input
                  id="countryName"
                  value={countryName}
                  onChange={(e) => setCountryName(e.target.value)}
                  placeholder="Enter country name"
                  required
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
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

      {/* Countries Grid */}
      {countries && Object.keys(countries).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(countries).map(([countryId, country]: [string, any]) => {
            const countryStates = getStatesForCountry(countryId);
            const countryCities = getCitiesForCountry(countryId);
            
            return (
              <Card key={countryId} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg">{country.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit({ ...country, id: countryId });
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(countryId, country.name);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">

                    {countryStates.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">States:</p>
                        <div className="flex flex-wrap gap-1">
                          {countryStates.slice(0, 3).map((state: any) => (
                            <Badge key={state.id} variant="secondary" className="text-xs">
                              {state.name}
                            </Badge>
                          ))}
                          {countryStates.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{countryStates.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <Button 
                      className="w-full mt-4" 
                      variant="outline"
                      onClick={() => navigateToState(countryId, country.name)}
                    >
                      <span>Manage States</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No Countries Found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by adding your first country to set up shipping rules.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Country
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
