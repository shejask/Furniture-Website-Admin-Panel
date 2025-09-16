# Shipping Management Feature

This feature provides comprehensive hierarchical shipping rule management for the admin panel.

## Overview

The shipping management system allows administrators to:
- **Add Countries**: Create new countries for shipping
- **Add States**: Add states under existing countries
- **Add Cities**: Add cities under states with default shipping prices
- **Edit/Delete**: Modify or remove any level of the hierarchy
- **Hierarchical View**: Collapsible tree structure showing Country → State → City

## Components

### ShippingTable
The main component that handles:
- **Hierarchical Display**: Collapsible tree view of Country → State → City
- **Three-Level Management**: Separate forms for countries, states, and cities
- **Cascading Deletes**: Deleting a country removes all its states and cities
- **Real-time Updates**: Changes reflected immediately via Firebase
- **Form Validation**: Comprehensive validation for all forms

## Data Structure

The system uses three separate Firebase collections:

### Countries (`shipping_countries`)
```typescript
{
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

### States (`shipping_states`)
```typescript
{
  id: string;
  countryId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

### Cities (`shipping_cities`)
```typescript
{
  id: string;
  stateId: string;
  countryId: string;
  name: string;
  defaultPrice: number;
  createdAt: string;
  updatedAt: string;
}
```

## Usage Workflow

1. **Add Country**: Click "Add Country" to create a new country
2. **Expand Country**: Click the chevron to expand and see states
3. **Add State**: Click the "+" button next to a country to add a state
4. **Expand State**: Click the chevron to see cities under that state
5. **Add City**: Click the "+" button next to a state to add a city with default price
6. **Edit/Delete**: Use the edit/delete buttons on any level

## Features

- **True Hierarchy**: Proper parent-child relationships between Country → State → City
- **Cascading Operations**: Deleting a country removes all associated states and cities
- **Default Pricing**: Each city has its own default shipping price
- **Collapsible Interface**: Expand/collapse to focus on specific areas
- **Visual Indicators**: Icons and counters show the structure clearly
- **Form Validation**: Comprehensive validation for all operations
- **Real-time Sync**: All changes sync immediately across the application

## Navigation

The shipping page is accessible at `/dashboard/shipping` with:
- Icon: Truck icon from Tabler Icons
- Shortcut: 's' + 'h' for quick access
- Position: After Notifications in the sidebar

## Utilities

The `shipping-utils.ts` file provides helper functions for:
- **Hierarchical Queries**: Get states for countries, cities for states
- **Location Lookups**: Find countries, states, cities by name
- **Price Retrieval**: Get shipping price for specific locations
- **Form Validation**: Validate forms at each level
- **Data Statistics**: Get counts of countries, states, and cities

## Example Usage

```typescript
// Get states for a country
const states = getStatesForCountry(statesData, countryId);

// Get cities for a state
const cities = getCitiesForState(citiesData, stateId);

// Get shipping price for a location
const price = getShippingPrice(countries, states, cities, "India", "Maharashtra", "Mumbai");
```
