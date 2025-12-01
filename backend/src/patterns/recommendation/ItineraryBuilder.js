/**
 * Builder Pattern - Itinerary Builder
 * Constructs complex itinerary objects step-by-step
 * 
 * Benefits:
 * - Separates construction from representation
 * - Allows step-by-step construction
 * - Supports different representations of the same construction process
 * - Provides control over construction process
 */

/**
 * Itinerary - The product being built
 */
export class Itinerary {
  constructor() {
    this.id = null;
    this.userId = null;
    this.title = '';
    this.description = '';
    this.startDate = null;
    this.endDate = null;
    this.duration = 0;
    this.destinations = [];
    this.accommodations = [];
    this.transportation = [];
    this.activities = [];
    this.dailyPlans = [];
    this.estimatedCost = 0;
    this.actualCost = 0;
    this.budget = 0;
    this.preferences = {};
    this.strategy = '';
    this.metadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'draft', // draft, confirmed, completed
      isPublic: false,
    };
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      title: this.title,
      description: this.description,
      startDate: this.startDate,
      endDate: this.endDate,
      duration: this.duration,
      destinations: this.destinations,
      accommodations: this.accommodations,
      transportation: this.transportation,
      activities: this.activities,
      dailyPlans: this.dailyPlans,
      estimatedCost: this.estimatedCost,
      actualCost: this.actualCost,
      budget: this.budget,
      preferences: this.preferences,
      strategy: this.strategy,
      metadata: this.metadata,
    };
  }
}

/**
 * Builder Interface - Defines steps for building an itinerary
 */
export class ItineraryBuilder {
  constructor() {
    this.itinerary = new Itinerary();
  }

  /**
   * Set basic information
   */
  setBasicInfo(userId, title, description) {
    this.itinerary.userId = userId;
    this.itinerary.title = title || 'Untitled Itinerary';
    this.itinerary.description = description || '';
    return this;
  }

  /**
   * Set travel dates
   */
  setDates(startDate, endDate) {
    this.itinerary.startDate = new Date(startDate);
    this.itinerary.endDate = new Date(endDate);
    
    // Calculate duration in days
    const timeDiff = this.itinerary.endDate - this.itinerary.startDate;
    this.itinerary.duration = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)) + 1;
    
    return this;
  }

  /**
   * Set budget
   */
  setBudget(budget) {
    this.itinerary.budget = budget;
    return this;
  }

  /**
   * Set user preferences
   */
  setPreferences(preferences) {
    this.itinerary.preferences = preferences;
    return this;
  }

  /**
   * Set recommendation strategy used
   */
  setStrategy(strategy) {
    this.itinerary.strategy = strategy;
    return this;
  }

  /**
   * Add a destination (location)
   */
  addDestination(location) {
    this.itinerary.destinations.push({
      locationId: location._id || location.id,
      name: location.name,
      description: location.description,
      category: location.category,
      rating: location.rating,
      coordinates: location.coordinates,
      entryFee: location.entryFee || 0,
      estimatedDuration: location.estimatedDuration || 2, // hours
      order: this.itinerary.destinations.length + 1,
    });
    return this;
  }

  /**
   * Add multiple destinations
   */
  addDestinations(locations) {
    locations.forEach(location => this.addDestination(location));
    return this;
  }

  /**
   * Add accommodation
   */
  addAccommodation(hotel, checkIn, checkOut) {
    const nights = checkOut && checkIn ? 
      Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)) : 
      1;

    this.itinerary.accommodations.push({
      hotelId: hotel._id || hotel.id,
      name: hotel.name,
      address: hotel.address,
      rating: hotel.rating,
      pricePerNight: hotel.pricePerNight || 0,
      checkIn: checkIn ? new Date(checkIn) : null,
      checkOut: checkOut ? new Date(checkOut) : null,
      nights: nights,
      totalCost: (hotel.pricePerNight || 0) * nights,
      amenities: hotel.amenities || [],
      order: this.itinerary.accommodations.length + 1,
    });

    this.updateEstimatedCost();
    return this;
  }

  /**
   * Add multiple accommodations
   */
  addAccommodations(hotels) {
    if (!hotels || hotels.length === 0) return this;

    const nightsPerHotel = Math.ceil(this.itinerary.duration / hotels.length);
    let currentDate = new Date(this.itinerary.startDate);

    hotels.forEach((hotel, index) => {
      const checkIn = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + nightsPerHotel);
      const checkOut = new Date(currentDate);

      this.addAccommodation(hotel, checkIn, checkOut);
    });

    return this;
  }

  /**
   * Add transportation
   */
  addTransportation(transport, date, from, to) {
    this.itinerary.transportation.push({
      transportId: transport._id || transport.id,
      type: transport.type,
      name: transport.name || `${transport.type} - ${from} to ${to}`,
      from: from,
      to: to,
      date: date ? new Date(date) : null,
      departureTime: transport.departureTime,
      arrivalTime: transport.arrivalTime,
      price: transport.price || 0,
      duration: transport.estimatedDuration || transport.duration || 2,
      order: this.itinerary.transportation.length + 1,
    });

    this.updateEstimatedCost();
    return this;
  }

  /**
   * Add multiple transportation options
   */
  addMultipleTransportation(transportList) {
    transportList.forEach(transport => {
      this.addTransportation(
        transport,
        transport.date,
        transport.from,
        transport.to
      );
    });
    return this;
  }

  /**
   * Add an activity
   */
  addActivity(activity, date, time) {
    this.itinerary.activities.push({
      activityId: activity._id || activity.id || this.generateId(),
      name: activity.name,
      description: activity.description,
      category: activity.category,
      date: date ? new Date(date) : null,
      time: time,
      duration: activity.duration || 2,
      cost: activity.cost || 0,
      location: activity.location,
      order: this.itinerary.activities.length + 1,
    });

    this.updateEstimatedCost();
    return this;
  }

  /**
   * Generate daily plans from destinations, accommodations, and activities
   */
  generateDailyPlans() {
    const dailyPlans = [];
    const startDate = new Date(this.itinerary.startDate);

    for (let day = 0; day < this.itinerary.duration; day++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + day);

      const plan = {
        day: day + 1,
        date: currentDate,
        morning: [],
        afternoon: [],
        evening: [],
        accommodation: null,
        transportation: [],
        totalCost: 0,
      };

      // Assign destinations to time slots
      const destinationsPerDay = Math.ceil(this.itinerary.destinations.length / this.itinerary.duration);
      const startIdx = day * destinationsPerDay;
      const dayDestinations = this.itinerary.destinations.slice(startIdx, startIdx + destinationsPerDay);

      if (dayDestinations.length > 0) {
        plan.morning.push(dayDestinations[0]);
        if (dayDestinations.length > 1) plan.afternoon.push(dayDestinations[1]);
        if (dayDestinations.length > 2) plan.evening.push(dayDestinations[2]);
      }

      // Assign accommodation
      const accommodation = this.itinerary.accommodations.find(acc => {
        const checkIn = new Date(acc.checkIn);
        const checkOut = new Date(acc.checkOut);
        return currentDate >= checkIn && currentDate < checkOut;
      });
      
      if (accommodation) {
        plan.accommodation = accommodation;
        plan.totalCost += accommodation.pricePerNight || 0;
      }

      // Assign transportation
      const dayTransport = this.itinerary.transportation.filter(t => {
        if (!t.date) return false;
        const tDate = new Date(t.date);
        return tDate.toDateString() === currentDate.toDateString();
      });
      
      plan.transportation = dayTransport;
      plan.totalCost += dayTransport.reduce((sum, t) => sum + (t.price || 0), 0);

      // Add activities
      const dayActivities = this.itinerary.activities.filter(a => {
        if (!a.date) return false;
        const aDate = new Date(a.date);
        return aDate.toDateString() === currentDate.toDateString();
      });

      dayActivities.forEach(activity => {
        plan.totalCost += activity.cost || 0;
      });

      dailyPlans.push(plan);
    }

    this.itinerary.dailyPlans = dailyPlans;
    return this;
  }

  /**
   * Update estimated cost based on current components
   */
  updateEstimatedCost() {
    const accommodationCost = this.itinerary.accommodations.reduce(
      (sum, acc) => sum + (acc.totalCost || 0), 0
    );

    const transportCost = this.itinerary.transportation.reduce(
      (sum, t) => sum + (t.price || 0), 0
    );

    const activityCost = this.itinerary.activities.reduce(
      (sum, a) => sum + (a.cost || 0), 0
    );

    const destinationCost = this.itinerary.destinations.reduce(
      (sum, d) => sum + (d.entryFee || 0), 0
    );

    this.itinerary.estimatedCost = accommodationCost + transportCost + activityCost + destinationCost;
    return this;
  }

  /**
   * Set metadata
   */
  setMetadata(metadata) {
    this.itinerary.metadata = {
      ...this.itinerary.metadata,
      ...metadata,
    };
    return this;
  }

  /**
   * Mark as public
   */
  makePublic() {
    this.itinerary.metadata.isPublic = true;
    return this;
  }

  /**
   * Validate the itinerary before building
   */
  validate() {
    const errors = [];

    if (!this.itinerary.userId) {
      errors.push('User ID is required');
    }

    if (!this.itinerary.title) {
      errors.push('Title is required');
    }

    if (!this.itinerary.startDate || !this.itinerary.endDate) {
      errors.push('Start and end dates are required');
    }

    if (this.itinerary.endDate < this.itinerary.startDate) {
      errors.push('End date must be after start date');
    }

    if (this.itinerary.destinations.length === 0) {
      errors.push('At least one destination is required');
    }

    if (this.itinerary.budget && this.itinerary.estimatedCost > this.itinerary.budget) {
      errors.push(`Estimated cost (${this.itinerary.estimatedCost}) exceeds budget (${this.itinerary.budget})`);
    }

    if (errors.length > 0) {
      throw new Error(`Itinerary validation failed: ${errors.join(', ')}`);
    }

    return true;
  }

  /**
   * Build and return the itinerary
   */
  build() {
    this.validate();
    this.generateDailyPlans();
    this.updateEstimatedCost();
    this.itinerary.id = this.generateId();
    return this.itinerary;
  }

  /**
   * Reset the builder
   */
  reset() {
    this.itinerary = new Itinerary();
    return this;
  }

  /**
   * Generate unique ID
   */
  generateId() {
    return `itin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Director - Constructs itineraries using the builder
 */
export class ItineraryDirector {
  constructor(builder) {
    this.builder = builder;
  }

  /**
   * Construct a basic itinerary
   */
  constructBasicItinerary(userId, preferences, recommendations) {
    const { startDate, endDate, budget } = preferences;
    
    this.builder
      .setBasicInfo(
        userId,
        `${preferences.interests?.join(', ') || 'Recommended'} Trip`,
        'Auto-generated itinerary based on your preferences'
      )
      .setDates(startDate, endDate)
      .setBudget(budget)
      .setPreferences(preferences)
      .setStrategy(recommendations.strategy);

    // Add recommended destinations
    if (recommendations.locations) {
      this.builder.addDestinations(recommendations.locations);
    }

    // Add recommended hotels
    if (recommendations.hotels) {
      this.builder.addAccommodations(recommendations.hotels);
    }

    // Add recommended transport
    if (recommendations.transport) {
      this.builder.addMultipleTransportation(recommendations.transport);
    }

    return this.builder.build();
  }

  /**
   * Construct a detailed itinerary with custom activities
   */
  constructDetailedItinerary(userId, preferences, recommendations, customActivities = []) {
    const itinerary = this.constructBasicItinerary(userId, preferences, recommendations);
    
    // Reset and rebuild with activities
    this.builder.reset();
    this.builder.itinerary = itinerary;

    customActivities.forEach(activity => {
      this.builder.addActivity(activity, activity.date, activity.time);
    });

    return this.builder.build();
  }
}
