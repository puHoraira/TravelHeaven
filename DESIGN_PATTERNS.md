# TravelHeaven - Design Patterns Documentation

## ✅ Design Patterns Implemented

### 1. **Singleton Pattern** 
**Location**: `backend/src/config/database.js`

```javascript
class DatabaseConnection {
  static instance = null;
  
  static getInstance() {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }
}
```

**Purpose**: Ensures only one database connection instance exists throughout the application.

---

### 2. **Repository Pattern**
**Location**: `backend/src/patterns/Repository.js`

**Repositories**:
- `UserRepository`
- `LocationRepository`
- `HotelRepository`
- `TransportRepository`
- `BookingRepository`
- `ItineraryRepository` (with specialized methods)

```javascript
class BaseRepository {
  async findAll(filter, options) { }
  async findById(id, populate) { }
  async create(data) { }
  async update(id, data) { }
  async delete(id) { }
}
```

**Purpose**: Abstracts data access logic, making it easy to switch databases or add caching.

**Itinerary Repository Extensions**:
- `findByOwner(ownerId)` - Get user's itineraries
- `findPublic()` - Get public itineraries
- `findByCollaborator(userId)` - Get collaborative itineraries
- `addCollaborator(id, userId, permission)` - Add collaborator
- `removeCollaborator(id, userId)` - Remove collaborator
- `updateCompleteness(id)` - Calculate completeness score (gamification)

---

### 3. **Strategy Pattern** (Authorization)
**Location**: `backend/src/patterns/AuthorizationStrategy.js`

**Strategies**:
- `AdminAuthStrategy` - Full access to all operations
- `GuideAuthStrategy` - Can create/edit own content
- `UserAuthStrategy` - Can view approved content
- `PublicAuthStrategy` - View-only for approved content

```javascript
class AdminAuthStrategy {
  canCreate() { return true; }
  canRead() { return true; }
  canUpdate() { return true; }
  canDelete() { return true; }
}
```

**Usage**: Different access control strategies for different user roles.

---

### 4. **Factory Pattern**
**Location**: `backend/src/patterns/Factory.js`

```javascript
class AuthorizationStrategyFactory {
  static createStrategy(role) {
    switch (role) {
      case 'admin': return new AdminAuthStrategy();
      case 'guide': return new GuideAuthStrategy();
      case 'user': return new UserAuthStrategy();
      default: return new PublicAuthStrategy();
    }
  }
}
```

**Purpose**: Creates appropriate authorization strategy based on user role.

---

### 5. **Observer Pattern** (Notifications)
**Location**: `backend/src/patterns/Observer.js`

**Subjects**:
- `ApprovalSubject` - Notifies when content is approved/rejected

**Observers**:
- `EmailObserver` - Sends email notifications (placeholder)
- `DatabaseLogObserver` - Logs approval events

```javascript
class ApprovalSubject {
  observers = [];
  
  attach(observer) { this.observers.push(observer); }
  detach(observer) { /* ... */ }
  notify(data) { 
    this.observers.forEach(o => o.update(data));
  }
}
```

**Purpose**: Decouples notification logic from business logic. When content is approved/rejected, all observers are automatically notified.

---

### 6. **Service Layer Pattern**
**Location**: `backend/src/services/approval.service.js`

```javascript
class ApprovalService {
  async approveItem(repository, type, id, adminId, comments) {
    // Centralized approval logic
    // Updates item status
    // Notifies observers
  }
  
  async rejectItem(repository, type, id, adminId, reason) {
    // Centralized rejection logic
  }
}
```

**Purpose**: Centralizes approval business logic (Single Responsibility Principle), making controllers thinner and logic reusable.

---

### 7. **Decorator Pattern** (Middleware)
**Location**: `backend/src/middleware/`

**Middleware Stack**:
- `auth.js` - Authenticates JWT tokens
- `validation.js` - Validates request data
- `upload.js` - Handles file uploads
- `errorHandler.js` - Global error handling

```javascript
// Middleware chain decorates the request/response
router.post('/', 
  authenticate,        // Decorator 1: Add user to req
  validateRequest,     // Decorator 2: Validate data
  upload.single(),     // Decorator 3: Process file
  controller.create    // Final handler
);
```

**Purpose**: Each middleware adds functionality without modifying the core handler.

---

### 8. **Builder Pattern** (Frontend)
**Location**: `frontend/src/pages/itineraries/CreateItinerary.jsx`

```javascript
// Step-by-step construction of complex itinerary
const onSubmit = (data) => {
  const itineraryData = {
    ...data,
    days: days.map(day => ({
      date: day.date,
      stops: day.stops.filter(s => s.name),
    })),
    budget: data.budgetTotal > 0 ? {
      total: parseFloat(data.budgetTotal),
      currency: data.budgetCurrency,
      expenses: [],
    } : undefined,
  };
};
```

**Purpose**: Builds complex itinerary objects step-by-step with validation at each stage.

---

### 9. **Component Pattern** (Frontend)
**Location**: `frontend/src/components/itinerary/`

**Reusable Components**:
- `MapView.jsx` - Interactive Leaflet map display
- `DayCard.jsx` - Displays a single day's plan
- `CollaboratorsList.jsx` - Manages collaborators
- `BudgetTracker.jsx` - Budget visualization

**Purpose**: Separation of concerns, reusable UI components.

---

## 🎯 SOLID Principles Applied

### Single Responsibility Principle (SRP)
- Each controller handles only one entity (Location, Hotel, Transport, Itinerary)
- ApprovalService handles only approval logic
- Each repository handles only data access for one model

### Open-Closed Principle (OCP)
- New authorization strategies can be added without modifying existing code
- New observers can be added to ApprovalSubject without changing notification logic
- New repositories extend BaseRepository

### Liskov Substitution Principle (LSP)
- All repositories extend BaseRepository and can be substituted
- All authorization strategies implement the same interface

### Interface Segregation Principle (ISP)
- Repositories only expose methods they need
- Authorization strategies don't force unnecessary methods

### Dependency Inversion Principle (DIP)
- Controllers depend on Repository abstractions, not concrete implementations
- Services depend on interfaces, not concrete classes

---

## 🗺️ Itinerary Feature - Wanderlog Inspired

### Key Features:
1. **Day-by-Day Planning**: Organize trips by days with multiple stops
2. **Interactive Maps**: Leaflet integration with custom markers and routes
3. **Collaboration**: Share itineraries with view/edit permissions
4. **Budget Tracking**: Track expenses, split costs among collaborators
5. **Gamification**: Completeness score (0-100%) encourages detailed planning
6. **Public Sharing**: Make itineraries public for community browsing

### Design Pattern Usage in Itinerary:
- **Repository**: `ItineraryRepository` with specialized methods
- **Observer**: Collaborators notified of changes (future WebSocket extension)
- **Strategy**: Different permissions for owner/editor/viewer
- **Builder**: Step-by-step itinerary creation form

---

## 📊 Pattern Benefits

1. **Maintainability**: Clear separation of concerns makes code easy to understand
2. **Testability**: Each pattern can be unit tested independently
3. **Scalability**: Easy to add new features (e.g., new auth strategies, observers)
4. **Flexibility**: Can swap implementations (e.g., different databases via Repository)
5. **Reusability**: Components and patterns are reusable across the application

---

## 🔍 Pattern Verification Checklist

- [x] Singleton: DatabaseConnection ensures single instance
- [x] Repository: All models have repository implementations
- [x] Strategy: Authorization strategies for all roles
- [x] Factory: AuthorizationStrategyFactory creates strategies
- [x] Observer: ApprovalSubject notifies observers
- [x] Service Layer: ApprovalService centralizes business logic
- [x] Decorator: Middleware chain decorates requests
- [x] Builder: Itinerary creation uses builder approach
- [x] Component: Frontend has reusable components

---

## 🚀 Future Pattern Extensions

1. **Command Pattern**: Undo/redo for itinerary edits
2. **Proxy Pattern**: Caching layer for Repository
3. **Chain of Responsibility**: Multi-step approval workflow
4. **Template Method**: Common CRUD operation templates
5. **Adapter Pattern**: Multiple map providers (Google Maps, Mapbox)

---

*Last Updated: October 15, 2025*
