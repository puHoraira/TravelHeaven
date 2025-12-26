/**
 * Chain of Responsibility Pattern - Recommendation Filter Chain
 * Each handler in the chain processes user preferences and filters options
 * 
 * Benefits:
 * - Single Responsibility: Each handler has one filtering concern
 * - Open/Closed: New filters can be added without modifying existing ones
 * - Flexibility: Chain can be reordered or filtered handlers can be skipped
 */

/**
 * Abstract Handler - Base class for all filters
 */
export class RecommendationFilter {
  constructor() {
    this.nextFilter = null;
  }

  /**
   * Set the next filter in the chain
   * @param {RecommendationFilter} filter - Next filter to process
   * @returns {RecommendationFilter} The next filter (for chaining)
   */
  setNext(filter) {
    this.nextFilter = filter;
    return filter;
  }

  /**
   * Handle the filtering request
   * @param {Object} context - The recommendation context containing options and preferences
   * @returns {Object} Filtered context
   */
  async handle(context) {
    // Process current filter
    const filteredContext = await this.filter(context);
    
    // Pass to next filter if exists
    if (this.nextFilter) {
      return await this.nextFilter.handle(filteredContext);
    }
    
    return filteredContext;
  }

  /**
   * Abstract method to be implemented by concrete filters
   * @param {Object} context - The recommendation context
   * @returns {Object} Filtered context
   */
  async filter(context) {
    throw new Error('Filter method must be implemented by subclass');
  }
}

/**
 * Concrete Filter - Budget Filter
 * Filters locations, hotels, and transport options based on budget
 */
export class BudgetFilter extends RecommendationFilter {
  async filter(context) {
    const { preferences, options } = context;
    const { budget } = preferences;

    if (!budget || budget <= 0) {
      return context; // Skip if no budget constraint
    }

    console.log(`🔍 Applying Budget Filter: Max budget ${budget}`);

    // Filter hotels within budget (40% allocation)
    const hotelBudget = budget * 0.4;
    const filteredHotels = options.hotels.filter(hotel => {
      const pricePerNight = hotel.pricePerNight || hotel.priceRange?.min || 0;
      const totalNights = preferences.duration || 1;
      const totalHotelCost = pricePerNight * totalNights;
      return totalHotelCost <= hotelBudget && pricePerNight > 0; // Exclude zero-price hotels
    }).map(hotel => ({
      ...hotel,
      budgetScore: 1 - ((hotel.pricePerNight || hotel.priceRange?.min || 0) * (preferences.duration || 1)) / hotelBudget,
    })).sort((a, b) => b.budgetScore - a.budgetScore); // Best value first

    // Filter transport within budget (30% allocation)
    const transportBudget = budget * 0.3;
    const filteredTransport = options.transport.filter(transport => {
      const price = transport.price || transport.pricing?.amount || 0;
      return price <= transportBudget && price > 0; // Exclude zero-price transport
    }).map(transport => ({
      ...transport,
      budgetScore: 1 - ((transport.price || transport.pricing?.amount || 0) / transportBudget),
    })).sort((a, b) => b.budgetScore - a.budgetScore);

    // Filter locations (30% allocation for activities/entry fees)
    const locationBudget = budget * 0.3;
    const filteredLocations = options.locations
      .map(location => {
        const loc = location.toObject ? location.toObject() : location;
        const entryFee = typeof loc.entryFee === 'number' ? loc.entryFee : (loc.entryFee?.amount || 0);
        
        // Calculate priority: free locations get highest priority
        const priorityScore = entryFee === 0 ? 2.0 : 
                            (entryFee <= locationBudget * 0.1 ? 1.5 : 
                            (entryFee <= locationBudget * 0.3 ? 1.0 : 0.5));
        
        const budgetScore = entryFee === 0 ? 1 : (1 - entryFee / locationBudget);
        
        return {
          ...loc,
          priorityScore,
          budgetScore,
        };
      })
      .filter(loc => {
        const entryFee = typeof loc.entryFee === 'number' ? loc.entryFee : (loc.entryFee?.amount || 0);
        return entryFee <= locationBudget; // Only include if within budget
      })
      .sort((a, b) => {
        // Sort by priority first, then by rating
        if (b.priorityScore !== a.priorityScore) {
          return b.priorityScore - a.priorityScore;
        }
        const ratingA = a.rating?.average || 0;
        const ratingB = b.rating?.average || 0;
        return ratingB - ratingA;
      });

    console.log(`✅ Budget Filter: ${filteredLocations.length} locations, ${filteredHotels.length} hotels, ${filteredTransport.length} transport`);

    return {
      ...context,
      options: {
        hotels: filteredHotels,
        transport: filteredTransport,
        locations: filteredLocations,
      },
      filterChain: [...(context.filterChain || []), 'BudgetFilter'],
    };
  }
}

/**
 * Concrete Filter - Duration Filter
 * Ensures recommended activities fit within travel duration
 */
export class DurationFilter extends RecommendationFilter {
  async filter(context) {
    const { preferences, options } = context;
    const { duration } = preferences; // Duration in days

    if (!duration || duration <= 0) {
      return context;
    }

    console.log(`🔍 Applying Duration Filter: ${duration} days`);

    // Calculate maximum number of locations based on duration
    const maxLocationsPerDay = 3;
    const maxLocations = duration * maxLocationsPerDay;

    // Sort locations by rating and limit to realistic number
    const filteredLocations = options.locations
      .sort((a, b) => {
        const ratingA = a.rating?.average || a.rating || 0;
        const ratingB = b.rating?.average || b.rating || 0;
        return ratingB - ratingA;
      })
      .slice(0, maxLocations);

    // Filter transport based on travel time
    const maxTravelHoursPerDay = 4;
    const filteredTransport = options.transport.filter(transport => {
      // derive duration from available fields: numeric hours preferred; fallback simple 2h
      let travelHours = transport.estimatedDuration;
      if (travelHours == null) {
        const est = transport?.route?.duration?.estimated;
        if (typeof est === 'string') {
          // try to parse formats like "4h", "3.5h", "2-3h", "120m"
          const hoursMatch = est.match(/([0-9]+(?:\.[0-9]+)?)/);
          travelHours = hoursMatch ? parseFloat(hoursMatch[1]) : 2;
        } else {
          travelHours = 2;
        }
      }
      return travelHours <= maxTravelHoursPerDay;
    });

    return {
      ...context,
      options: {
        ...options,
        locations: filteredLocations,
        transport: filteredTransport,
      },
      metadata: {
        ...context.metadata,
        maxLocationsPerDay,
        totalDays: duration,
      },
      filterChain: [...(context.filterChain || []), 'DurationFilter'],
    };
  }
}

/**
 * Concrete Filter - Category Filter
 * Filters based on user interests (cultural, adventure, relaxation, etc.)
 */
export class CategoryFilter extends RecommendationFilter {
  async filter(context) {
    const { preferences, options } = context;
    const { interests } = preferences; // Array of interest categories

    if (!interests || interests.length === 0) {
      return context;
    }

    console.log(`🔍 Applying Category Filter: ${interests.join(', ')}`);

    // Debug: Log first few location categories
    console.log('Sample location categories:', options.locations.slice(0, 5).map(l => ({
      name: l.name,
      category: l.category
    })));
    
    // Debug: Log all unique categories
    const uniqueCategories = [...new Set(options.locations.map(l => l.category))];
    console.log('All unique categories in database:', uniqueCategories);

    // Filter locations matching user interests
    const filteredLocations = options.locations.filter(location => {
      const locationCategories = location.category || location.categories || [];
      const categoryArray = Array.isArray(locationCategories) 
        ? locationCategories 
        : [locationCategories];
      
      // Flexible category matching with synonyms and related categories
      return interests.some(interest => 
        categoryArray.some(cat => {
          const catLower = cat.toLowerCase();
          const interestLower = interest.toLowerCase();
          
          // Direct match or partial match
          if (catLower.includes(interestLower) || interestLower.includes(catLower)) {
            return true;
          }
          
          // Category synonyms and related interests
          const categoryMappings = {
            'relaxation': ['beach', 'resort', 'spa'],
            'adventure': ['natural', 'mountain', 'hiking', 'outdoor'],
            'cultural': ['historical', 'heritage', 'museum', 'temple'],
            'shopping': ['market', 'bazaar', 'mall', 'shopping', 'commercial'],
            'nature': ['natural', 'park', 'forest', 'wildlife', 'scenic'],
            'beach': ['coastal', 'seaside', 'ocean'],
            'historical': ['heritage', 'ancient', 'monument', 'cultural']
          };
          
          // Check if interest maps to this category
          const mappedCategories = categoryMappings[interestLower] || [];
          return mappedCategories.some(mapped => catLower.includes(mapped));
        })
      );
    }).map(location => {
      // Add relevance score based on category match
      const locationCategories = location.category || location.categories || [];
      const categoryArray = Array.isArray(locationCategories) 
        ? locationCategories 
        : [locationCategories];
      
      const matchCount = interests.filter(interest =>
        categoryArray.some(cat =>
          cat.toLowerCase().includes(interest.toLowerCase())
        )
      ).length;
      
      return {
        ...location,
        relevanceScore: matchCount / interests.length,
      };
    });

    // FALLBACK: If no locations match, return all locations with low relevance scores
    // This prevents the recommendation system from completely failing
    if (filteredLocations.length === 0) {
      console.log('⚠️ No locations matched interests, returning all locations');
      return {
        ...context,
        options: {
          ...options,
          locations: options.locations.map(loc => ({ ...loc, relevanceScore: 0.1 })),
        },
        filterChain: [...(context.filterChain || []), 'CategoryFilter (fallback)'],
      };
    }

    // Sort by relevance
    const sortedLocations = filteredLocations.sort((a, b) => 
      (b.relevanceScore || 0) - (a.relevanceScore || 0)
    );

    return {
      ...context,
      options: {
        ...options,
        locations: sortedLocations,
      },
      filterChain: [...(context.filterChain || []), 'CategoryFilter'],
    };
  }
}

/**
 * Concrete Filter - Availability Filter
 * Checks real-time availability of hotels and transport
 */
export class AvailabilityFilter extends RecommendationFilter {
  async filter(context) {
    const { preferences, options } = context;
    const { startDate, endDate } = preferences;

    if (!startDate || !endDate) {
      return context; // Skip if no dates provided
    }

    console.log(`🔍 Applying Availability Filter: ${startDate} to ${endDate}`);

    // Locations are generally always available - no date restrictions
    const filteredLocations = options.locations;

    // In real implementation, this would check database for bookings
    // For now, we'll assume most hotels and transport are available
    const filteredHotels = options.hotels.filter(hotel => {
      // Assume 80% of hotels are available
      const isAvailable = Math.random() > 0.2;
      if (isAvailable && hotel.availableRooms !== undefined) {
        return hotel.availableRooms > 0;
      }
      return isAvailable;
    });

    const filteredTransport = options.transport.filter(transport => {
      // Assume 90% of transport is available
      const isAvailable = Math.random() > 0.1;
      if (isAvailable && transport.availableSeats !== undefined) {
        return transport.availableSeats > 0;
      }
      return isAvailable;
    });

    return {
      ...context,
      options: {
        ...options,
        locations: filteredLocations,
        hotels: filteredHotels,
        transport: filteredTransport,
      },
      filterChain: [...(context.filterChain || []), 'AvailabilityFilter'],
    };
  }
}

/**
 * Concrete Filter - Rating Filter
 * Prioritizes highly-rated options
 */
export class RatingFilter extends RecommendationFilter {
  async filter(context) {
    const { preferences, options } = context;
    const { minRating = 3.5 } = preferences;

    console.log(`🔍 Applying Rating Filter: Minimum rating ${minRating}`);

    const filteredLocations = options.locations
      .filter(loc => {
        const rating = loc.rating?.average || loc.rating || 0;
        return rating >= minRating;
      })
      .sort((a, b) => {
        // Sort by rating descending, then by review count
        const ratingA = a.rating?.average || a.rating || 0;
        const ratingB = b.rating?.average || b.rating || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        
        const countA = a.rating?.count || 0;
        const countB = b.rating?.count || 0;
        return countB - countA;
      });

    const filteredHotels = options.hotels
      .filter(hotel => {
        const hotelRating = hotel.rating?.average || hotel.rating || 0;
        return hotelRating >= minRating;
      })
      .sort((a, b) => {
        const ratingA = a.rating?.average || a.rating || 0;
        const ratingB = b.rating?.average || b.rating || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        
        const countA = a.rating?.count || 0;
        const countB = b.rating?.count || 0;
        return countB - countA;
      });
    
    const filteredTransport = options.transport
      .filter(transport => {
        const tRating = transport.rating?.average || transport.averageRating || 0;
        return tRating >= minRating;
      })
      .sort((a, b) => {
        const ratingA = a.rating?.average || a.averageRating || 0;
        const ratingB = b.rating?.average || b.averageRating || 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        
        const countA = a.rating?.count || a.totalReviews || 0;
        const countB = b.rating?.count || b.totalReviews || 0;
        return countB - countA;
      });

    console.log(`✅ Rating Filter: ${filteredLocations.length} locations, ${filteredHotels.length} hotels, ${filteredTransport.length} transport`);

    return {
      ...context,
      options: {
        ...options,
        locations: filteredLocations,
        hotels: filteredHotels,
        transport: filteredTransport,
      },
      filterChain: [...(context.filterChain || []), 'RatingFilter'],
    };
  }
}

/**
 * Filter Chain Builder
 * Utility to easily construct filter chains
 */
export class FilterChainBuilder {
  constructor() {
    this.filters = [];
  }

  addBudgetFilter() {
    this.filters.push(new BudgetFilter());
    return this;
  }

  addDurationFilter() {
    this.filters.push(new DurationFilter());
    return this;
  }

  addCategoryFilter() {
    this.filters.push(new CategoryFilter());
    return this;
  }

  addAvailabilityFilter() {
    this.filters.push(new AvailabilityFilter());
    return this;
  }

  addRatingFilter() {
    this.filters.push(new RatingFilter());
    return this;
  }

  build() {
    if (this.filters.length === 0) {
      throw new Error('At least one filter must be added to the chain');
    }

    // Link filters together
    for (let i = 0; i < this.filters.length - 1; i++) {
      this.filters[i].setNext(this.filters[i + 1]);
    }

    // Return the first filter (entry point to chain)
    return this.filters[0];
  }
}
