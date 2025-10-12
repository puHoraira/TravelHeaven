# Software Design Patterns (SDP) Documentation

This document explains the design patterns and SOLID principles implemented in the Travel Heaven project.

## 🎨 Design Patterns

### 1. Singleton Pattern

**Purpose**: Ensure only one instance of a class exists throughout the application.

**Implementation**: Database Connection (`backend/src/config/database.js`)

```javascript
export class DatabaseConnection {
  static #instance = null;
  
  static getInstance() {
    if (!DatabaseConnection.#instance) {
      DatabaseConnection.#instance = new DatabaseConnection();
    }
    return DatabaseConnection.#instance;
  }
}
```

**Benefits**:
- Single database connection shared across the application
- Prevents resource wastage
- Centralized connection management

**Usage**:
```javascript
const db = DatabaseConnection.getInstance();
await db.connect();
```

---

### 2. Strategy Pattern

**Purpose**: Define a family of algorithms, encapsulate each one, and make them interchangeable.

**Implementation**: Authorization Strategies (`backend/src/patterns/AuthorizationStrategy.js`)

```javascript
// Base Strategy
export class AuthorizationStrategy {
  canAccess(user, resource, action) {
    throw new Error('Must be implemented');
  }
}

// Concrete Strategies
export class AdminAuthorizationStrategy extends AuthorizationStrategy {
  canAccess(user, resource, action) {
    return true; // Admin has full access
  }
}

export class UserAuthorizationStrategy extends AuthorizationStrategy {
  canAccess(user, resource, action) {
    // User-specific permissions
  }
}

export class GuideAuthorizationStrategy extends AuthorizationStrategy {
  canAccess(user, resource, action) {
    // Guide-specific permissions
  }
}
```

**Benefits**:
- **Open/Closed Principle**: Add new roles without modifying existing code
- Easy to test individual strategies
- Clear separation of authorization logic

**Usage**:
```javascript
const strategy = AuthorizationStrategyFactory.createStrategy(user.role);
const authContext = new AuthorizationContext(strategy);
const canAccess = authContext.authorize(user, 'location', 'create');
```

**Extensibility Example**:
To add a new "SuperGuide" role:
```javascript
export class SuperGuideAuthorizationStrategy extends AuthorizationStrategy {
  canAccess(user, resource, action) {
    // SuperGuide permissions
  }
}

// Update factory
AuthorizationStrategyFactory.createStrategy(role) {
  // ... existing cases
  case 'superguide':
    return new SuperGuideAuthorizationStrategy();
}
```

---

### 3. Repository Pattern

**Purpose**: Abstraction layer between business logic and data access.

**Implementation**: Data Repositories (`backend/src/patterns/Repository.js`)

```javascript
export class BaseRepository {
  constructor(model) {
    this.model = model;
  }
  
  async findAll(filter = {}, options = {}) { /* ... */ }
  async findById(id, populate = []) { /* ... */ }
  async create(data) { /* ... */ }
  async update(id, data) { /* ... */ }
  async delete(id) { /* ... */ }
}

export class LocationRepository extends BaseRepository {
  constructor() {
    super(Location);
  }
  
  async findApproved(filter = {}, options = {}) {
    return await this.findAll({ ...filter, approvalStatus: 'approved' }, options);
  }
}
```

**Benefits**:
- **Single Responsibility**: Separates data access from business logic
- Easy to switch databases (MongoDB → PostgreSQL)
- Simplified testing with mock repositories
- Consistent data access interface

**Usage**:
```javascript
const locationRepo = new LocationRepository();
const locations = await locationRepo.findApproved({ country: 'USA' });
```

**Extensibility Example**:
Add caching without modifying controllers:
```javascript
export class CachedLocationRepository extends LocationRepository {
  constructor() {
    super();
    this.cache = new Cache();
  }
  
  async findById(id) {
    const cached = this.cache.get(id);
    if (cached) return cached;
    
    const data = await super.findById(id);
    this.cache.set(id, data);
    return data;
  }
}
```

---

### 4. Observer Pattern

**Purpose**: Define a one-to-many dependency where multiple observers are notified of state changes.

**Implementation**: Approval Notification System (`backend/src/patterns/Observer.js`)

```javascript
export class Subject {
  constructor() {
    this.observers = [];
  }
  
  attach(observer) {
    this.observers.push(observer);
  }
  
  notify(data) {
    this.observers.forEach(observer => observer.update(data));
  }
}

export class EmailNotificationObserver extends Observer {
  update(data) {
    // Send email notification
  }
}

export class LogNotificationObserver extends Observer {
  update(data) {
    // Log to file/database
  }
}
```

**Benefits**:
- **Open/Closed Principle**: Add new observers without modifying subject
- Decoupled notification system
- Multiple notification channels

**Usage**:
```javascript
const approvalSubject = getApprovalSubject();
approvalSubject.approvalStatusChanged('location', item, 'approved', adminId);
// All attached observers are automatically notified
```

**Extensibility Example**:
Add SMS notifications:
```javascript
export class SMSNotificationObserver extends Observer {
  update(data) {
    // Send SMS notification
  }
}

// Attach in initialization
approvalSubject.attach(new SMSNotificationObserver());
```

---

### 5. Factory Pattern

**Purpose**: Create objects without specifying their exact classes.

**Implementation**: Repository Factory (`backend/src/patterns/Factory.js`)

```javascript
export class ServiceFactory {
  static createRepository(type) {
    const repositories = {
      user: () => new UserRepository(),
      location: () => new LocationRepository(),
      hotel: () => new HotelRepository(),
      transport: () => new TransportRepository(),
      booking: () => new BookingRepository(),
    };
    
    return repositories[type]();
  }
}
```

**Benefits**:
- Centralized object creation
- Easy to extend with new types
- **Dependency Inversion**: Controllers depend on abstractions

**Usage**:
```javascript
const repo = ServiceFactory.createRepository('location');
const data = await repo.findAll();
```

**Extensibility Example**:
```javascript
// Add new repository type
static createRepository(type) {
  const repositories = {
    // ... existing
    review: () => new ReviewRepository(),
  };
  return repositories[type]();
}
```

---

### 6. Decorator Pattern

**Purpose**: Add behavior to objects dynamically without modifying their structure.

**Implementation**: Middleware (`backend/src/middleware/auth.js`)

```javascript
// Authentication Decorator
export const authenticate = async (req, res, next) => {
  // Decorate request with user information
  req.user = user;
  next();
};

// Authorization Decorator
export const authorize = (...roles) => {
  return (req, res, next) => {
    // Decorate with role checking
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

// Resource Authorization Decorator
export const authorizeResource = (resource, action) => {
  return async (req, res, next) => {
    // Decorate with resource-specific authorization
    const strategy = AuthorizationStrategyFactory.createStrategy(req.user.role);
    const canAccess = strategy.canAccess(req.user, resource, action);
    if (!canAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};
```

**Benefits**:
- **Single Responsibility**: Each middleware has one concern
- Composable behavior
- Reusable across routes

**Usage**:
```javascript
router.post('/', 
  authenticate,                           // Add authentication
  authorize('guide'),                     // Add role check
  authorizeResource('location', 'create'), // Add resource check
  upload.array('images', 5),              // Add file upload
  validate,                               // Add validation
  createLocation                          // Execute controller
);
```

---

## 📐 SOLID Principles

### 1. Single Responsibility Principle (SRP)

**Definition**: A class should have only one reason to change.

**Examples**:
- `LocationController`: Only handles location-related HTTP requests
- `LocationRepository`: Only handles location data access
- `AuthorizationStrategy`: Only handles authorization logic

**Violation Example** (❌):
```javascript
class LocationController {
  async createLocation(req, res) {
    // HTTP handling
    // Validation
    // Authorization
    // Database access
    // Email notification
    // File upload
  }
}
```

**Correct Implementation** (✅):
```javascript
class LocationController {
  async createLocation(req, res) {
    // Only HTTP handling
    const data = await locationService.create(req.body);
    res.json(data);
  }
}

class LocationService {
  // Only business logic
}

class LocationRepository {
  // Only data access
}
```

---

### 2. Open/Closed Principle (OCP)

**Definition**: Software entities should be open for extension, but closed for modification.

**Examples**:

#### Strategy Pattern (✅)
Add new roles without modifying existing authorization:
```javascript
// No need to modify existing strategies
export class ModeratorAuthorizationStrategy extends AuthorizationStrategy {
  canAccess(user, resource, action) {
    // Moderator logic
  }
}

// Just update factory
case 'moderator':
  return new ModeratorAuthorizationStrategy();
```

#### Observer Pattern (✅)
Add new notification methods without modifying subject:
```javascript
// Just create new observer
export class PushNotificationObserver extends Observer {
  update(data) {
    // Push notification logic
  }
}

// Attach it
approvalSubject.attach(new PushNotificationObserver());
```

---

### 3. Liskov Substitution Principle (LSP)

**Definition**: Subtypes must be substitutable for their base types.

**Example**:
```javascript
class BaseRepository {
  async findAll(filter, options) {
    // Returns { data, pagination }
  }
}

class LocationRepository extends BaseRepository {
  async findAll(filter, options) {
    // Also returns { data, pagination }
    // Can be used anywhere BaseRepository is expected
  }
}
```

**Usage**:
```javascript
function processData(repository: BaseRepository) {
  const result = repository.findAll();
  // Works with any repository subclass
}

processData(new LocationRepository()); // ✅ Works
processData(new HotelRepository());    // ✅ Works
```

---

### 4. Interface Segregation Principle (ISP)

**Definition**: Clients should not be forced to depend on interfaces they don't use.

**Example**:
Instead of one large interface:
```javascript
// ❌ Fat Interface
interface IRepository {
  findAll()
  findById()
  findApproved()     // Only for approvable entities
  findByGuide()      // Only for guide entities
  findByUser()       // Only for user entities
}
```

Split into focused interfaces:
```javascript
// ✅ Segregated Interfaces
interface IBaseRepository {
  findAll()
  findById()
  create()
  update()
  delete()
}

interface IApprovable {
  findApproved()
  findPending()
}

interface IGuideOwned {
  findByGuide()
}
```

---

### 5. Dependency Inversion Principle (DIP)

**Definition**: High-level modules should not depend on low-level modules. Both should depend on abstractions.

**Example**:

**Before** (❌):
```javascript
class LocationController {
  constructor() {
    this.mongoDb = new MongoDB(); // Depends on concrete implementation
  }
}
```

**After** (✅):
```javascript
class LocationController {
  constructor(repository) {
    this.repository = repository; // Depends on abstraction
  }
}

// Can inject any repository implementation
const controller = new LocationController(new LocationRepository());
const testController = new LocationController(new MockRepository());
```

---

## 🔄 How Patterns Work Together

### Example: Creating a Location

1. **Client** sends POST request to `/api/locations`
2. **Decorator Pattern**: Request passes through middleware stack
   - `authenticate` - Adds user to request
   - `authorize('guide')` - Checks role
   - `upload` - Handles file upload
   - `validate` - Validates data
3. **Controller** receives validated request
4. **Factory Pattern**: Creates appropriate repository
5. **Repository Pattern**: Saves data to database
6. **Observer Pattern**: Notifies observers about new submission
7. **Strategy Pattern**: Used for additional authorization checks

### Example: Admin Approval

1. **Admin** approves a location
2. **Repository Pattern**: Updates approval status
3. **Observer Pattern**: Triggers notifications
   - `EmailNotificationObserver` - Sends email to guide
   - `LogNotificationObserver` - Logs approval event
   - `DatabaseNotificationObserver` - Saves notification
4. **Strategy Pattern**: Verifies admin has permission

---

## 📊 Pattern Benefits Summary

| Pattern | Extensibility | Maintainability | Testability |
|---------|--------------|-----------------|-------------|
| Singleton | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Strategy | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Repository | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Observer | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Factory | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Decorator | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎓 Learning Outcomes

By studying this project, you'll understand:

1. How to apply design patterns in real-world applications
2. How patterns work together to create maintainable systems
3. How SOLID principles guide pattern implementation
4. How to extend functionality without modifying existing code
5. How to write testable, modular code

---

## 📚 Further Reading

- **Design Patterns**: "Design Patterns: Elements of Reusable Object-Oriented Software" by Gang of Four
- **SOLID Principles**: "Agile Software Development" by Robert C. Martin
- **Clean Architecture**: "Clean Architecture" by Robert C. Martin

---

## 🔍 Pattern Detection Exercise

Try to identify patterns in the codebase:

1. Find where Singleton pattern is used
2. Identify all Strategy implementations
3. Locate Observer attachments
4. Trace a request through all Decorators
5. Find Factory method calls

Answers in respective source files! 🎯
