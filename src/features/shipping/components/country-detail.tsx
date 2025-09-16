
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building2, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { useCountry, useShippingOperations } from '@/hooks/use-shipping-data';
import { getStatesByCountry } from '@/utils/location-utils';
import type { State } from '@/lib/shipping-database';

interface CountryDetailProps {
  countryId: string;
  countryName: string;
}

export function CountryDetail({ countryId, countryName }: CountryDetailProps) {
  const router = useRouter();
  
  const [selectedStateName, setSelectedStateName] = useState<string>('');
  const [isAddStateDialogOpen, setIsAddStateDialogOpen] = useState(false);
  const [editingState, setEditingState] = useState<State | null>(null);
  const [customStateName, setCustomStateName] = useState('');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [stateToDelete, setStateToDelete] = useState<{name: string} | null>(null);

  const { country, loading } = useCountry(countryName);
  const { addState, removeState, loading: operationLoading } = useShippingOperations();

  // Get all available states from JSON data for this country
  const availableStates = getStatesByCountry(countryName);
  
  // Get states already added to this country
  const addedStates = country?.states || [];

  const handleAddState = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStateName) {
      alert('Please select a state from the dropdown');
      return;
    }

    try {
      await addState(countryName, selectedStateName);
      handleCloseAddStateDialog();
    } catch (error) {
      alert(`Error adding state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEditState = (state: State) => {
    setEditingState(state);
    setCustomStateName(state.state);
    setIsAddStateDialogOpen(true);
  };

  const handleUpdateState = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customStateName.trim() || !editingState) {
      return;
    }

    try {
      // For now, we'll remove the old state and add the new one
      // In a more sophisticated implementation, you might want to update the state name directly
      await removeState(countryName, editingState.state);
      await addState(countryName, customStateName.trim());
      handleCloseAddStateDialog();
    } catch (error) {
      alert(`Error updating state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteState = async (stateName: string) => {
    setStateToDelete({ name: stateName });
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteState = async () => {
    if (!stateToDelete) {
      return;
    }
    
    try {
      await removeState(countryName, stateToDelete.name);
      
      // Close dialog and reset state
      setIsDeleteDialogOpen(false);
      setStateToDelete(null);
    } catch (error) {
      const err = error as Error;
      alert(`Error deleting state: ${err.message || error}`);
    }
  };

  const handleCloseAddStateDialog = () => {
    setIsAddStateDialogOpen(false);
    setEditingState(null);
    setSelectedStateName('');
    setCustomStateName('');
  };

  const getCitiesForState = (stateName: string) => {
    const state = addedStates.find(s => s.state === stateName);
    return state?.cities || [];
  };

  const navigateToStateDetail = (stateName: string) => {
    router.push(`/dashboard/shipping/countries/${countryId}/states/${encodeURIComponent(stateName)}?countryName=${encodeURIComponent(countryName)}&stateName=${encodeURIComponent(stateName)}`);
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
            <Building2 className="h-8 w-8 text-blue-600" />
            {countryName}
          </h1>
          <p className="text-muted-foreground">
            Manage states for {countryName}
          </p>
        </div>
      </div>

      {/* Add State Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add State
          </CardTitle>
          <CardDescription>
            Add states from the pre-loaded dataset
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>Select from Available States</Label>
              <Select value={selectedStateName} onValueChange={setSelectedStateName}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a state from the dataset" />
                </SelectTrigger>
                <SelectContent>
                  {availableStates
                    .filter(state => !addedStates.some((addedState: any) => addedState.name === state.name))
                    .map((state) => (
                      <SelectItem key={state.code} value={state.name}>
                        <div className="flex items-center justify-between w-full">
                          <span>{state.name}</span>
                          <Badge variant="outline" className="ml-2">
                            {state.cities.length} cities
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isAddStateDialogOpen} onOpenChange={setIsAddStateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  disabled={!selectedStateName}
                  onClick={() => setIsAddStateDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add State
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>
                    {editingState ? 'Edit State' : 'Add State'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingState 
                      ? 'Update the state name.'
                      : selectedStateName 
                        ? `Add "${selectedStateName}" to ${countryName}`
                        : 'Select a state from the dropdown to add it to this country'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={editingState ? handleUpdateState : handleAddState} className="space-y-4">
                  {!editingState && selectedStateName && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm font-medium">Selected State:</p>
                      <p className="text-lg">{selectedStateName}</p>
                      <p className="text-sm text-muted-foreground">
                        {availableStates.find(s => s.name === selectedStateName)?.cities.length || 0} cities available
                      </p>
                    </div>
                  )}
                  
                  {editingState && (
                    <div className="space-y-2">
                      <Label htmlFor="customStateName">State Name</Label>
                      <Input
                        id="customStateName"
                        value={customStateName}
                        onChange={(e) => setCustomStateName(e.target.value)}
                        placeholder="Enter state name"
                        required
                      />
                    </div>
                  )}

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={handleCloseAddStateDialog}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={operationLoading}>
                      {operationLoading ? 'Saving...' : (editingState ? 'Update' : 'Add')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Added States */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Added States ({addedStates.length})
            </CardTitle>
            <CardDescription>
              States that have been added to {countryName}
            </CardDescription>
        </CardHeader>
        <CardContent>
          {addedStates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {addedStates.map((state: State) => {
                const stateCities = getCitiesForState(state.state);
                const availableCities = availableStates.find(s => s.name === state.state)?.cities || [];
                
                return (
                  <Card key={state.state} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{state.state}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditState(state)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteState(state.state)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            <span>{stateCities.length} Cities Added</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {stateCities.length} Added
                          </Badge>
                          <Badge variant="outline">
                            {availableCities.length} Available
                          </Badge>
                        </div>

                        <Button 
                          className="w-full" 
                          onClick={() => navigateToStateDetail(state.state)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View State
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No states added yet.</p>
              <p className="text-sm">Add states from the dropdown above to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete State</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{stateToDelete?.name}&quot;? This action will also delete all cities associated with this state and cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteState}
              disabled={operationLoading}
            >
              {operationLoading ? 'Deleting...' : 'Delete State'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
