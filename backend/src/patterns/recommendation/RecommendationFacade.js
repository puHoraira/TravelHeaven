/**
 * Facade Pattern - Recommendation Facade
 * Provides a simplified interface to the complex recommendation subsystem
 * 
 * Benefits:
 * - Simplifies client interaction with complex subsystems
 * - Decouples clients from subsystem components
 * - Promotes loose coupling
 * - Makes the subsystem easier to use and understand
 */

import { FilterChainBuilder } from './ChainOfResponsibility.js';
import { StrategyFactory, RecommendationStrategyContext } from './RecommendationStrategy.js';
import { ItineraryBuilder, ItineraryDirector } from './ItineraryBuilder.js';
import { DecoratorFactory } from './ItineraryDecorator.js';
import { Itinerary } from '../../models/Itinerary.js';
import mongoose from 'mongoose';

// Import repositories
import {
  LocationRepository,
  HotelRepository,
  TransportRepository,
} from '../Repository.js';

/**
 * Recommendation Facade
 * Single entry point for the entire recommendation system
 */
export class RecommendationFacade {
  constructor() {
    // Initialize repositories
    this.locationRepo = new LocationRepository();
    this.hotelRepo = new HotelRepository();
    this.transportRepo = new TransportRepository();
  }

  /**
   * Main method: Generate complete personalized itinerary
   * @param {string} userId - User ID requesting recommendation
   * @param {Object} preferences - User preferences
   * @returns {Object} Complete itinerary with all enhancements
   */
  async generateRecommendation(userId, preferences) {
    try {
      console.log('🎯 Starting Recommendation Generation...');
      console.log('User Preferences:', preferences);

      // Step 1: Fetch all available options from database
      const availableOptions = await this.fetchAvailableOptions(preferences);
      console.log(`✅ Fetched ${availableOptions.locations.length} locations, ${availableOptions.hotels.length} hotels, ${availableOptions.transport.length} transport options`);

      // If we have no approved locations, we can't build an itinerary
      if (!availableOptions.locations || availableOptions.locations.length === 0) {
        return {
          success: false,
          code: 'NO_LOCATIONS',
          error: 'No approved locations are available yet. Please add and approve at least one location before generating recommendations.',
          itinerary: null,
        };
      }

      // Step 2: Build and execute filter chain
      const filteredOptions = await this.applyFilters(availableOptions, preferences);
      console.log(`✅ Filtered to ${filteredOptions.options.locations.length} locations, ${filteredOptions.options.hotels.length} hotels, ${filteredOptions.options.transport.length} transport options`);

      // If filters remove everything, return a friendly error
      if (!filteredOptions?.options?.locations || filteredOptions.options.locations.length === 0) {
        return {
          success: false,
          code: 'NO_MATCHING_LOCATIONS',
          error: 'No locations match your current preferences. Try lowering minRating, changing interests, or removing region/destination filters.',
          itinerary: null,
        };
      }

      // Step 3: Apply recommendation strategy
      const recommendations = await this.applyStrategy(filteredOptions, preferences);
      console.log(`✅ Strategy applied: ${recommendations.strategy}`);

      if (!recommendations?.locations || recommendations.locations.length === 0) {
        return {
          success: false,
          code: 'NO_DESTINATIONS',
          error: 'No destinations could be selected with the current data and preferences.',
          itinerary: null,
        };
      }

      // Step 4: Build base itinerary
      const baseItinerary = await this.buildItinerary(userId, preferences, recommendations);
      console.log(`✅ Base itinerary built with ${baseItinerary.destinations.length} destinations`);

      // Step 5: Apply decorators for enhancements
      const enhancedItinerary = await this.enhanceItinerary(baseItinerary, preferences);
      console.log(`✅ Itinerary enhanced with: ${preferences.enhancements?.join(', ') || 'none'}`);

      // Step 6: Return final recommendation
      return {
        success: true,
        itinerary: enhancedItinerary.getData(),
        summary: {
          totalDestinations: enhancedItinerary.getData().destinations.length,
          totalCost: enhancedItinerary.getCost(),
          features: enhancedItinerary.getFeatures(),
          description: enhancedItinerary.getDescription(),
          filtersApplied: filteredOptions.filterChain || [],
          strategyUsed: recommendations.strategy,
          enhancements: preferences.enhancements || [],
        },
      };
    } catch (error) {
      console.error('❌ Error generating recommendation:', error);
      return {
        success: false,
        error: error.message,
        itinerary: null,
      };
    }
  }

  /**
   * Fetch available options from database
   * @param {Object} preferences - User preferences
   * @returns {Object} Available locations, hotels, and transport
   */
  async fetchAvailableOptions(preferences) {
    const { destination, region } = preferences;

    // Build query filters - ONLY APPROVED ITEMS
    const locationFilter = { approvalStatus: 'approved' };
    const hotelFilter = { approvalStatus: 'approved' };
    const transportFilter = { approvalStatus: 'approved' };

    if (destination) {
      locationFilter.city = destination;
      hotelFilter.address = { $regex: destination, $options: 'i' };
    }

    if (region) {
      locationFilter.region = region;
      hotelFilter.region = region;
    }

    // Fetch from repositories (with pagination) - APPROVED ONLY
    const [locationsResult, hotelsResult, transportResult] = await Promise.all([
      this.locationRepo.findApproved(locationFilter, { limit: 100, page: 1 }),
      this.hotelRepo.findApproved(hotelFilter, { limit: 50, page: 1 }),
      this.transportRepo.findApproved(transportFilter, { limit: 30, page: 1 }),
    ]);

    // Normalize and validate data
    const locations = this.normalizeLocations(locationsResult.data || []);
    const hotels = this.normalizeHotels(hotelsResult.data || []);
    const transport = this.normalizeTransport(transportResult.data || []);

    console.log(`📦 Fetched: ${locations.length} locations, ${hotels.length} hotels, ${transport.length} transport`);

    return { locations, hotels, transport };
  }

  /**
   * Normalize location data for consistency
   */
  normalizeLocations(locations) {
    return locations
      .filter(loc => {
        // Filter out incomplete locations
        const hasName = loc?.name && loc.name.trim().length > 0;
        const hasCategory = loc?.category && loc.category !== 'other';
        const hasRating = loc?.rating?.average != null || typeof loc.rating === 'number';
        return hasName && hasCategory && hasRating;
      })
      .map(loc => {
        const normalized = loc.toObject ? loc.toObject() : { ...loc };
        
        // Normalize rating
        if (typeof normalized.rating === 'number') {
          normalized.rating = { average: normalized.rating, count: 0 };
        }
        
        // Normalize entry fee
        if (typeof normalized.entryFee === 'number') {
          normalized.entryFee = { amount: normalized.entryFee, currency: 'BDT' };
        } else if (!normalized.entryFee) {
          normalized.entryFee = { amount: 0, currency: 'BDT' };
        }
        
        // Quality score
        normalized.qualityScore = this.calculateLocationQuality(normalized);
        
        return normalized;
      })
      .filter(loc => loc.qualityScore > 0.3); // Filter low-quality
  }

  /**
   * Normalize hotel data for consistency
   */
  normalizeHotels(hotels) {
    return hotels
      .filter(hotel => {
        // Filter out incomplete hotels
        const hasName = hotel?.name && hotel.name.trim().length > 0;
        const hasPrice = hotel?.priceRange?.min != null || hotel?.rooms?.[0]?.pricePerNight != null;
        const hasRating = hotel?.rating?.average != null || typeof hotel.rating === 'number';
        return hasName && hasPrice && hasRating;
      })
      .map(hotel => {
        const normalized = hotel.toObject ? hotel.toObject() : { ...hotel };
        
        // Normalize rating
        if (typeof normalized.rating === 'number') {
          normalized.rating = { average: normalized.rating, count: 0 };
        } else if (typeof normalized.averageRating === 'number') {
          normalized.rating = { average: normalized.averageRating, count: normalized.totalReviews || 0 };
        }
        
        // Normalize price
        if (!normalized.pricePerNight && normalized.priceRange?.min) {
          normalized.pricePerNight = normalized.priceRange.min;
        } else if (!normalized.pricePerNight && normalized.rooms?.[0]?.pricePerNight) {
          normalized.pricePerNight = normalized.rooms[0].pricePerNight;
        }
        
        // Ensure amenities array
        normalized.amenities = normalized.amenities || normalized.facilities || [];
        
        // Quality score
        normalized.qualityScore = this.calculateHotelQuality(normalized);
        
        return normalized;
      })
      .filter(hotel => hotel.qualityScore > 0.3);
  }

  /**
   * Normalize transport data for consistency
   */
  normalizeTransport(transport) {
    return transport
      .filter(t => {
        // Filter out incomplete transport
        const hasName = t?.name && t.name.trim().length > 0;
        const hasType = t?.type;
        const hasPrice = t?.pricing?.amount != null || t?.price != null;
        return hasName && hasType && hasPrice;
      })
      .map(t => {
        const normalized = t.toObject ? t.toObject() : { ...t };
        
        // Normalize rating
        if (typeof normalized.rating === 'number') {
          normalized.rating = { average: normalized.rating, count: 0 };
        } else if (typeof normalized.averageRating === 'number') {
          normalized.rating = { average: normalized.averageRating, count: normalized.totalReviews || 0 };
        }
        
        // Normalize price
        if (!normalized.price && normalized.pricing?.amount != null) {
          normalized.price = normalized.pricing.amount;
        }
        
        // Normalize duration
        if (!normalized.estimatedDuration && normalized.route?.duration?.estimated) {
          const est = normalized.route.duration.estimated;
          const match = typeof est === 'string' ? est.match(/([0-9]+(?:\.[0-9]+)?)/) : null;
          normalized.estimatedDuration = match ? parseFloat(match[1]) : 2;
        }
        
        // Ensure facilities array
        normalized.facilities = normalized.facilities || [];
        
        // Quality score
        normalized.qualityScore = this.calculateTransportQuality(normalized);
        
        return normalized;
      })
      .filter(t => t.qualityScore > 0.3);
  }

  /**
   * Calculate location quality score (0-1)
   */
  calculateLocationQuality(location) {
    let score = 0;
    
    // Rating score (0-0.4)
    const rating = location.rating?.average || 0;
    score += (rating / 5) * 0.4;
    
    // Review count score (0-0.2)
    const reviewCount = location.rating?.count || 0;
    score += Math.min(reviewCount / 100, 1) * 0.2;
    
    // Description quality (0-0.2)
    const descLength = location.description?.length || 0;
    score += Math.min(descLength / 200, 1) * 0.2;
    
    // Has coordinates (0-0.1)
    if (location.coordinates?.latitude && location.coordinates?.longitude) {
      score += 0.1;
    }
    
    // Has images (0-0.1)
    if (location.images && location.images.length > 0) {
      score += 0.1;
    }
    
    return score;
  }

  /**
   * Calculate hotel quality score (0-1)
   */
  calculateHotelQuality(hotel) {
    let score = 0;
    
    // Rating score (0-0.4)
    const rating = hotel.rating?.average || 0;
    score += (rating / 5) * 0.4;
    
    // Amenities score (0-0.2)
    const amenityCount = hotel.amenities?.length || 0;
    score += Math.min(amenityCount / 10, 1) * 0.2;
    
    // Has price info (0-0.2)
    if (hotel.pricePerNight > 0 || (hotel.priceRange?.min > 0)) {
      score += 0.2;
    }
    
    // Has location (0-0.1)
    if (hotel.location?.coordinates && hotel.location.coordinates.length === 2) {
      score += 0.1;
    }
    
    // Has contact info (0-0.1)
    if (hotel.contactInfo?.phone || hotel.contactInfo?.email) {
      score += 0.1;
    }
    
    return score;
  }

  /**
   * Calculate transport quality score (0-1)
   */
  calculateTransportQuality(transport) {
    let score = 0;
    
    // Rating score (0-0.3)
    const rating = transport.rating?.average || transport.averageRating || 0;
    score += (rating / 5) * 0.3;
    
    // Has route info (0-0.3)
    if (transport.route?.from && transport.route?.to) {
      score += 0.3;
    }
    
    // Has pricing (0-0.2)
    if (transport.price > 0 || transport.pricing?.amount > 0) {
      score += 0.2;
    }
    
    // Has facilities (0-0.1)
    if (transport.facilities && transport.facilities.length > 0) {
      score += 0.1;
    }
    
    // Has operator info (0-0.1)
    if (transport.operator?.name) {
      score += 0.1;
    }
    
    return score;
  }

  /**
   * Apply filter chain to available options
   * @param {Object} options - Available options
   * @param {Object} preferences - User preferences
   * @returns {Object} Filtered context
   */
  async applyFilters(options, preferences) {
    // Build filter chain based on preferences
    const chainBuilder = new FilterChainBuilder();

    if (preferences.budget) {
      chainBuilder.addBudgetFilter();
    }

    if (preferences.duration) {
      chainBuilder.addDurationFilter();
    }

    if (preferences.interests && preferences.interests.length > 0) {
      chainBuilder.addCategoryFilter();
    }

    if (preferences.minRating) {
      chainBuilder.addRatingFilter();
    }

    if (preferences.startDate && preferences.endDate) {
      chainBuilder.addAvailabilityFilter();
    }

    // Build and execute chain
    const filterChain = chainBuilder.build();
    const context = {
      preferences,
      options,
      filterChain: [],
    };

    return await filterChain.handle(context);
  }

  /**
   * Apply recommendation strategy
   * @param {Object} filteredContext - Filtered options and preferences
   * @param {Object} preferences - User preferences
   * @returns {Object} Optimized recommendations
   */
  async applyStrategy(filteredContext, preferences) {
    // Determine strategy based on user preference
    const strategyType = preferences.optimizationGoal || 'budget';
    
    // Create strategy
    const strategy = StrategyFactory.createStrategy(strategyType);
    const strategyContext = new RecommendationStrategyContext(strategy);

    // Execute strategy
    return await strategyContext.executeStrategy(filteredContext);
  }

  /**
   * Build base itinerary using Builder pattern
   * @param {string} userId - User ID
   * @param {Object} preferences - User preferences
   * @param {Object} recommendations - Strategy recommendations
   * @returns {Object} Built itinerary
   */
  async buildItinerary(userId, preferences, recommendations) {
    const builder = new ItineraryBuilder();
    const director = new ItineraryDirector(builder);

    return director.constructBasicItinerary(userId, preferences, recommendations);
  }

  /**
   * Enhance itinerary with decorators
   * @param {Object} itinerary - Base itinerary
   * @param {Object} preferences - User preferences
   * @returns {Object} Enhanced itinerary component
   */
  async enhanceItinerary(itinerary, preferences) {
    const enhancements = preferences.enhancements || [];
    return DecoratorFactory.enhance(itinerary, enhancements);
  }

  /**
   * Quick recommendation - Simplified version
   * @param {string} userId - User ID
   * @param {Object} simplePreferences - Simple preferences (budget, duration, interests)
   * @returns {Object} Quick recommendation
   */
  async getQuickRecommendation(userId, simplePreferences) {
    const { budget, duration, interests } = simplePreferences;

    // Build full preferences with defaults
    const preferences = {
      budget: budget || 1000,
      duration: duration || 3,
      interests: interests || ['cultural', 'historical'],
      optimizationGoal: 'budget',
      minRating: 3.5,
      enhancements: [],
      startDate: new Date(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
    };

    return await this.generateRecommendation(userId, preferences);
  }

  /**
   * Get recommendation with specific strategy
   * @param {string} userId - User ID
   * @param {Object} preferences - User preferences
   * @param {string} strategyType - Strategy to use (budget, activity, comfort, time)
   * @returns {Object} Recommendation with specific strategy
   */
  async getRecommendationWithStrategy(userId, preferences, strategyType) {
    const fullPreferences = {
      ...preferences,
      optimizationGoal: strategyType,
    };

    return await this.generateRecommendation(userId, fullPreferences);
  }

  /**
   * Compare multiple strategies
   * @param {string} userId - User ID
   * @param {Object} preferences - User preferences
   * @returns {Object} Comparison of all strategies
   */
  async compareStrategies(userId, preferences) {
    const strategies = ['budget', 'activity', 'comfort', 'time'];
    
    const comparisons = await Promise.all(
      strategies.map(strategy => 
        this.getRecommendationWithStrategy(userId, preferences, strategy)
      )
    );

    return {
      strategies: strategies,
      recommendations: comparisons.map((rec, idx) => ({
        strategy: strategies[idx],
        summary: rec.summary,
        cost: rec.itinerary?.estimatedCost || 0,
        destinationCount: rec.itinerary?.destinations?.length || 0,
      })),
    };
  }

  /**
   * Save itinerary to database
   * @param {Object} itinerary - Itinerary to save
   * @returns {Object} Saved itinerary with ID
   */
  async saveItinerary(itineraryData) {
    console.log('💾 Saving itinerary to database...');
    
    try {
      // Ensure dates are valid
      const startDate = itineraryData.startDate ? new Date(itineraryData.startDate) : new Date();
      const endDate = itineraryData.endDate ? new Date(itineraryData.endDate) : new Date(startDate.getTime() + (itineraryData.duration || 3) * 24 * 60 * 60 * 1000);
      
      // Extract budget and ensure it's a number
      const budgetValue = Number(itineraryData.budget) || Number(itineraryData.preferences?.budget) || itineraryData.estimatedCost || 0;
      console.log('✅ Final budget to save:', budgetValue);
      
      // Convert recommendation itinerary format to Itinerary model format
      const itineraryDoc = new Itinerary({
        title: itineraryData.title || 'Smart Recommendation Itinerary',
        description: itineraryData.description || `Generated using ${itineraryData.strategy || itineraryData.preferences?.optimizationGoal || 'smart'} optimization strategy`,
        destination: itineraryData.destination || itineraryData.region || (Array.isArray(itineraryData.destinations) && itineraryData.destinations[0]?.name) || '',
        ownerId: new mongoose.Types.ObjectId(itineraryData.userId),
        createdByRole: 'user',
        source: 'smart-recommendation',
        startDate: startDate,
        endDate: endDate,
        isPublic: false,
        status: 'planning',
        
        // Convert destinations to days with stops
        days: this.convertToDaysFormat(itineraryData),
        
        // Budget information - use the extracted budget value
        budget: {
          total: budgetValue,
          currency: 'USD',
          expenses: []
        },
        
        // Add tags based on strategy and preferences
        tags: this.generateTags(itineraryData),
        
        completeness: 75, // Auto-generated itineraries are 75% complete
      });
      
      // Save to database
      const savedItinerary = await itineraryDoc.save();
      console.log('✅ Itinerary saved successfully:', savedItinerary._id);
      
      return savedItinerary;
    } catch (error) {
      console.error('❌ Error saving itinerary:', error);
      throw new Error(`Failed to save itinerary: ${error.message}`);
    }
  }

  /**
   * Convert recommendation destinations to Itinerary days format
   * @param {Object} itineraryData - Recommendation itinerary
   * @returns {Array} Days array for Itinerary model
   */
  convertToDaysFormat(itineraryData) {
    const days = [];
    const { destinations, accommodations, transportation, dailyPlans } = itineraryData;
    
    // If dailyPlans exist, use them
    if (dailyPlans && dailyPlans.length > 0) {
      return dailyPlans.map((plan, index) => ({
        dayNumber: index + 1,
        date: this.addDays(new Date(itineraryData.startDate), index),
        title: plan.title || `Day ${index + 1}`,
        description: plan.description || '',
        stops: plan.locations?.map((loc, stopIndex) => ({
          timeOfDay: loc.timeOfDay || loc.time_of_day || plan.timeOfDay || '',
          locationId: loc._id || loc.locationId,
          hotelId: plan.hotel?._id || plan.hotel?.hotelId,
          transportId: plan.transport?._id || plan.transport?.transportId,
          customName: loc.name,
          order: stopIndex,
          estimatedCost: loc.entryFee?.amount || 0,
        })) || []
      }));
    }

    // If destinations include guide-authored outlines, prefer them to build day plans
    const hasAnyOutline = Array.isArray(destinations)
      && destinations.some((d) => Array.isArray(d?.dayByDayOutline) && d.dayByDayOutline.length > 0);

    if (hasAnyOutline) {
      const duration = itineraryData.duration || 3;
      const byDay = new Map();

      const timeSlots = ['Morning', 'Afternoon', 'Evening', 'Night'];
      const getTimeOfDay = (idx) => timeSlots[Math.min(idx, timeSlots.length - 1)];

      // Build up stops per dayNumber from outlines
      for (const dest of destinations) {
        const outline = Array.isArray(dest?.dayByDayOutline) ? dest.dayByDayOutline : [];
        if (outline.length === 0) continue;

        for (const dayEntry of outline) {
          const dayNumberRaw = dayEntry?.dayNumber ?? dayEntry?.day_number;
          const dayNumber = Number.parseInt(dayNumberRaw, 10);
          if (!Number.isFinite(dayNumber) || dayNumber <= 0) continue;
          if (dayNumber > duration) continue;

          const key = dayNumber;
          const current = byDay.get(key) || { titleParts: [], stops: [] };
          if (dest?.name) current.titleParts.push(dest.name);

          const highlights = Array.isArray(dayEntry?.highlights) ? dayEntry.highlights : [];
          highlights.forEach((h, idx) => {
            const highlightText = typeof h === 'string' ? h.trim() : '';
            if (!highlightText) return;
            current.stops.push({
              timeOfDay: getTimeOfDay(idx),
              locationId: dest._id || dest.locationId,
              customName: highlightText,
              customDescription: dayEntry?.title ? `${dest.name}: ${dayEntry.title}` : dest.description,
              order: current.stops.length,
              estimatedCost: dest.entryFee?.amount || 0,
            });
          });

          // If no highlights provided, still add a stop for the destination for that day
          if (highlights.length === 0) {
            current.stops.push({
              timeOfDay: 'Morning',
              locationId: dest._id || dest.locationId,
              customName: dest.name,
              customDescription: dayEntry?.title || dest.description,
              order: current.stops.length,
              estimatedCost: dest.entryFee?.amount || 0,
            });
          }

          byDay.set(key, current);
        }
      }

      for (let dayIndex = 0; dayIndex < duration; dayIndex++) {
        const dayNumber = dayIndex + 1;
        const bucket = byDay.get(dayNumber);

        const stops = bucket?.stops ? [...bucket.stops] : [];

        // Add accommodation for the day if available
        if (accommodations && accommodations[dayIndex]) {
          stops.push({
            timeOfDay: 'Night',
            hotelId: accommodations[dayIndex]._id || accommodations[dayIndex].hotelId,
            customName: accommodations[dayIndex].name,
            order: stops.length,
            estimatedCost: accommodations[dayIndex].priceRange?.min || 0,
          });
        }

        // Ensure 2-4 activities per day minimum
        while (stops.length < 2) {
          stops.push({
            timeOfDay: stops.length === 0 ? 'Morning' : 'Evening',
            customName: 'Free exploration',
            customDescription: 'Explore nearby spots and local food options.',
            order: stops.length,
            estimatedCost: 0,
          });
        }
        if (stops.length > 4) {
          stops.splice(4);
        }
        stops.forEach((s, i) => { s.order = i; });

        const title = bucket?.titleParts?.length
          ? `Day ${dayNumber} — ${[...new Set(bucket.titleParts)].slice(0, 2).join(', ')}`
          : `Day ${dayNumber}`;

        days.push({
          dayNumber,
          date: this.addDays(new Date(itineraryData.startDate), dayIndex),
          title,
          description: bucket?.titleParts?.length
            ? `Guide plan highlights for ${[...new Set(bucket.titleParts)].join(', ')}`
            : 'Planned day',
          stops,
        });
      }

      return days;
    }
    
    // Otherwise, distribute destinations across days
    const duration = itineraryData.duration || 3;
    const destinationsPerDay = Math.ceil(destinations.length / duration);
    
    for (let dayIndex = 0; dayIndex < duration; dayIndex++) {
      const dayDestinations = destinations.slice(
        dayIndex * destinationsPerDay,
        (dayIndex + 1) * destinationsPerDay
      );
      
      const stops = dayDestinations.map((dest, stopIndex) => ({
        timeOfDay: stopIndex === 0 ? 'Morning' : stopIndex === 1 ? 'Afternoon' : 'Evening',
        locationId: dest._id || dest.locationId,
        customName: dest.name,
        customDescription: dest.description,
        customCoordinates: dest.coordinates,
        order: stopIndex,
        estimatedCost: dest.entryFee?.amount || 0,
      }));
      
      // Add accommodation for the day
      if (accommodations && accommodations[dayIndex]) {
        stops.push({
          timeOfDay: 'Night',
          hotelId: accommodations[dayIndex]._id || accommodations[dayIndex].hotelId,
          customName: accommodations[dayIndex].name,
          order: stops.length,
          estimatedCost: accommodations[dayIndex].priceRange?.min || 0,
        });
      }

      // Ensure 2-4 activities per day minimum (basic placeholders if needed)
      while (stops.length < 2) {
        stops.push({
          timeOfDay: stops.length === 0 ? 'Morning' : 'Evening',
          customName: 'Free exploration',
          customDescription: 'Explore nearby spots and local food options.',
          order: stops.length,
          estimatedCost: 0,
        });
      }
      if (stops.length > 4) {
        stops.splice(4);
        stops.forEach((s, i) => { s.order = i; });
      }
      
      days.push({
        dayNumber: dayIndex + 1,
        date: this.addDays(new Date(itineraryData.startDate), dayIndex),
        title: `Day ${dayIndex + 1}`,
        description: `Exploring ${dayDestinations.map(d => d.name).join(', ')}`,
        stops: stops,
      });
    }
    
    return days;
  }

  /**
   * Generate tags based on itinerary data
   * @param {Object} itineraryData - Recommendation itinerary
   * @returns {Array} Tags array
   */
  generateTags(itineraryData) {
    const tags = ['ai-generated', 'smart-recommendation'];
    
    if (itineraryData.strategy) {
      tags.push(`${itineraryData.strategy}-optimized`);
    }
    
    if (itineraryData.preferences?.interests) {
      tags.push(...itineraryData.preferences.interests);
    }
    
    if (itineraryData.preferences?.enhancements) {
      tags.push(...itineraryData.preferences.enhancements);
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Add days to a date
   * @param {Date} date - Starting date
   * @param {number} days - Days to add
   * @returns {Date} New date
   */
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Get itinerary by ID
   * @param {string} itineraryId - Itinerary ID
   * @returns {Object} Itinerary
   */
  async getItinerary(itineraryId) {
    console.log('📖 Fetching itinerary:', itineraryId);

    const itinerary = await Itinerary.findById(itineraryId);
    if (!itinerary) {
      return null;
    }

    return itinerary;
  }

  /**
   * Update existing itinerary
   * @param {string} itineraryId - Itinerary ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated itinerary
   */
  async updateItinerary(itineraryId, updates) {
    console.log('✏️ Updating itinerary:', itineraryId);

    const updatePayload = updates && typeof updates === 'object' ? { ...updates } : {};
    // Do not allow owner change via update
    delete updatePayload.ownerId;
    delete updatePayload.userId;

    const updated = await Itinerary.findByIdAndUpdate(
      itineraryId,
      { ...updatePayload, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return null;
    }

    return updated;
  }

  /**
   * Delete itinerary
   * @param {string} itineraryId - Itinerary ID
   * @returns {boolean} Success status
   */
  async deleteItinerary(itineraryId) {
    console.log('🗑️ Deleting itinerary:', itineraryId);

    const deleted = await Itinerary.findByIdAndDelete(itineraryId);
    return Boolean(deleted);
  }

  /**
   * Generate tags based on itinerary data
   * @param {Object} itineraryData - Recommendation itinerary
   * @returns {Array} Tags array
   */
  generateTags(itineraryData) {
    const tags = ['ai-generated', 'smart-recommendation'];
    
    if (itineraryData.strategy) {
      tags.push(`${itineraryData.strategy}-optimized`);
    }
    
    if (itineraryData.preferences?.interests) {
      tags.push(...itineraryData.preferences.interests);
    }
    
    if (itineraryData.preferences?.enhancements) {
      tags.push(...itineraryData.preferences.enhancements);
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Add days to a date
   * @param {Date} date - Starting date
   * @param {number} days - Days to add
   * @returns {Date} New date
   */
  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}

/**
 * Export singleton instance
 */
export const recommendationFacade = new RecommendationFacade();
