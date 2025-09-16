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
import { Plus, Edit, Trash2, ArrowLeft, ArrowRight, Building2, Map, MapPin } from 'lucide-react';
import { useFirebaseData, useFirebaseOperations } from '@/hooks/use-firebase-database';
import type { State, City, StateFormData, CityFormData } from '@/types/shipping';

interface StatesDetailProps {
  countryId: string;
  countryName: string;
}

export function StatesDetail({ countryId, countryName }: StatesDetailProps) {
  const router = useRouter();
  
  // State management
  const [isStateDialogOpen, setIsStateDialogOpen] = useState(false);
  const [editingState, setEditingState] = useState<State | null>(null);
  const [stateFormData, setStateFormData] = useState<StateFormData>({ name: '' });


  const { data: countries, loading: countriesLoading } = useFirebaseData('shipping_countries');
  const { data: states, loading: statesLoading } = useFirebaseData('shipping_states');
  const { data: cities, loading: citiesLoading } = useFirebaseData('shipping_cities');
  const { createWithKey, update, remove, loading: operationLoading } = useFirebaseOperations();

  const loading = countriesLoading || statesLoading || citiesLoading;

  // Get states for this country
  const countryStates = Object.values(states || {}).filter((state: any) => state.countryId === countryId);

  const handleStateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stateFormData.name.trim()) {
      return;
    }

    try {
      const stateData = {
        countryId: countryId,
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
    setIsStateDialogOpen(true);
  };

  const handleDeleteState = async (id: string, stateName: string) => {
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
  };

  const handleCloseStateDialog = () => {
    setIsStateDialogOpen(false);
    setEditingState(null);
    setStateFormData({ name: '' });
  };


  const getCitiesForState = (stateId: string) => {
    return Object.values(cities || {}).filter((city: any) => city.stateId === stateId);
  };

  const formatPrice = (price: number) => {
    return `₹${price}`;
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

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Dialog open={isStateDialogOpen} onOpenChange={setIsStateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsStateDialogOpen(true)}>
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
                  : `Add a new state under ${countryName}.`
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleStateSubmit} className="space-y-4">
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

      </div>

      {/* States and Cities Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            States & Cities
          </CardTitle>
          <CardDescription>
            Manage states and their cities with shipping prices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {countryStates.length > 0 ? (
            <div className="space-y-6">
              {countryStates.map((state: any) => {
                const stateCities = getCitiesForState(state.id);
                
                return (
                  <div key={state.id} className="space-y-3">
                    {/* State Header */}
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        <span className="font-medium">{state.name}</span>
                        <Badge variant="outline">
                          {stateCities.length} cities
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditState({ ...state, id: state.id })}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteState(state.id, state.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Cities Preview */}
                    {stateCities.length > 0 ? (
                      <div className="ml-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Cities ({stateCities.length})</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/shipping/countries/${countryId}/states/${state.id}?countryName=${encodeURIComponent(countryName)}&stateName=${encodeURIComponent(state.name)}`)}
                          >
                            <span>Manage Cities</span>
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {stateCities.slice(0, 4).map((city: any) => (
                            <div key={city.id} className="flex items-center justify-between p-2 bg-muted/20 rounded text-sm">
                              <span className="flex items-center gap-1">
                                <Map className="h-3 w-3" />
                                {city.name}
                              </span>
                              <span className="font-medium text-green-600">
                                {formatPrice(city.defaultPrice)}
                              </span>
                            </div>
                          ))}
                          {stateCities.length > 4 && (
                            <div className="p-2 bg-muted/30 rounded text-sm text-center text-muted-foreground">
                              +{stateCities.length - 4} more cities
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="ml-4 p-4 text-center text-muted-foreground bg-muted/20 rounded">
                        <p className="mb-2">No cities added yet.</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/dashboard/shipping/countries/${countryId}/states/${state.id}?countryName=${encodeURIComponent(countryName)}&stateName=${encodeURIComponent(state.name)}`)}
                        >
                          <Plus className="mr-1 h-3 w-3" />
                          Add Cities
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No states found. Add your first state to start setting up cities.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
