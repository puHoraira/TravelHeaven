/**
 * Strategy Pattern - Authorization Strategies
 * Defines different authorization strategies for different roles
 * Open for extension: Add new role strategies without modifying existing ones
 */

export class AuthorizationStrategy {
  canAccess(user, resource, action) {
    throw new Error('Method must be implemented by subclass');
  }
}

export class AdminAuthorizationStrategy extends AuthorizationStrategy {
  canAccess(user, resource, action) {
    // Admin has access to everything
    return true;
  }
}

export class UserAuthorizationStrategy extends AuthorizationStrategy {
  canAccess(user, resource, action) {
    const allowedActions = {
      'location': ['read'],
      'hotel': ['read'],
      'transport': ['read'],
      'booking': ['create', 'read', 'update', 'delete'],
    };

    return allowedActions[resource]?.includes(action) || false;
  }
}

export class GuideAuthorizationStrategy extends AuthorizationStrategy {
  canAccess(user, resource, action) {
    const allowedActions = {
      'location': ['create', 'read', 'update', 'delete'],
      'hotel': ['create', 'read', 'update', 'delete'],
      'transport': ['create', 'read', 'update', 'delete'],
      'booking': ['read'],
    };

    return allowedActions[resource]?.includes(action) || false;
  }
}

/**
 * Context class for authorization
 */
export class AuthorizationContext {
  constructor(strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  authorize(user, resource, action) {
    return this.strategy.canAccess(user, resource, action);
  }
}

/**
 * Factory to create appropriate authorization strategy
 */
export class AuthorizationStrategyFactory {
  static createStrategy(role) {
    switch (role) {
      case 'admin':
        return new AdminAuthorizationStrategy();
      case 'user':
        return new UserAuthorizationStrategy();
      case 'guide':
        return new GuideAuthorizationStrategy();
      default:
        throw new Error(`Unknown role: ${role}`);
    }
  }
}
