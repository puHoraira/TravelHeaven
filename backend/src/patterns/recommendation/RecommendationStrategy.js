/**
 * Strategy Pattern - Recommendation Strategies
 * Different algorithms for generating itinerary recommendations
 * 
 * Benefits:
 * - Open/Closed: New strategies can be added without modifying existing ones
 * - Single Responsibility: Each strategy encapsulates one algorithm
 * - Runtime flexibility: Strategies can be swapped based on user preferences
 */

/**
 * Abstract Strategy - Base class for all recommendation strategies
 */
export class RecommendationStrategy {
  /**
   * Generate recommendations based on filtered options
   * @param {Object} context - Filtered recommendation context
   * @returns {Object} Optimized recommendations
   */
  async recommend(context) {
    throw new Error('Recommend method must be implemented by subclass');
  }

  /**
   * Calculate score for prioritization
   * @param {Object} item - Location, hotel, or transport
   * @param {Object} preferences - User preferences
   * @returns {number} Priority score
   */
  calculateScore(item, preferences) {
    throw new Error('CalculateScore method must be implemented by subclass');
  }
}

// Helper accessors to normalize differing schema fields across models
const ratingOf = (item) => {
  const r = item?.rating;
  if (typeof r === 'number') return r;
  if (r && typeof r === 'object' && typeof r.average === 'number') return r.average;
  if (typeof item?.averageRating === 'number') return item.averageRating;
  return 0;
};

const hotelPricePerNightOf = (hotel, fallbackBudget = 0) => {
  if (typeof hotel?.pricePerNight === 'number') return hotel.pricePerNight;
  if (Array.isArray(hotel?.rooms) && hotel.rooms[0]?.pricePerNight) return hotel.rooms[0].pricePerNight;
  if (typeof hotel?.priceRange?.min === 'number') return hotel.priceRange.min;
  // last resort: rough guess from budget
  return Math.max(0, Math.floor(fallbackBudget * 0.1));
};

const transportPriceOf = (t) => {
  if (typeof t?.price === 'number') return t.price;
  if (typeof t?.pricing?.amount === 'number') return t.pricing.amount;
  return 0;
};

const isLocationItem = (item) => {
  return Boolean(item && (item.category || item.entryFee || item.city || item.region));
};

const isHotelItem = (item) => {
  return Boolean(
    item
      && (
        typeof item.pricePerNight === 'number'
        || typeof item.priceRange?.min === 'number'
        || (Array.isArray(item.rooms) && item.rooms.length > 0)
      )
  );
};

const isTransportItem = (item) => {
  return Boolean(
    item
      && (typeof item.type === 'string')
      && (typeof item.price === 'number' || typeof item.pricing?.amount === 'number')
      && !isHotelItem(item)
      && !isLocationItem(item)
  );
};

/**
 * Concrete Strategy - Budget Optimized Strategy
 * Minimizes costs while maximizing value and experiences
 */
export class BudgetOptimizedStrategy extends RecommendationStrategy {
  async recommend(context) {
    const { options, preferences } = context;
    const { budget, duration } = preferences;

    console.log('💰 Applying Budget Optimized Strategy');

    // Prioritize free or low-cost locations
    const scoredLocations = options.locations.map(location => ({
      ...location,
      score: this.calculateScore(location, preferences),
    })).sort((a, b) => b.score - a.score);

    // Select budget-friendly hotels
    const scoredHotels = options.hotels.map(hotel => ({
      ...hotel,
      score: this.calculateScore(hotel, preferences),
    })).sort((a, b) => b.score - a.score);

    // Select economical transport
    const scoredTransport = options.transport.map(transport => ({
      ...transport,
      score: this.calculateScore(transport, preferences),
    })).sort((a, b) => b.score - a.score);

    return {
      locations: scoredLocations.slice(0, duration * 3),
      hotels: scoredHotels.slice(0, Math.ceil(duration / 2)),
      transport: scoredTransport.slice(0, 3),
      strategy: 'BudgetOptimized',
      estimatedCost: this.calculateTotalCost(scoredLocations, scoredHotels, scoredTransport, duration),
    };
  }

  calculateScore(item, preferences) {
    const { budget } = preferences;
    
    // For locations: prioritize rating and low/no cost
    if (isLocationItem(item) || item.type === 'location') {
      const entryFee = typeof item.entryFee === 'number' ? item.entryFee : (item.entryFee?.amount || 0);
      const costScore = entryFee ? (1 - entryFee / Math.max(1, budget * 0.1)) : 1;
      const ratingScore = ratingOf(item) / 5;
      return (costScore * 0.6) + (ratingScore * 0.4);
    }

    // For hotels: prioritize low price and decent rating
    if (isHotelItem(item)) {
      const ppn = hotelPricePerNightOf(item, budget);
      const costScore = 1 - (ppn / Math.max(1, budget * 0.4));
      const ratingScore = ratingOf(item) / 5;
      return (costScore * 0.7) + (ratingScore * 0.3);
    }

    // For transport: prioritize low cost
    if (isTransportItem(item)) {
      const price = transportPriceOf(item);
      const costScore = 1 - (price / Math.max(1, budget * 0.3));
      const reliabilityScore = ratingOf(item) / 5;
      return (costScore * 0.8) + (reliabilityScore * 0.2);
    }

    return 0.5;
  }

  calculateTotalCost(locations, hotels, transport, duration) {
    const locationCost = locations.reduce((sum, loc) => sum + (typeof loc.entryFee === 'number' ? loc.entryFee : (loc.entryFee?.amount || 0)), 0);
    const hotelCost = hotels.reduce((sum, hotel) => sum + hotelPricePerNightOf(hotel) * duration, 0);
    const transportCost = transport.reduce((sum, t) => sum + transportPriceOf(t), 0);
    return locationCost + hotelCost + transportCost;
  }
}

/**
 * Concrete Strategy - Activity Driven Strategy
 * Focuses on maximizing experiences and activity variety
 */
export class ActivityDrivenStrategy extends RecommendationStrategy {
  async recommend(context) {
    const { options, preferences } = context;
    const { duration, interests } = preferences;

    console.log('🎯 Applying Activity Driven Strategy');

    // Maximize variety and unique experiences
    const scoredLocations = options.locations.map(location => ({
      ...location,
      score: this.calculateScore(location, preferences),
    })).sort((a, b) => b.score - a.score);

    // Select diverse locations (avoid same category clustering)
    const diverseLocations = this.selectDiverseLocations(scoredLocations, duration * 4);

    // Hotels near activity hotspots
    const scoredHotels = options.hotels.map(hotel => ({
      ...hotel,
      score: this.calculateScore(hotel, preferences),
    })).sort((a, b) => b.score - a.score);

    const scoredTransport = options.transport.sort((a, b) => 
      ratingOf(b) - ratingOf(a)
    );

    return {
      locations: diverseLocations,
      hotels: scoredHotels.slice(0, Math.ceil(duration / 2)),
      transport: scoredTransport.slice(0, 3),
      strategy: 'ActivityDriven',
      activityVariety: this.calculateVarietyScore(diverseLocations),
    };
  }

  calculateScore(item, preferences) {
    const { interests } = preferences;

    // For locations: prioritize rating and category match
    if (item.category || item.type === 'location') {
      const ratingScore = ratingOf(item) / 5;
      const categoryMatch = item.relevanceScore || 0.5;
      const popularityScore = (item.reviewCount || 0) / 100; // Normalize
      return (ratingScore * 0.4) + (categoryMatch * 0.4) + (Math.min(popularityScore, 1) * 0.2);
    }

    // For hotels: prioritize amenities and location
    if (item.pricePerNight !== undefined) {
      const ratingScore = ratingOf(item) / 5;
      const amenitiesScore = (item.amenities?.length || 0) / 10;
      return (ratingScore * 0.6) + (Math.min(amenitiesScore, 1) * 0.4);
    }

    return ratingOf(item) / 5;
  }

  selectDiverseLocations(locations, maxCount) {
    const selected = [];
    const categoryCount = {};

    for (const location of locations) {
      if (selected.length >= maxCount) break;

      const categories = Array.isArray(location.category) 
        ? location.category 
        : [location.category];
      
      const primaryCategory = categories[0];
      
      // Limit same category to avoid repetition
      if (!categoryCount[primaryCategory] || categoryCount[primaryCategory] < 2) {
        selected.push(location);
        categoryCount[primaryCategory] = (categoryCount[primaryCategory] || 0) + 1;
      }
    }

    return selected;
  }

  calculateVarietyScore(locations) {
    const categories = new Set();
    locations.forEach(loc => {
      const cats = Array.isArray(loc.category) ? loc.category : [loc.category];
      cats.forEach(cat => categories.add(cat));
    });
    return categories.size;
  }
}

/**
 * Concrete Strategy - Comfort Prioritized Strategy
 * Balances comfort, convenience, and quality
 */
export class ComfortPrioritizedStrategy extends RecommendationStrategy {
  async recommend(context) {
    const { options, preferences } = context;
    const { duration } = preferences;

    console.log('🛋️ Applying Comfort Prioritized Strategy');

    // Prioritize highly-rated, comfortable options
    const scoredLocations = options.locations.map(location => ({
      ...location,
      score: this.calculateScore(location, preferences),
    })).sort((a, b) => b.score - a.score);

    // Select top-rated hotels with good amenities
    const scoredHotels = options.hotels.map(hotel => ({
      ...hotel,
      score: this.calculateScore(hotel, preferences),
    })).sort((a, b) => b.score - a.score);

    // Prefer comfortable transport (less crowded, better rated)
    const scoredTransport = options.transport.map(transport => ({
      ...transport,
      score: this.calculateScore(transport, preferences),
    })).sort((a, b) => b.score - a.score);

    return {
      locations: scoredLocations.slice(0, duration * 2), // Fewer locations, more time at each
      hotels: scoredHotels.slice(0, Math.max(2, Math.ceil(duration / 2))),
      transport: scoredTransport.slice(0, 2),
      strategy: 'ComfortPrioritized',
      comfortRating: this.calculateComfortRating(scoredHotels, scoredTransport),
    };
  }

  calculateScore(item, preferences) {
    // For locations: prioritize rating and less crowding
    if (item.category || item.type === 'location') {
      const ratingScore = ratingOf(item) / 5;
      const crowdScore = item.crowdLevel ? (1 - item.crowdLevel / 5) : 0.5;
      return (ratingScore * 0.7) + (crowdScore * 0.3);
    }

    // For hotels: prioritize rating, amenities, and room quality
    if (item.pricePerNight !== undefined) {
      const ratingScore = ratingOf(item) / 5;
      const amenitiesScore = (item.amenities?.length || 0) / 10;
      const qualityScore = item.starRating ? (item.starRating / 5) : 0.5;
      return (ratingScore * 0.5) + (Math.min(amenitiesScore, 1) * 0.3) + (qualityScore * 0.2);
    }

    // For transport: prioritize rating and comfort class
    if (item.price !== undefined) {
      const ratingScore = ratingOf(item) / 5;
      const comfortScore = item.class === 'first' || item.class === 'business' ? 1 : 0.5;
      return (ratingScore * 0.6) + (comfortScore * 0.4);
    }

    return ratingOf(item) / 5;
  }

  calculateComfortRating(hotels, transport) {
    const hotelRating = hotels.reduce((sum, h) => sum + ratingOf(h), 0) / Math.max(hotels.length, 1);
    const transportRating = transport.reduce((sum, t) => sum + ratingOf(t), 0) / Math.max(transport.length, 1);
    return ((hotelRating + transportRating) / 2).toFixed(1);
  }
}

/**
 * Concrete Strategy - Time Efficient Strategy
 * Optimizes for minimal travel time and efficient routing
 */
export class TimeEfficientStrategy extends RecommendationStrategy {
  async recommend(context) {
    const { options, preferences } = context;
    const { duration } = preferences;

    console.log('⚡ Applying Time Efficient Strategy');

    // Group locations by proximity
    const clusteredLocations = this.clusterByProximity(options.locations);
    
    // Select top locations from each cluster
    const optimizedLocations = this.selectFromClusters(clusteredLocations, duration * 3);

    // Select hotels at central locations
    const centralHotels = options.hotels.map(hotel => ({
      ...hotel,
      score: this.calculateScore(hotel, preferences),
    })).sort((a, b) => b.score - a.score);

    // Prefer faster transport options
    const fastTransport = options.transport.filter(t => 
      t.type === 'flight' || t.type === 'express-train'
    ).concat(options.transport.filter(t => 
      t.type !== 'flight' && t.type !== 'express-train'
    ));

    return {
      locations: optimizedLocations,
      hotels: centralHotels.slice(0, 2), // Fewer hotel changes
      transport: fastTransport.slice(0, 3),
      strategy: 'TimeEfficient',
      estimatedTravelTime: this.calculateTravelTime(optimizedLocations, fastTransport),
    };
  }

  calculateScore(item, preferences) {
    // For hotels: prioritize central location and easy access
    if (item.pricePerNight !== undefined) {
      const ratingScore = ratingOf(item) / 5;
      const centralityScore = item.distanceFromCenter ? 
        (1 - Math.min(item.distanceFromCenter / 10, 1)) : 0.5;
      return (ratingScore * 0.4) + (centralityScore * 0.6);
    }

    return ratingOf(item) / 5;
  }

  clusterByProximity(locations) {
    // Simple clustering: group by city/region if available
    const clusters = {};
    
    locations.forEach(loc => {
      const region = loc.city || loc.region || 'default';
      if (!clusters[region]) {
        clusters[region] = [];
      }
      clusters[region].push(loc);
    });

    return Object.values(clusters);
  }

  selectFromClusters(clusters, maxCount) {
    const selected = [];
    let clusterIndex = 0;

    while (selected.length < maxCount && clusters.length > 0) {
      const cluster = clusters[clusterIndex % clusters.length];
      if (cluster && cluster.length > 0) {
        // Take highest rated from cluster
        const best = cluster.sort((a, b) => ratingOf(b) - ratingOf(a))[0];
        selected.push(best);
        cluster.shift();
      }
      clusterIndex++;

      // Remove empty clusters
      clusters = clusters.filter(c => c.length > 0);
    }

    return selected;
  }

  calculateTravelTime(locations, transport) {
    const avgTransportTime = transport.reduce((sum, t) => 
      sum + (t.estimatedDuration || 2), 0
    ) / Math.max(transport.length, 1);
    
    const locationVisitTime = locations.length * 2; // 2 hours per location
    
    return (avgTransportTime + locationVisitTime).toFixed(1);
  }
}

/**
 * Strategy Context - Manages strategy selection and execution
 */
export class RecommendationStrategyContext {
  constructor(strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy) {
    this.strategy = strategy;
  }

  async executeStrategy(context) {
    if (!this.strategy) {
      throw new Error('No strategy set');
    }

    return await this.strategy.recommend(context);
  }
}

/**
 * Strategy Factory - Creates strategies based on user preference
 */
export class StrategyFactory {
  static createStrategy(preferenceType) {
    const strategies = {
      'budget': new BudgetOptimizedStrategy(),
      'activity': new ActivityDrivenStrategy(),
      'comfort': new ComfortPrioritizedStrategy(),
      'time': new TimeEfficientStrategy(),
    };

    const strategy = strategies[preferenceType.toLowerCase()];
    
    if (!strategy) {
      throw new Error(`Unknown strategy type: ${preferenceType}`);
    }

    return strategy;
  }
}
