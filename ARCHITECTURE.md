# Travel Heaven - Architecture Diagrams

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT BROWSER                           │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Admin UI     │  │ Guide UI     │  │ User UI      │          │
│  │ - Approvals  │  │ - Add Loc    │  │ - Browse     │          │
│  │ - Stats      │  │ - Add Hotel  │  │ - Book       │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│                  React + Router + Zustand                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS.JS SERVER                           │
│                                                                   │
│  ┌────────────────── MIDDLEWARE STACK ─────────────────────┐   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │   │
│  │  │ Auth     │→ │ Authorize│→ │ Validate │→ │ Upload │ │   │
│  │  │ (Decor)  │  │ (Strategy│  │ (Decor)  │  │ (Decor)│ │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘ │   │
│  └───────────────────────────────────────────────────────────┘   │
│                              │                                    │
│  ┌────────────────── CONTROLLERS ──────────────────────┐        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │        │
│  │  │ Auth     │  │ Location │  │ Hotel    │  etc... │        │
│  │  │ Controller│  │ Controller│  │ Controller│        │        │
│  │  └──────────┘  └──────────┘  └──────────┘         │        │
│  └───────────────────────────────────────────────────────┘        │
│                              │                                    │
│  ┌────────────────── PATTERNS ──────────────────────┐           │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │           │
│  │  │ Factory  │  │ Observer │  │ Strategy │      │           │
│  │  │ (Create) │  │ (Notify) │  │ (Authorize)│     │           │
│  │  └──────────┘  └──────────┘  └──────────┘      │           │
│  └──────────────────────────────────────────────────────┘           │
│                              │                                    │
│  ┌────────────────── REPOSITORIES ──────────────────┐           │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │           │
│  │  │ Location │  │ Hotel    │  │ Transport│      │           │
│  │  │ Repo     │  │ Repo     │  │ Repo     │      │           │
│  │  └──────────┘  └──────────┘  └──────────┘      │           │
│  └──────────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (MongoDB)                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Users    │  │ Locations│  │ Hotels   │  │ Transport│       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                    Singleton Connection                          │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Request Flow - Guide Adds Location

```
1. Guide UI
   │
   ├─ User fills form with location details
   ├─ Uploads images
   └─ Submits
      │
      ▼
2. Frontend
   │
   ├─ Validates input
   ├─ Attaches JWT token
   └─ POST /api/locations
      │
      ▼
3. Express Server - Middleware Chain (Decorator Pattern)
   │
   ├─ authenticate
   │  ├─ Verifies JWT token
   │  └─ Attaches user to request
   │
   ├─ authorize('guide')
   │  └─ Checks user.role === 'guide'
   │
   ├─ upload.array('images', 5)
   │  └─ Processes uploaded images
   │
   └─ validate
      └─ Validates request body
      │
      ▼
4. Location Controller
   │
   ├─ Receives validated request
   └─ Calls repository
      │
      ▼
5. Factory Pattern
   │
   └─ Creates LocationRepository
      │
      ▼
6. Location Repository (Repository Pattern)
   │
   ├─ Adds guideId and status='pending'
   └─ Saves to database
      │
      ▼
7. Database (Singleton Connection)
   │
   └─ Stores location document
      │
      ▼
8. Observer Pattern
   │
   ├─ EmailNotificationObserver → Sends email to admin
   ├─ LogNotificationObserver → Logs event
   └─ DatabaseNotificationObserver → Saves notification
      │
      ▼
9. Response
   │
   └─ Returns success with location data
      │
      ▼
10. Frontend
    │
    ├─ Shows success toast
    └─ Updates UI
```

## 🔒 Admin Approval Flow

```
1. Admin Dashboard
   │
   └─ Views pending items
      │
      ▼
2. Admin clicks "Approve" on location
   │
   └─ PUT /api/admin/approve/location/:id
      │
      ▼
3. Middleware Chain
   │
   ├─ authenticate → Verifies JWT
   ├─ authorize('admin') → Checks admin role
   │
   ▼
4. Admin Controller
   │
   ├─ Gets repository from Factory
   └─ Updates approval status
      │
      ▼
5. Repository Pattern
   │
   ├─ Updates: approvalStatus = 'approved'
   ├─ Sets: approvedBy = adminId
   └─ Sets: approvedAt = now()
      │
      ▼
6. Observer Pattern (Notifications)
   │
   ├─ EmailNotificationObserver
   │  └─ Emails guide: "Your location was approved!"
   │
   ├─ LogNotificationObserver
   │  └─ Logs: "Location ABC approved by Admin XYZ"
   │
   └─ DatabaseNotificationObserver
      └─ Saves notification for guide
      │
      ▼
7. Response
   │
   └─ Returns updated location
      │
      ▼
8. Frontend
   │
   ├─ Shows success message
   ├─ Removes from pending list
   └─ Location now visible to all users
```

## 🎯 Strategy Pattern - Authorization

```
Request to create location
        │
        ▼
┌────────────────────────────────┐
│  authorize('guide', 'admin')   │
│  middleware                    │
└────────────────────────────────┘
        │
        ▼
┌────────────────────────────────┐
│  AuthorizationStrategyFactory  │
│  .createStrategy(user.role)    │
└────────────────────────────────┘
        │
        ├─── user.role = 'admin' ──→ AdminAuthorizationStrategy
        │                             └─ canAccess() → true (all access)
        │
        ├─── user.role = 'guide' ──→ GuideAuthorizationStrategy
        │                             └─ canAccess('location', 'create') → true
        │
        └─── user.role = 'user' ───→ UserAuthorizationStrategy
                                      └─ canAccess('location', 'create') → false
```

## 🏭 Factory Pattern - Repository Creation

```
Controller needs repository
        │
        ▼
┌─────────────────────────────────────┐
│  ServiceFactory.createRepository()  │
└─────────────────────────────────────┘
        │
        ├─── 'location' ──→ new LocationRepository()
        ├─── 'hotel' ─────→ new HotelRepository()
        ├─── 'transport' ─→ new TransportRepository()
        ├─── 'booking' ───→ new BookingRepository()
        └─── 'user' ──────→ new UserRepository()
                              │
                              ▼
                    All extend BaseRepository
                    (Repository Pattern)
```

## 👁️ Observer Pattern - Notification Flow

```
Admin approves location
        │
        ▼
┌─────────────────────────────┐
│  approvalSubject.notify()   │
│  (Subject)                  │
└─────────────────────────────┘
        │
        ├─────────────────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐   ┌──────────────────┐
│ EmailObserver    │   │ LogObserver      │
│ .update()        │   │ .update()        │
│ └─ Send email    │   │ └─ Write log     │
└──────────────────┘   └──────────────────┘
        │                         │
        │                         ▼
        │              ┌──────────────────┐
        │              │ DatabaseObserver │
        │              │ .update()        │
        └──────────────│ └─ Save notif    │
                       └──────────────────┘
```

## 🗄️ Repository Pattern - Data Access

```
Controller
    │
    └─ needs to find locations
        │
        ▼
┌──────────────────────────┐
│  LocationRepository      │
│  extends BaseRepository  │
└──────────────────────────┘
        │
        ├─ findAll(filter, options)
        ├─ findById(id)
        ├─ findApproved() ← Specific to Location
        ├─ findPending() ← Specific to Location
        ├─ create(data)
        ├─ update(id, data)
        └─ delete(id)
            │
            ▼
┌──────────────────────────┐
│  Mongoose Model          │
│  (Location)              │
└──────────────────────────┘
            │
            ▼
┌──────────────────────────┐
│  MongoDB Database        │
│  (Singleton Connection)  │
└──────────────────────────┘
```

## 🎭 Role-Based UI

```
User Login
    │
    ▼
┌─────────────────────┐
│  Check user.role    │
└─────────────────────┘
    │
    ├─── role = 'admin' ──→ Admin Dashboard
    │                       ├─ Pending Approvals
    │                       ├─ Statistics
    │                       └─ All Content
    │
    ├─── role = 'guide' ──→ Guide Dashboard
    │                       ├─ My Locations
    │                       ├─ My Hotels
    │                       └─ My Transport
    │
    └─── role = 'user' ───→ User Dashboard
                            ├─ Browse Locations
                            ├─ Browse Hotels
                            └─ My Bookings
```

## 🔐 Authentication Flow

```
1. User submits login credentials
        │
        ▼
2. Backend verifies (bcrypt compare)
        │
        ├─ Invalid → 401 Unauthorized
        │
        └─ Valid
            │
            ▼
3. Generate JWT token
   ├─ Payload: { userId, role }
   ├─ Secret: JWT_SECRET
   └─ Expiry: 7 days
        │
        ▼
4. Send token to client
        │
        ▼
5. Client stores token (localStorage)
        │
        ▼
6. Subsequent requests
   ├─ Attach token in header
   │  └─ Authorization: Bearer <token>
   │
   ▼
7. Backend verifies token
   ├─ Invalid → 401 & redirect to login
   └─ Valid → Attach user to request
```

## 📊 Data Model Relationships

```
User
 ├─ role: admin | guide | user
 │
 ├─ If Guide:
 │   ├─→ Location (guideId)
 │   ├─→ Hotel (guideId)
 │   └─→ Transport (guideId)
 │
 ├─ If User:
 │   └─→ Booking (userId)
 │
 └─ If Admin:
     └─→ Approvals (approvedBy)

Location
 ├─ guideId → User (Guide)
 ├─ approvalStatus: pending | approved | rejected
 ├─ approvedBy → User (Admin)
 └─→ Hotel (locationId)
 └─→ Transport (locationId)

Hotel
 ├─ locationId → Location
 ├─ guideId → User (Guide)
 ├─ approvalStatus
 └─ approvedBy → User (Admin)

Transport
 ├─ locationId → Location
 ├─ guideId → User (Guide)
 ├─ approvalStatus
 └─ approvedBy → User (Admin)

Booking
 ├─ userId → User
 ├─ referenceId → Hotel | Transport
 ├─ bookingType: hotel | transport | package
 └─ status: pending | confirmed | cancelled
```

## 🌟 Pattern Interactions

```
                    ┌─────────────┐
                    │   Request   │
                    └─────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  Decorator Pattern (Middleware)│
         │  ├─ Authenticate               │
         │  ├─ Authorize (Strategy)       │
         │  └─ Validate                   │
         └────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │       Controller               │
         └────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  Factory Pattern               │
         │  (Create Repository)           │
         └────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  Repository Pattern            │
         │  (Data Access)                 │
         └────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │  Singleton Pattern             │
         │  (Database Connection)         │
         └────────────────────────────────┘
                          │
                    ┌─────┴─────┐
                    │           │
                    ▼           ▼
         ┌──────────────┐  ┌──────────────┐
         │   Database   │  │   Observer   │
         │              │  │   (Notify)   │
         └──────────────┘  └──────────────┘
                                  │
                        ┌─────────┼─────────┐
                        ▼         ▼         ▼
                    Email      Log      Database
```

---

**Note**: These diagrams show the flow and structure of the application. 
Refer to actual code files for implementation details.
