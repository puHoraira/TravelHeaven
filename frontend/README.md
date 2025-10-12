# Travel Heaven Frontend

React-based frontend for the Tourist Helper System with role-based interfaces.

## Features

### Role-Based UI
- **Admin Interface**: Approval management, statistics, system overview
- **Guide Interface**: Add/manage locations, hotels, transportation
- **User Interface**: Browse and book tourist services

### Design Patterns
- **State Management**: Zustand (lightweight state management)
- **Protected Routes**: Role-based route protection
- **Component Composition**: Reusable UI components

## Tech Stack

- React 18
- React Router 6
- Zustand (State Management)
- Axios (HTTP Client)
- React Hook Form (Form Handling)
- Tailwind CSS (Styling)
- Vite (Build Tool)
- Lucide React (Icons)

## Getting Started

### Install Dependencies
```powershell
npm install
```

### Environment Setup
```powershell
Copy-Item .env.example .env
```

Edit `.env` to point to your backend API:
```
VITE_API_URL=http://localhost:5000/api
```

### Development Server
```powershell
npm run dev
```

Visit `http://localhost:3000`

### Build for Production
```powershell
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Layout.jsx       # Main layout with navigation
│   └── ProtectedRoute.jsx  # Route protection
├── lib/
│   └── api.js           # Axios configuration
├── pages/
│   ├── admin/           # Admin pages
│   │   ├── Dashboard.jsx
│   │   └── Approvals.jsx
│   ├── guide/           # Guide pages
│   │   ├── Dashboard.jsx
│   │   ├── Locations.jsx
│   │   ├── Hotels.jsx
│   │   └── Transport.jsx
│   ├── user/            # User pages
│   │   └── Bookings.jsx
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Locations.jsx
│   ├── Hotels.jsx
│   ├── Transportation.jsx
│   └── Profile.jsx
├── store/
│   └── authStore.js     # Authentication state
├── App.jsx              # Main app with routing
└── main.jsx             # Entry point
```

## User Roles

### Admin
- Access all features
- Approve/reject guide submissions
- View system statistics
- Manage all content

### Guide
- Add locations with images
- Add hotels for locations
- Add transportation options
- View own submissions
- Track approval status

### User (Tourist)
- Browse approved locations
- Search hotels
- View transportation
- Book services
- Manage bookings

## Styling

Uses Tailwind CSS with custom utilities:

- `.btn` - Base button styles
- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary action button
- `.btn-danger` - Danger/delete button
- `.input` - Form input styles
- `.card` - Card container

## State Management

Authentication state is managed with Zustand and persisted to localStorage:

```javascript
const { user, login, logout, register } = useAuthStore();
```

## API Integration

Axios instance with automatic:
- JWT token attachment
- Error handling
- Unauthorized redirect

```javascript
import api from './lib/api';

const response = await api.get('/locations');
```

## Contributing

This is part of an SDP lab project demonstrating software engineering patterns.
