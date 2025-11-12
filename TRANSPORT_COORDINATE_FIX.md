# 🐛 Transport Form Coordinate Format Fix

## Issue
When selecting a location using `LocationSearchInput`, the form crashed with:
```
TypeError: Cannot read properties of undefined (reading 'toFixed')
at Transport.jsx:407:62
```

## Root Cause
**Data Format Mismatch:**
- `LocationSearchInput` returns: `{ latitude: 23.8103, longitude: 90.4125 }` (object)
- Code was expecting: `[90.4125, 23.8103]` (array)

## Solution
Updated all coordinate access throughout `Transport.jsx` to use object properties instead of array indices.

### Changes Made:

#### 1. From Location Display (Line ~407)
**Before:**
```javascript
GPS: {form.fromLocation.coordinates[1].toFixed(4)}, {form.fromLocation.coordinates[0].toFixed(4)}
```

**After:**
```javascript
GPS: {form.fromLocation.coordinates.latitude.toFixed(4)}, {form.fromLocation.coordinates.longitude.toFixed(4)}
```

#### 2. To Location Display (Line ~435)
**Before:**
```javascript
GPS: {form.toLocation.coordinates[1].toFixed(4)}, {form.toLocation.coordinates[0].toFixed(4)}
```

**After:**
```javascript
GPS: {form.toLocation.coordinates.latitude.toFixed(4)}, {form.toLocation.coordinates.longitude.toFixed(4)}
```

#### 3. Form Submission - Route Data (Line ~200-225)
**Before:**
```javascript
const routeData = {
  from: {
    name: form.fromLocation.name,
    address: form.fromLocation.address,
    location: {
      type: 'Point',
      coordinates: [form.fromLocation.coordinates[0], form.fromLocation.coordinates[1]]
    }
  },
  // ...
}
```

**After:**
```javascript
const routeData = {
  from: {
    name: form.fromLocation.name,
    address: form.fromLocation.fullAddress,  // Also fixed: address → fullAddress
    location: {
      type: 'Point',
      coordinates: [form.fromLocation.coordinates.longitude, form.fromLocation.coordinates.latitude]
    }
  },
  // ...
}
```

#### 4. Additional Fixes
- Changed `address` to `fullAddress` (LocationSearchInput uses `fullAddress`)
- Fixed stops array mapping to use correct coordinate format
- Ensured MongoDB format: `[longitude, latitude]` (correct GeoJSON format)

## LocationSearchInput Data Structure

The component returns:
```javascript
{
  id: "12345",
  name: "Atish Dipankar Road",
  fullAddress: "Atish Dipankar Road, Karatitola, Saydabad, Dhaka, Bangladesh",
  coordinates: {
    latitude: 23.7367,
    longitude: 90.4125
  },
  type: "custom",
  category: "road"
}
```

## MongoDB GeoJSON Format

Backend expects (and we now provide):
```javascript
{
  type: "Point",
  coordinates: [longitude, latitude]  // [lng, lat] - NOT [lat, lng]!
}
```

**Important:** MongoDB 2dsphere indexes require `[longitude, latitude]` order!

## Testing Checklist

✅ Select "From" location - Should display GPS without crashing
✅ Select "To" location - Should display GPS without crashing  
✅ Add stops - Should display address correctly
✅ Submit form - Should convert to correct backend format
✅ Check MongoDB - Coordinates should be [lng, lat] format

## Files Modified

- `frontend/src/pages/guide/Transport.jsx` (4 sections updated)

## Status

✅ **FIXED** - Form now works correctly with LocationSearchInput coordinate format
