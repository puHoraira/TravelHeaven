/**
 * Factory Pattern - Service Factory
 * Creates service instances based on type
 * Open for extension: Add new service types without modifying factory
 */

import {
  UserRepository,
  LocationRepository,
  HotelRepository,
  TransportRepository,
  BookingRepository,
} from './Repository.js';

export class ServiceFactory {
  static createRepository(type) {
    const repositories = {
      user: () => new UserRepository(),
      location: () => new LocationRepository(),
      hotel: () => new HotelRepository(),
      transport: () => new TransportRepository(),
      booking: () => new BookingRepository(),
    };

    const createRepo = repositories[type.toLowerCase()];
    
    if (!createRepo) {
      throw new Error(`Unknown repository type: ${type}`);
    }

    return createRepo();
  }

  static getModelByType(type) {
    const models = {
      location: 'Location',
      hotel: 'Hotel',
      transport: 'Transport',
    };

    return models[type.toLowerCase()];
  }
}

/**
 * Builder Pattern - Query Builder for complex queries
 */
export class QueryBuilder {
  constructor() {
    this.query = {};
    this.options = {
      page: 1,
      limit: 10,
      sort: { createdAt: -1 },
      populate: [],
    };
  }

  where(field, value) {
    this.query[field] = value;
    return this;
  }

  whereIn(field, values) {
    this.query[field] = { $in: values };
    return this;
  }

  whereRange(field, min, max) {
    this.query[field] = { $gte: min, $lte: max };
    return this;
  }

  page(page) {
    this.options.page = page;
    return this;
  }

  limit(limit) {
    this.options.limit = limit;
    return this;
  }

  sort(field, order = 'desc') {
    this.options.sort = { [field]: order === 'desc' ? -1 : 1 };
    return this;
  }

  populate(fields) {
    this.options.populate = Array.isArray(fields) ? fields : [fields];
    return this;
  }

  build() {
    return {
      query: this.query,
      options: this.options,
    };
  }
}
