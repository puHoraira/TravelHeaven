# Tourist Helper Backend

## Software Design Patterns Applied

### 1. **Strategy Pattern** - Role-based authorization
- Different authorization strategies for Admin, User, and Guide roles
- Easy to extend with new roles without modifying existing code

### 2. **Factory Pattern** - Service creation
- ServiceFactory for creating different service instances
- Centralizes object creation logic

### 3. **Repository Pattern** - Data access layer
- Abstracts database operations
- Makes it easy to switch databases

### 4. **Observer Pattern** - Approval workflow
- Observers notified when guide submissions need approval
- Admin approval triggers notifications

### 5. **Decorator Pattern** - Middleware
- Authentication and authorization decorators
- Request validation decorators

### 6. **Singleton Pattern** - Database connection
- Single database connection instance

## SOLID Principles

- **Single Responsibility**: Each class has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes can replace base types
- **Interface Segregation**: Small, focused interfaces
- **Dependency Inversion**: Depend on abstractions

## Setup

1. Copy `.env.example` to `.env` and configure
2. Install dependencies: `npm install`
3. Start MongoDB
4. Run: `npm run dev`

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user

### Locations (Guide)
- POST `/api/locations` - Create location (Guide only)
- GET `/api/locations` - Get approved locations
- GET `/api/locations/:id` - Get location details
- PUT `/api/locations/:id` - Update location (Guide only)

### Hotels (Guide)
- POST `/api/hotels` - Add hotel (Guide only)
- GET `/api/hotels` - Get approved hotels
- GET `/api/hotels/:id` - Get hotel details

### Transportation (Guide)
- POST `/api/transportation` - Add transport (Guide only)
- GET `/api/transportation` - Get approved transport options

### Admin Approval
- GET `/api/admin/pending` - Get pending approvals (Admin only)
- PUT `/api/admin/approve/:type/:id` - Approve submission (Admin only)
- DELETE `/api/admin/reject/:type/:id` - Reject submission (Admin only)

### User Services
- POST `/api/bookings` - Book service (User only)
- GET `/api/bookings` - Get user bookings
