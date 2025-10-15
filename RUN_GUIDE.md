# 🚀 TravelHeaven - Complete Run Guide

## ✅ Prerequisites Checklist
- [x] MongoDB Atlas connected (`mongodb+srv://ovijitbhalo:ABCDef123@cluster0.ovn2xfw.mongodb.net/travelheaven`)
- [x] Node.js installed
- [x] Backend dependencies installed
- [x] Frontend dependencies installed (including Leaflet for maps)
- [x] Database seeded with sample data

---

## 🎯 Quick Start (3 Steps)

### Step 1: Start Backend Server
```powershell
cd "d:\Undergrad\3rd Year\3-2\CSE 3216 Software Design Patterns Lab\TravelHeaven\backend"
npm run dev
```
✅ Backend will run on: **http://localhost:5000**

### Step 2: Start Frontend (New Terminal)
```powershell
cd "d:\Undergrad\3rd Year\3-2\CSE 3216 Software Design Patterns Lab\TravelHeaven\frontend"
npm run dev
```
✅ Frontend will run on: **http://localhost:5173** (Vite)

### Step 3: Login with Seeded Accounts
| Role  | Email                  | Password   |
|-------|------------------------|------------|
| Admin | admin@example.com      | adminpass  |
| Guide | guide1@example.com     | guidepass  |
| User  | user1@example.com      | userpass   |

---

## 🗺️ Itinerary Features Demo Path

### 1. **Browse Public Itineraries** (No Login Required)
- Navigate to `/itineraries/public`
- View community-shared trip plans
- See the sample public itinerary with interactive map

### 2. **Login as User**
- Email: `user1@example.com`
- Password: `userpass`

### 3. **View My Itineraries**
- Click "My Trips" in navigation
- See your created itineraries

### 4. **Create New Itinerary**
- Click "Create New Trip"
- Fill in trip details:
  - Title: "Summer Europe Adventure"
  - Start Date: (pick a date)
  - End Date: (pick date 7 days later)
  - Budget: 5000 USD
  - Check "Make public" if you want others to see it

### 5. **Plan Days & Stops**
- The form auto-generates day slots based on date range
- For each day:
  - Click "Add Location" to add existing locations
  - Click "Add Hotel" for accommodations
  - Click "Add Transport" for travel
  - Click "Add Custom Stop" for custom places (with lat/lng)
- Set time for each stop
- Add notes

### 6. **View Interactive Map**
- As you add stops, the map preview updates in real-time
- See all markers color-coded by type:
  - 🔵 Blue = Location
  - 🟢 Green = Hotel
  - 🟠 Amber = Transport
  - 🟣 Purple = Custom
- Route line connects stops in order

### 7. **Save & View Details**
- Click "Create Itinerary"
- Navigate to the detail view
- See:
  - Interactive full-size map
  - Day-by-day breakdown with cards
  - Budget tracker with spending progress
  - Completeness score (gamification)
  - Collaborators list

### 8. **Edit Itinerary**
- Click "Edit" button (if you're owner or have edit permission)
- Update title, description, or public status
- Add/remove stops
- Delete itinerary

---

## 🎨 Design Patterns in Action

### Observable in Real-Time
1. **Login as Admin** (`admin@example.com` / `adminpass`)
2. Go to Admin Panel → Approvals
3. Approve a location/hotel/transport
4. **Observer Pattern**: Console will show notification logs

### Strategy Pattern Demo
1. Login as different roles
2. Notice different UI/permissions:
   - **Admin**: See admin panel, can approve content
   - **Guide**: See guide dashboard, can create locations/hotels/transport
   - **User**: Can view approved content, create itineraries

### Repository Pattern
- Check browser DevTools → Network tab
- See clean API calls to `/api/itineraries/*`
- All data access abstracted through repositories

### Builder Pattern
- Create Itinerary form demonstrates step-by-step construction
- Data validation at each step
- Complex object built progressively

---

## 🌐 API Endpoints Reference

### Itineraries
```
GET    /api/itineraries/public        - Public itineraries
GET    /api/itineraries/my            - User's itineraries (auth)
POST   /api/itineraries               - Create itinerary (auth)
GET    /api/itineraries/:id           - Get itinerary details
PUT    /api/itineraries/:id           - Update itinerary (owner/editor)
DELETE /api/itineraries/:id           - Delete itinerary (owner only)
POST   /api/itineraries/:id/collaborators  - Add collaborator (owner)
DELETE /api/itineraries/:id/collaborators/:userId - Remove collaborator
POST   /api/itineraries/:id/expenses  - Add expense (owner/editor)
```

### Locations (Public GET)
```
GET    /api/locations                 - All approved locations (no auth)
GET    /api/locations/:id             - Location details (no auth)
POST   /api/locations                 - Create location (guide auth)
PUT    /api/locations/:id             - Update location (guide/admin)
DELETE /api/locations/:id             - Delete location (guide/admin)
```

### Hotels (Public GET)
```
GET    /api/hotels                    - All approved hotels (no auth)
GET    /api/hotels/:id                - Hotel details (no auth)
POST   /api/hotels                    - Create hotel (guide auth)
PUT    /api/hotels/:id                - Update hotel (guide/admin)
DELETE /api/hotels/:id                - Delete hotel (guide/admin)
```

### Transportation (Public GET)
```
GET    /api/transportation            - All approved transport (no auth)
GET    /api/transportation/:id        - Transport details (no auth)
POST   /api/transportation            - Create transport (guide auth)
PUT    /api/transportation/:id        - Update transport (guide/admin)
DELETE /api/transportation/:id        - Delete transport (guide/admin)
```

### Admin
```
POST   /api/admin/approve/:type/:id   - Approve content (admin only)
POST   /api/admin/reject/:type/:id    - Reject content (admin only)
GET    /api/admin/stats               - Dashboard statistics (admin only)
```

### Auth
```
POST   /api/auth/register             - Register new user
POST   /api/auth/login                - Login
GET    /api/auth/me                   - Get current user (auth)
PUT    /api/auth/profile              - Update profile (auth)
```

---

## 🗺️ Map Features

### Leaflet Integration
- **Tile Layer**: OpenStreetMap
- **Custom Markers**: Color-coded by stop type
- **Popups**: Click markers to see stop details
- **Route Line**: Dashed line connects stops
- **Auto-fit Bounds**: Map zooms to show all stops
- **Responsive**: Works on all screen sizes

### Marker Colors
- 🔵 **Blue** = Location (tourist attraction)
- 🟢 **Green** = Hotel (accommodation)
- 🟠 **Amber** = Transport (bus, train, flight)
- 🟣 **Purple** = Custom stop

---

## 🎮 Testing Scenarios

### Scenario 1: Tourist Planning Trip
1. Login as user1
2. Browse public itineraries for inspiration
3. Browse approved locations, hotels, transport
4. Create new itinerary with 3-day plan
5. Add stops from existing locations
6. Set budget and track expenses
7. Make itinerary public to share with community

### Scenario 2: Guide Creating Content
1. Login as guide1
2. Go to Guide Dashboard
3. Create new location with photo, coordinates
4. Wait for admin approval (status: pending)
5. Once approved, appears in public listings

### Scenario 3: Admin Approving Content
1. Login as admin
2. Go to Admin Panel → Approvals
3. See pending locations/hotels/transport
4. Approve or reject with comments
5. Check dashboard statistics

### Scenario 4: Collaboration
1. User1 creates itinerary
2. Add user2 as collaborator with "edit" permission
3. User2 can now edit the itinerary
4. Both see changes in real-time (future: WebSocket)

---

## 📊 Database Collections

### Collections in MongoDB Atlas:
- **users** - User accounts (admin, guide, user)
- **locations** - Tourist locations
- **hotels** - Accommodations
- **transports** - Transportation options
- **bookings** - User bookings
- **itineraries** - Trip plans with days/stops

### Sample Itinerary Structure:
```json
{
  "_id": "...",
  "title": "Paris Weekend",
  "ownerId": "user1_id",
  "collaborators": [
    { "userId": "user2_id", "permission": "view" }
  ],
  "isPublic": true,
  "startDate": "2025-06-01",
  "endDate": "2025-06-03",
  "days": [
    {
      "date": "2025-06-01",
      "stops": [
        {
          "type": "location",
          "referenceId": "location_id",
          "name": "Eiffel Tower",
          "time": "10:00",
          "coordinates": { "lat": 48.8584, "lng": 2.2945 },
          "notes": "Take photos",
          "order": 0
        }
      ]
    }
  ],
  "budget": {
    "total": 2000,
    "currency": "USD",
    "expenses": [
      {
        "name": "Flight tickets",
        "amount": 500,
        "paidBy": "user1_id",
        "splitAmong": ["user1_id", "user2_id"]
      }
    ]
  },
  "completeness": 75,
  "status": "planning"
}
```

---

## 🐛 Troubleshooting

### Frontend CSS Warnings
**Issue**: Tailwind @apply/@tailwind warnings in index.css  
**Solution**: These are linter false-positives. Tailwind directives are processed at build time. Ignore them.

### MongoDB Connection Error
**Issue**: ECONNREFUSED on localhost  
**Solution**: Ensure you're using Atlas connection string, not localhost

### Maps Not Showing
**Issue**: Leaflet map is blank  
**Solution**: 
1. Check browser console for errors
2. Ensure `import 'leaflet/dist/leaflet.css'` in App.jsx
3. Verify stops have valid coordinates (lat/lng)

### Backend Port Already in Use
**Issue**: Port 5000 already in use  
**Solution**: 
```powershell
# Find process on port 5000
netstat -ano | findstr :5000
# Kill the process (replace PID)
taskkill /PID <PID> /F
```

---

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ Backend logs show `🚀 Server running on port 5000`
- ✅ Frontend shows `Local: http://localhost:5173`
- ✅ MongoDB shows `✅ MongoDB connected successfully`
- ✅ Login redirects you to home page
- ✅ Itinerary creation shows interactive map
- ✅ Public itineraries page shows sample data
- ✅ Map markers are visible and clickable
- ✅ Day cards show stops in order
- ✅ Budget tracker shows spending progress

---

## 🚀 Next Steps

1. **Add More Locations/Hotels**: Login as guide and populate database
2. **Create Real Trips**: Plan actual travel itineraries
3. **Collaborate**: Invite friends to edit trips together
4. **Explore Public Trips**: Browse community itineraries for inspiration
5. **Track Expenses**: Add real budget data and split costs

---

*Happy Travels! ✈️🗺️*
