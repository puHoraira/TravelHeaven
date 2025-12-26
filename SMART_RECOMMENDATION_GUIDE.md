# Smart Recommendation System - Complete Guide

## 🎯 Overview

The TravelHeaven smart recommendation system uses **design patterns** to generate personalized travel itineraries based on user preferences. It's now enhanced with strict validation, data quality scoring, and intelligent filtering.

---

## 🏗️ Architecture & Design Patterns

### 1. **Facade Pattern** (`RecommendationFacade`)
- Single entry point for the entire recommendation system
- Orchestrates: fetching → filtering → strategy → building → decoration
- **NEW**: Fetches only **approved** items with quality scoring

### 2. **Chain of Responsibility** (`FilterChainBuilder`)
- Sequential filters process and refine options
- Filters: Budget → Duration → Category → Rating → Availability
- **NEW**: Enhanced budget allocation and priority scoring

### 3. **Strategy Pattern** (`RecommendationStrategy`)
- 4 optimization strategies: Budget | Activity | Comfort | Time
- Each strategy scores and sorts differently
- **NEW**: Normalized field access (handles schema variations)

### 4. **Builder Pattern** (`ItineraryBuilder`)
- Constructs complex itinerary objects step-by-step
- Generates day-by-day plans with activities
- **NEW**: Proper price extraction from nested fields

### 5. **Decorator Pattern** (`ItineraryDecorator`)
- Adds enhancements: Luxury | Adventure | Cultural | Family-Friendly | Eco-Friendly
- Each decorator adds features and adjusts cost
- Decorators can be stacked

### 6. **Repository Pattern** (`LocationRepository`, `HotelRepository`, `TransportRepository`)
- Abstracts database access
- Provides `findApproved()` methods
- **NEW**: Used exclusively for approved items only

---

## ✅ NEW: Data Quality & Validation

### Input Validation (When Creating Items)

#### **Locations** (`location.controller.js`)
```javascript
Required Fields:
- name (min 3 chars)
- description (min 20 chars)
- country (min 2 chars)
- city (min 2 chars)
- category (historical|natural|adventure|cultural|beach|mountain|other)

Optional but Validated:
- coordinates (lat: -90 to 90, lon: -180 to 180)
- entryFee (>= 0, defaults to 0/free)
```

#### **Hotels** (`hotel.controller.js`)
```javascript
Required Fields:
- name (min 3 chars)
- description (min 20 chars)
- location.coordinates [longitude, latitude]
- priceRange.min (>= 0)
- amenities (array, min 1 item)
- contactInfo (phone OR email)

Validation:
- Coordinates: lon (-180 to 180), lat (-90 to 90)
- Price: max >= min
```

#### **Transport** (`transport.controller.js`)
```javascript
Required Fields:
- name (min 3 chars)
- type (bus|train|taxi|rental-car|flight|boat|launch|cng|rickshaw|other)
- route.from.name (min 2 chars)
- route.to.name (min 2 chars)
- pricing.amount (>= 0)

Validation:
- Route coordinates (if provided)
- Facilities must be array
```

### Data Normalization (During Recommendation Fetch)

The facade now **normalizes** all fetched data to handle schema variations:

```javascript
Locations:
✅ rating.average or rating (number) → normalized to { average, count }
✅ entryFee (number) or entryFee.amount → normalized to { amount, currency }
✅ Quality score calculated (rating + reviews + description + coordinates + images)
✅ Filters out items with qualityScore < 0.3

Hotels:
✅ rating.average, rating, or averageRating → normalized
✅ pricePerNight or priceRange.min or rooms[0].pricePerNight → normalized
✅ amenities or facilities → normalized
✅ Quality score (rating + amenities + price + location + contact)
✅ Filters out qualityScore < 0.3

Transport:
✅ rating.average, rating, or averageRating → normalized
✅ price or pricing.amount → normalized
✅ estimatedDuration or route.duration.estimated → parsed
✅ facilities array ensured
✅ Quality score (rating + route + pricing + facilities + operator)
✅ Filters out qualityScore < 0.3
```

---

## 🔍 Filter Pipeline (Chain of Responsibility)

### 1. **Budget Filter** (NEW Enhanced)
```javascript
Allocations:
- Hotels: 40% of budget (filters by pricePerNight * nights)
- Transport: 30% of budget (filters by pricing.amount)
- Locations: 30% of budget (for entry fees)

Priority Scoring:
- Free locations: 2.0 (highest)
- Low-cost (<10% budget): 1.5
- Medium-cost (<30% budget): 1.0
- Higher-cost: 0.5

Sorting:
- Hotels & Transport: by budget score (best value first)
- Locations: by priority, then rating
```

### 2. **Duration Filter**
```javascript
Rules:
- Max 3 locations per day
- Max 4 hours travel time per transport
- Sorts locations by rating
```

### 3. **Category Filter**
```javascript
Matches interests with location.category
Synonyms supported:
- relaxation → beach, resort, spa
- adventure → natural, mountain, hiking, outdoor
- cultural → historical, heritage, museum, temple
- shopping → market, bazaar, mall
- nature → natural, park, forest, wildlife
- beach → coastal, seaside, ocean
- historical → heritage, ancient, monument

Fallback: If no match, returns all with low relevance (0.1)
```

### 4. **Rating Filter** (NEW Enhanced)
```javascript
Minimum Rating: 3.5 (default, customizable)
Filters:
- Locations: rating.average >= minRating
- Hotels: rating.average >= minRating
- Transport: rating.average or averageRating >= minRating

Sorting:
- By rating descending
- Then by review count descending
```

### 5. **Availability Filter**
```javascript
Placeholder:
- 20% hotels marked unavailable
- 10% transport marked unavailable
- Locations always available

TODO: Integrate real booking system
```

---

## ⚙️ Recommendation Strategies

### 1. **Budget Optimized** (`optimizationGoal: 'budget'`)
```javascript
Focus: Minimize cost, maximize value
Scoring:
- Locations: 60% cost, 40% rating (free = best)
- Hotels: 70% cost, 30% rating
- Transport: 80% cost, 20% reliability
Result: Cheapest high-quality options
```

### 2. **Activity Driven** (`optimizationGoal: 'activity'`)
```javascript
Focus: Maximum experiences, variety
Scoring:
- Locations: 40% rating, 40% category match, 20% popularity
- Hotels: 60% rating, 40% amenities
- Diversity: Limits 2 locations per category
Result: Diverse, highly-rated experiences
```

### 3. **Comfort Prioritized** (`optimizationGoal: 'comfort'`)
```javascript
Focus: Quality, relaxation, fewer moves
Scoring:
- Locations: 70% rating, 30% crowd level
- Hotels: 50% rating, 30% amenities, 20% star rating
- Transport: 60% rating, 40% comfort class
Result: Fewer (2x duration) top-rated locations, luxury hotels
```

### 4. **Time Efficient** (`optimizationGoal: 'time'`)
```javascript
Focus: Minimal travel, efficient routing
Method:
- Clusters locations by city/region
- Selects top-rated from each cluster
- Prefers faster transport (flight, express train)
- Minimizes hotel changes (2 max)
Result: Optimized routes, fast transport
```

---

## 🎨 Decorator Enhancements

Add these to `preferences.enhancements`:

### 1. **Luxury** (`'luxury'`)
```javascript
Adds:
- 5-star hotels (+200% cost)
- Private transport (+300% cost)
- VIP guides, exclusive dining, concierge
Cost Multiplier: 2x
```

### 2. **Adventure** (`'adventure'`)
```javascript
Adds:
- Hiking, water sports, rock climbing
- Adventure-friendly hotels
- Safety equipment included
Cost Multiplier: 1.4x
```

### 3. **Cultural** (`'cultural'`)
```javascript
Adds:
- Museum tours, cooking classes
- Heritage walking tours, performances
- Prioritizes cultural/historical sites
Cost Multiplier: 1.3x
```

### 4. **Family-Friendly** (`'family-friendly'`)
```javascript
Adds:
- Theme parks, kid activities
- Family rooms, kids club
- Childcare services
Cost Multiplier: 1.25x
```

### 5. **Eco-Friendly** (`'eco-friendly'`)
```javascript
Adds:
- Eco-certified hotels
- Carbon-neutral transport
- Conservation activities
Cost Multiplier: 1.2x (includes offset)
```

---

## 🚀 How to Use

### API Endpoint
```http
POST /api/recommendations/generate
Authorization: Bearer <token>
Content-Type: application/json
```

### Request Body
```json
{
  "budget": 10000,
  "duration": 3,
  "startDate": "2026-01-10",
  "endDate": "2026-01-13",
  "interests": ["cultural", "nature"],
  "optimizationGoal": "budget",
  "minRating": 3.5,
  "enhancements": ["cultural"],
  "destination": "Dhaka",
  "region": "Bangladesh"
}
```

### Response
```json
{
  "success": true,
  "itinerary": {
    "id": "itin_...",
    "userId": "...",
    "title": "cultural, nature Trip",
    "description": "Auto-generated itinerary based on your preferences",
    "startDate": "2026-01-10",
    "endDate": "2026-01-13",
    "duration": 3,
    "destinations": [...],
    "accommodations": [...],
    "transportation": [...],
    "dailyPlans": [...],
    "estimatedCost": 8500,
    "budget": 10000,
    "strategy": "BudgetOptimized"
  },
  "summary": {
    "totalDestinations": 9,
    "totalCost": 8500,
    "features": ["Standard destinations", "Basic accommodations", ...],
    "description": "Standard itinerary + Cultural Immersion",
    "filtersApplied": ["BudgetFilter", "DurationFilter", "CategoryFilter", "RatingFilter"],
    "strategyUsed": "BudgetOptimized",
    "enhancements": ["cultural"]
  }
}
```

---

## 🧪 Testing the System

### 1. Seed Database (Already Done)
```bash
cd backend
npm run cleanup-seed
```

### 2. Start Backend
```bash
npm start
# Runs on http://localhost:5000
```

### 3. Start Frontend
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### 4. Login
```http
POST http://localhost:3000/api/auth/login
{
  "email": "user1@example.com",
  "password": "userpass"
}
```

### 5. Generate Recommendation
```http
POST http://localhost:3000/api/recommendations/generate
Authorization: Bearer <token>
{
  "budget": 10000,
  "duration": 3,
  "startDate": "2026-01-10",
  "endDate": "2026-01-13",
  "interests": ["cultural", "historical"],
  "optimizationGoal": "budget",
  "minRating": 3.5
}
```

### 6. Try Different Strategies
- Budget: `"optimizationGoal": "budget"`
- Activity: `"optimizationGoal": "activity"`
- Comfort: `"optimizationGoal": "comfort"`
- Time: `"optimizationGoal": "time"`

### 7. Add Enhancements
```json
{
  "enhancements": ["cultural", "eco-friendly"]
}
```

---

## 📊 Quality Scoring Formula

### Location Quality (0-1)
```javascript
score = 
  (rating/5) × 0.4 +
  min(reviewCount/100, 1) × 0.2 +
  min(descLength/200, 1) × 0.2 +
  hasCoordinates × 0.1 +
  hasImages × 0.1
```

### Hotel Quality (0-1)
```javascript
score = 
  (rating/5) × 0.4 +
  min(amenities/10, 1) × 0.2 +
  hasPrice × 0.2 +
  hasLocation × 0.1 +
  hasContact × 0.1
```

### Transport Quality (0-1)
```javascript
score = 
  (rating/5) × 0.3 +
  hasRoute × 0.3 +
  hasPricing × 0.2 +
  hasFacilities × 0.1 +
  hasOperator × 0.1
```

**Items with score < 0.3 are filtered out**

---

## 🔧 Configuration

### Adjust Budget Allocations
Edit `BudgetFilter` in `ChainOfResponsibility.js`:
```javascript
const hotelBudget = budget * 0.4;  // 40% for hotels
const transportBudget = budget * 0.3;  // 30% for transport
const locationBudget = budget * 0.3;  // 30% for activities
```

### Adjust Quality Threshold
Edit `RecommendationFacade.js`:
```javascript
.filter(loc => loc.qualityScore > 0.3);  // Change 0.3 to desired threshold
```

### Adjust Min Rating Default
Edit `RatingFilter` in `ChainOfResponsibility.js`:
```javascript
const { minRating = 3.5 } = preferences;  // Change 3.5 to desired default
```

---

## 🐛 Troubleshooting

### Issue: Empty recommendations
**Cause**: No approved items in database OR all filtered out
**Solution**:
1. Check database: `npm run init-users` then `npm run cleanup-seed`
2. Lower `minRating` (try 3.0 or 2.5)
3. Increase budget
4. Remove strict category filter (broaden interests)

### Issue: Zero estimated cost
**Cause**: Price fields not normalized (old data)
**Solution**: Re-seed database with `npm run cleanup-seed`

### Issue: No hotels/transport in result
**Cause**: Budget too low OR rating filter too strict
**Solution**:
1. Increase budget (try 15000+)
2. Lower `minRating` to 3.0
3. Check logs: `console.log` shows filter results

### Issue: Validation errors when creating items
**Cause**: Missing required fields OR invalid data
**Solution**: Check error response - it lists all validation failures

---

## 📈 Future Enhancements

1. **Real Availability Checking**: Replace random availability with actual booking data
2. **ML-based Scoring**: Use user history to personalize scores
3. **Multi-city Routes**: Support complex multi-destination trips
4. **Price Optimization**: Dynamic pricing based on dates
5. **User Feedback Loop**: Improve recommendations based on saved/liked itineraries
6. **Weather Integration**: Suggest activities based on forecast
7. **Real-time Traffic**: Adjust transport times dynamically

---

## 📝 Summary

The smart recommendation system now provides:

✅ **High Data Quality**: Strict validation on input, quality scoring on output  
✅ **Approved Items Only**: No pending/rejected items in recommendations  
✅ **Normalized Data**: Handles schema variations gracefully  
✅ **Smart Filtering**: Budget-aware, category-matching, rating-based  
✅ **4 Strategies**: Budget, Activity, Comfort, Time optimization  
✅ **5 Decorators**: Luxury, Adventure, Cultural, Family, Eco enhancements  
✅ **Complete Itineraries**: Day-by-day plans with costs  

**Result**: Personalized, high-quality, budget-optimized travel recommendations! 🎉
