# Travel Heaven - User Flow Diagram

## Route Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         PUBLIC ROUTES                            │
│                     (Non-Authenticated Users)                    │
└─────────────────────────────────────────────────────────────────┘

    /                           /login                    /register
┌─────────┐                  ┌─────────┐               ┌─────────┐
│ LANDING │  "Explore Now"   │  LOGIN  │               │REGISTER │
│  PAGE   │ ───────────────> │  PAGE   │               │  PAGE   │
│         │                  │         │               │         │
│ Pure    │  "Join as Guide" │ Unified │               │ Sign up │
│Homepage │ ───────────────> │ for ALL │               │ as role │
│         │                  │  users  │               │         │
└─────────┘                  └────┬────┘               └─────────┘
                                  │
                                  │ Login Success
                                  │ (Role-based redirect)
                                  ▼
                    ┌─────────────────────────────┐
                    │   Check user.role           │
                    └─────────────────────────────┘
                          │        │        │
              ┌───────────┘        │        └───────────┐
              │                    │                    │
        role='admin'         role='guide'         role='user'
              │                    │                    │
              ▼                    ▼                    ▼

┌─────────────────────────────────────────────────────────────────┐
│                        PROTECTED ROUTES                          │
│                     (Authenticated Users)                        │
└─────────────────────────────────────────────────────────────────┘


╔═══════════════════╗     ╔═══════════════════╗     ╔═══════════════════╗
║   ADMIN DOMAIN    ║     ║   GUIDE DOMAIN    ║     ║   USER DOMAIN     ║
║   (Big Control)   ║     ║  (Content Mgmt)   ║     ║  (Travel & Book)  ║
╚═══════════════════╝     ╚═══════════════════╝     ╚═══════════════════╝

/admin                    /guide                    /home
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Admin Dashboard │      │ Guide Dashboard │      │   User Home     │
│                 │      │                 │      │                 │
│ • Approvals     │      │ • My Locations  │      │ • My Trips      │
│ • All Locations │      │ • My Hotels     │      │ • Explore       │
│ • All Hotels    │      │ • My Transport  │      │ • Browse        │
│ • All Transport │      │ • Browse All    │      │ • Bookings      │
│ • All Guides    │      │ • My Rating     │      │                 │
│ • Statistics    │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘

/admin/approvals         /guide/locations         /itineraries
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Approval Center │      │  Add Location   │      │  My Itineraries │
│                 │      └─────────────────┘      └─────────────────┘
│ Approve/Reject: │      
│ • Locations     │      /guide/hotels            /locations
│ • Hotels        │      ┌─────────────────┐      ┌─────────────────┐
│ • Transport     │      │   Add Hotel     │      │ Browse Locations│
└─────────────────┘      └─────────────────┘      └─────────────────┘

                         /guide/transport         /hotels
Common Routes            ┌─────────────────┐      ┌─────────────────┐
(All Authenticated)      │ Add Transport   │      │  Browse Hotels  │
                         └─────────────────┘      └─────────────────┘
/locations
/hotels                                           /guides
/transportation                                   ┌─────────────────┐
/guides                                           │  Browse Guides  │
/profile                                          └─────────────────┘

                                                  /bookings
                                                  ┌─────────────────┐
                                                  │  My Bookings    │
                                                  └─────────────────┘
```

---

## Navigation Menu by Role

### Admin Navigation Bar:
```
┌──────────────────────────────────────────────────────────────────┐
│ [Logo] Dashboard | Approvals | Locations | Hotels | Transport |  │
│        Guides | Profile | [Logout]                               │
└──────────────────────────────────────────────────────────────────┘
```

### Guide Navigation Bar:
```
┌──────────────────────────────────────────────────────────────────┐
│ [Logo] Dashboard | My Locations | My Hotels | My Transport |     │
│        Browse | Profile | [Logout]                               │
└──────────────────────────────────────────────────────────────────┘
```

### User Navigation Bar:
```
┌──────────────────────────────────────────────────────────────────┐
│ [Logo] Home | My Trips | Explore | Locations | Hotels | Guides | │
│        Transportation | Bookings | Profile | [Logout]            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Login Flow Diagram

```
                    ┌──────────────┐
                    │  Visit Site  │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   / Landing  │  ◄── Pure homepage
                    │              │      No login buttons in header
                    └──────┬───────┘
                           │
                "Explore Now" button
                           │
                           ▼
                    ┌──────────────┐
                    │   /login     │  ◄── Single login for ALL
                    │              │      (Admin, Guide, User)
                    └──────┬───────┘
                           │
                  Enter credentials
                           │
                           ▼
                    ┌──────────────┐
                    │   Backend    │
                    │ Authenticate │
                    └──────┬───────┘
                           │
                    Check user.role
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    role='admin'      role='guide'      role='user'
         │                 │                 │
         ▼                 ▼                 ▼
  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │   /admin    │   │   /guide    │   │   /home     │
  │             │   │             │   │             │
  │ Admin Panel │   │ Guide Panel │   │ User Panel  │
  └─────────────┘   └─────────────┘   └─────────────┘
```

---

## User Type Comparison

| Feature | Admin | Guide | User |
|---------|-------|-------|------|
| **Landing Page Access** | ✅ | ✅ | ✅ |
| **Login Route** | /login | /login | /login |
| **After Login Redirect** | /admin | /guide | /home |
| **Approve/Reject** | ✅ | ❌ | ❌ |
| **Add Content** | ❌ | ✅ | ❌ |
| **Browse Content** | ✅ | ✅ | ✅ |
| **Create Itineraries** | ✅ | ✅ | ✅ |
| **Book Services** | ✅ | ✅ | ✅ |
| **View All Submissions** | ✅ | Own Only | ❌ |
| **Manage Users** | ✅ | ❌ | ❌ |

---

## Page Hierarchy

```
TravelHeaven/
│
├── PUBLIC (Non-authenticated)
│   ├── / ................................ Landing Page
│   ├── /login ........................... Unified Login
│   └── /register ........................ Registration
│
└── PROTECTED (Authenticated)
    │
    ├── ADMIN ROUTES (role='admin')
    │   ├── /admin ....................... Admin Dashboard ⭐ BIG DOMAIN
    │   ├── /admin/approvals ............. Approval Center
    │   ├── /locations ................... View All Locations
    │   ├── /hotels ...................... View All Hotels
    │   ├── /transportation .............. View All Transport
    │   ├── /guides ...................... View All Guides
    │   └── /profile ..................... Admin Profile
    │
    ├── GUIDE ROUTES (role='guide')
    │   ├── /guide ....................... Guide Dashboard
    │   ├── /guide/locations ............. Manage My Locations
    │   ├── /guide/hotels ................ Manage My Hotels
    │   ├── /guide/transport ............. Manage My Transport
    │   ├── /locations ................... Browse All
    │   └── /profile ..................... Guide Profile
    │
    └── USER ROUTES (role='user')
        ├── /home ........................ User Home Dashboard
        ├── /itineraries ................. My Itineraries
        ├── /itineraries/public .......... Explore Public Trips
        ├── /itineraries/create .......... Create Itinerary
        ├── /itineraries/:id ............. View/Edit Itinerary
        ├── /locations ................... Browse Locations
        ├── /hotels ...................... Browse Hotels
        ├── /guides ...................... Browse Guides
        ├── /guides/:id .................. View Guide Profile
        ├── /transportation .............. Browse Transport
        ├── /bookings .................... My Bookings
        └── /profile ..................... User Profile
```

---

## Test Credentials

### Admin Login:
```
Email: admin@example.com
Password: adminpass
Redirects to: /admin
```

### Guide Login:
```
Register as Guide first
Redirects to: /guide
```

### User Login:
```
Register as User first
Redirects to: /home
```

---

## Summary

✅ **Single Entry Point:** `/` is landing page for everyone
✅ **Unified Login:** All users use `/login` (no separate admin login)
✅ **Role-Based Redirect:** Automatic redirect based on user role after login
✅ **Distinct Domains:** Each role has dedicated dashboard and navigation
✅ **Clear Hierarchy:** Admin has biggest domain with full control
