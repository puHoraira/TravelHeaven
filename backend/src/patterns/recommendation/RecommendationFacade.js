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

      // Step 2: Build and execute filter chain
      const filteredOptions = await this.applyFilters(availableOptions, preferences);
      console.log(`✅ Filtered to ${filteredOptions.options.locations.length} locations, ${filteredOptions.options.hotels.length} hotels, ${filteredOptions.options.transport.length} transport options`);

      // Step 3: Apply recommendation strategy
      const recommendations = await this.applyStrategy(filteredOptions, preferences);
      console.log(`✅ Strategy applied: ${recommendations.strategy}`);

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

    // Build query filters
    const locationFilter = {};
    const hotelFilter = {};
    const transportFilter = {};

    if (destination) {
      locationFilter.city = destination;
      hotelFilter.city = destination;
      transportFilter.$or = [
        { origin: destination },
        { destination: destination },
      ];
    }

    if (region) {
      locationFilter.region = region;
      hotelFilter.region = region;
    }

    // Fetch from repositories (with pagination)
    const [locationsResult, hotelsResult, transportResult] = await Promise.all([
      this.locationRepo.findAll(locationFilter, { limit: 100, page: 1 }),
      this.hotelRepo.findAll(hotelFilter, { limit: 50, page: 1 }),
      this.transportRepo.findAll(transportFilter, { limit: 30, page: 1 }),
    ]);

    console.log('DEBUG - First location from repo:', locationsResult.data?.[0]);

    return {
      locations: locationsResult.data || [],
      hotels: hotelsResult.data || [],
      transport: transportResult.data || [],
    };
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
    console.log('📦 Received itineraryData.budget:', itineraryData.budget);
    console.log('📦 Received itineraryData.preferences?.budget:', itineraryData.preferences?.budget);
    console.log('Dates:', itineraryData.startDate, 'to', itineraryData.endDate);
    console.log('Selected locations:', itineraryData.destinations?.length);
    
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
        ownerId: new mongoose.Types.ObjectId(itineraryData.userId),
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
      console.log('✅ Itinerary saved with ID:', savedItinerary._id);
      console.log('✅ Budget saved in DB:', savedItinerary.budget.total);
      console.log('✅ Dates saved:', savedItinerary.startDate, 'to', savedItinerary.endDate);
      
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
          locationId: loc._id || loc.locationId,
          hotelId: plan.hotel?._id || plan.hotel?.hotelId,
          transportId: plan.transport?._id || plan.transport?.transportId,
          customName: loc.name,
          order: stopIndex,
          estimatedCost: loc.entryFee?.amount || 0,
        })) || []
      }));
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
          hotelId: accommodations[dayIndex]._id || accommodations[dayIndex].hotelId,
          customName: accommodations[dayIndex].name,
          order: stops.length,
          estimatedCost: accommodations[dayIndex].priceRange?.min || 0,
        });
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
    // In a real implementation, this would fetch from database
    console.log('📖 Fetching itinerary:', itineraryId);
    
    // Mock implementation
    throw new Error('Not implemented - would fetch from database');
  }

  /**
   * Update existing itinerary
   * @param {string} itineraryId - Itinerary ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated itinerary
   */
  async updateItinerary(itineraryId, updates) {
    console.log('✏️ Updating itinerary:', itineraryId);
    
    // In a real implementation, this would update in database
    throw new Error('Not implemented - would update in database');
  }

  /**
   * Delete itinerary
   * @param {string} itineraryId - Itinerary ID
   * @returns {boolean} Success status
   */
  async deleteItinerary(itineraryId) {
    console.log('🗑️ Deleting itinerary:', itineraryId);
    
    // In a real implementation, this would delete from database
    throw new Error('Not implemented - would delete from database');
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
          locationId: loc._id || loc.locationId,
          hotelId: plan.hotel?._id || plan.hotel?.hotelId,
          transportId: plan.transport?._id || plan.transport?.transportId,
          customName: loc.name,
          order: stopIndex,
          estimatedCost: loc.entryFee?.amount || 0,
        })) || []
      }));
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
          hotelId: accommodations[dayIndex]._id || accommodations[dayIndex].hotelId,
          customName: accommodations[dayIndex].name,
          order: stops.length,
          estimatedCost: accommodations[dayIndex].priceRange?.min || 0,
        });
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
}

/**
 * Export singleton instance
 */
export const recommendationFacade = new RecommendationFacade();
