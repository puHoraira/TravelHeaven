import jwt from 'jsonwebtoken';
import { UserRepository } from '../patterns/Repository.js';
import { AuthorizationStrategyFactory, AuthorizationContext } from '../patterns/AuthorizationStrategy.js';

/**
 * Decorator Pattern - Authentication Middleware
 * Decorates requests with authentication information
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const userRepo = new UserRepository();
    const user = await userRepo.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user deactivated.',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
      error: error.message,
    });
  }
};

/**
 * Role-based authorization middleware using Strategy Pattern
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
      });
    }

    next();
  };
};

/**
 * Resource-based authorization using Strategy Pattern
 */
export const authorizeResource = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required.',
        });
      }

      // Create authorization strategy based on user role
      const strategy = AuthorizationStrategyFactory.createStrategy(req.user.role);
      const authContext = new AuthorizationContext(strategy);

      // Check if user can perform action on resource
      const canAccess = authContext.authorize(req.user, resource, action);

      if (!canAccess) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Cannot ${action} ${resource}.`,
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Authorization error.',
        error: error.message,
      });
    }
  };
};

/**
 * Check if user owns the resource
 */
export const checkOwnership = (model) => {
  return async (req, res, next) => {
    try {
      // Admin can access everything
      if (req.user.role === 'admin') {
        return next();
      }

      const resourceId = req.params.id;
      const repository = new (require('../patterns/Repository.js')[`${model}Repository`])();
      const resource = await repository.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found.',
        });
      }

      // Check if user is the owner (for guides)
      if (req.user.role === 'guide' && resource.guideId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only modify your own content.',
        });
      }

      // Check if user is the owner (for users with bookings)
      if (req.user.role === 'user' && resource.userId && resource.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only access your own bookings.',
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Ownership check failed.',
        error: error.message,
      });
    }
  };
};
