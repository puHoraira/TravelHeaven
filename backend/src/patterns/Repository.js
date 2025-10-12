/**
 * Repository Pattern - Abstract Data Access Layer
 * Provides abstraction over database operations
 * Makes it easy to switch databases or add caching
 */

export class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findAll(filter = {}, options = {}) {
    const { page = 1, limit = 10, sort = { createdAt: -1 }, populate = [] } = options;
    const skip = (page - 1) * limit;

    let query = this.model.find(filter).sort(sort).skip(skip).limit(limit);

    populate.forEach(field => {
      query = query.populate(field);
    });

    const data = await query;
    const total = await this.model.countDocuments(filter);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id, populate = []) {
    let query = this.model.findById(id);

    populate.forEach(field => {
      query = query.populate(field);
    });

    return await query;
  }

  async findOne(filter, populate = []) {
    let query = this.model.findOne(filter);

    populate.forEach(field => {
      query = query.populate(field);
    });

    return await query;
  }

  async create(data) {
    return await this.model.create(data);
  }

  async update(id, data) {
    return await this.model.findByIdAndUpdate(
      id,
      { ...data, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
  }

  async delete(id) {
    return await this.model.findByIdAndDelete(id);
  }

  async exists(filter) {
    return await this.model.exists(filter);
  }

  async count(filter = {}) {
    return await this.model.countDocuments(filter);
  }
}

/**
 * Specific Repositories extending BaseRepository
 */
import { User } from '../models/User.js';
import { Location } from '../models/Location.js';
import { Hotel } from '../models/Hotel.js';
import { Transport } from '../models/Transport.js';
import { Booking } from '../models/Booking.js';

export class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    return await this.model.findOne({ email }).select('+password');
  }

  async findByUsername(username) {
    return await this.model.findOne({ username });
  }
}

export class LocationRepository extends BaseRepository {
  constructor() {
    super(Location);
  }

  async findApproved(filter = {}, options = {}) {
    return await this.findAll({ ...filter, approvalStatus: 'approved' }, options);
  }

  async findPending(options = {}) {
    return await this.findAll({ approvalStatus: 'pending' }, options);
  }

  async findByGuide(guideId, options = {}) {
    return await this.findAll({ guideId }, options);
  }
}

export class HotelRepository extends BaseRepository {
  constructor() {
    super(Hotel);
  }

  async findApproved(filter = {}, options = {}) {
    return await this.findAll({ ...filter, approvalStatus: 'approved' }, options);
  }

  async findPending(options = {}) {
    return await this.findAll({ approvalStatus: 'pending' }, options);
  }

  async findByLocation(locationId, options = {}) {
    return await this.findAll({ locationId, approvalStatus: 'approved' }, options);
  }

  async findByGuide(guideId, options = {}) {
    return await this.findAll({ guideId }, options);
  }
}

export class TransportRepository extends BaseRepository {
  constructor() {
    super(Transport);
  }

  async findApproved(filter = {}, options = {}) {
    return await this.findAll({ ...filter, approvalStatus: 'approved' }, options);
  }

  async findPending(options = {}) {
    return await this.findAll({ approvalStatus: 'pending' }, options);
  }

  async findByLocation(locationId, options = {}) {
    return await this.findAll({ locationId, approvalStatus: 'approved' }, options);
  }

  async findByGuide(guideId, options = {}) {
    return await this.findAll({ guideId }, options);
  }
}

export class BookingRepository extends BaseRepository {
  constructor() {
    super(Booking);
  }

  async findByUser(userId, options = {}) {
    return await this.findAll({ userId }, options);
  }

  async findByStatus(status, options = {}) {
    return await this.findAll({ status }, options);
  }
}
