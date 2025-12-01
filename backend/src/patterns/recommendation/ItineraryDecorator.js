/**
 * Decorator Pattern - Itinerary Decorators
 * Dynamically adds features and enhancements to base itineraries
 * 
 * Benefits:
 * - Open/Closed: New decorators can be added without modifying existing code
 * - Single Responsibility: Each decorator handles one type of enhancement
 * - Flexibility: Decorators can be combined in any order
 * - Liskov Substitution: Decorated itineraries can replace base itineraries
 */

/**
 * Component Interface - Base Itinerary
 */
export class ItineraryComponent {
  getDescription() {
    throw new Error('Method must be implemented');
  }

  getCost() {
    throw new Error('Method must be implemented');
  }

  getFeatures() {
    throw new Error('Method must be implemented');
  }

  getData() {
    throw new Error('Method must be implemented');
  }
}

/**
 * Concrete Component - Base Itinerary Implementation
 */
export class BaseItinerary extends ItineraryComponent {
  constructor(itinerary) {
    super();
    this.itinerary = itinerary;
  }

  getDescription() {
    return this.itinerary.description || 'Standard itinerary';
  }

  getCost() {
    return this.itinerary.estimatedCost || 0;
  }

  getFeatures() {
    return ['Standard destinations', 'Basic accommodations', 'Standard transport'];
  }

  getData() {
    return this.itinerary;
  }
}

/**
 * Abstract Decorator - Base class for all decorators
 */
export class ItineraryDecorator extends ItineraryComponent {
  constructor(itinerary) {
    super();
    this.wrappedItinerary = itinerary;
  }

  getDescription() {
    return this.wrappedItinerary.getDescription();
  }

  getCost() {
    return this.wrappedItinerary.getCost();
  }

  getFeatures() {
    return this.wrappedItinerary.getFeatures();
  }

  getData() {
    return this.wrappedItinerary.getData();
  }
}

/**
 * Concrete Decorator - Luxury Enhancement
 * Adds premium hotels, private transport, VIP guides
 */
export class LuxuryDecorator extends ItineraryDecorator {
  getDescription() {
    return `${super.getDescription()} + Luxury Experience`;
  }

  getCost() {
    // Luxury adds 100% to base cost
    return super.getCost() * 2;
  }

  getFeatures() {
    return [
      ...super.getFeatures(),
      '5-star luxury hotels',
      'Private chauffeur service',
      'VIP tour guides',
      'Exclusive dining experiences',
      'Premium airport lounge access',
      'Concierge service 24/7',
    ];
  }

  getData() {
    const data = super.getData();
    
    return {
      ...data,
      enhancements: [...(data.enhancements || []), 'luxury'],
      accommodations: this.upgradeTo5Star(data.accommodations),
      transportation: this.upgradeToPrivate(data.transportation),
      activities: [
        ...data.activities,
        ...this.addLuxuryExperiences(),
      ],
      estimatedCost: this.getCost(),
    };
  }

  upgradeTo5Star(accommodations) {
    return accommodations.map(acc => ({
      ...acc,
      starRating: 5,
      amenities: [
        ...(acc.amenities || []),
        'Spa',
        'Fine Dining',
        'Butler Service',
        'Premium Suite',
      ],
      pricePerNight: (acc.pricePerNight || 100) * 3,
      totalCost: (acc.pricePerNight || 100) * 3 * acc.nights,
    }));
  }

  upgradeToPrivate(transportation) {
    return transportation.map(t => ({
      ...t,
      class: 'private',
      type: t.type === 'flight' ? 'private-jet' : 'luxury-car',
      price: (t.price || 50) * 4,
      amenities: ['Private', 'Premium Comfort', 'Refreshments'],
    }));
  }

  addLuxuryExperiences() {
    return [
      {
        activityId: `luxury_${Date.now()}_1`,
        name: 'Private Chef Dining Experience',
        description: 'Exclusive meal prepared by renowned local chef',
        category: 'Dining',
        duration: 3,
        cost: 500,
      },
      {
        activityId: `luxury_${Date.now()}_2`,
        name: 'VIP Cultural Tour',
        description: 'Private guided tour with cultural expert',
        category: 'Cultural',
        duration: 4,
        cost: 300,
      },
    ];
  }
}

/**
 * Concrete Decorator - Adventure Enhancement
 * Adds adventure activities and specialized equipment
 */
export class AdventureDecorator extends ItineraryDecorator {
  getDescription() {
    return `${super.getDescription()} + Adventure Activities`;
  }

  getCost() {
    // Adventure adds 40% to base cost
    return super.getCost() * 1.4;
  }

  getFeatures() {
    return [
      ...super.getFeatures(),
      'Adventure activities',
      'Professional guides',
      'Safety equipment included',
      'Adventure insurance',
      'Photography services',
    ];
  }

  getData() {
    const data = super.getData();
    
    return {
      ...data,
      enhancements: [...(data.enhancements || []), 'adventure'],
      activities: [
        ...data.activities,
        ...this.addAdventureActivities(),
      ],
      accommodations: this.updateToAdventureFriendly(data.accommodations),
      estimatedCost: this.getCost(),
    };
  }

  addAdventureActivities() {
    return [
      {
        activityId: `adventure_${Date.now()}_1`,
        name: 'Hiking & Trekking',
        description: 'Guided hiking tour through scenic trails',
        category: 'Adventure',
        duration: 6,
        cost: 150,
        equipment: ['Hiking boots', 'Safety gear', 'Trail map'],
      },
      {
        activityId: `adventure_${Date.now()}_2`,
        name: 'Water Sports Package',
        description: 'Surfing, kayaking, and snorkeling activities',
        category: 'Adventure',
        duration: 4,
        cost: 200,
        equipment: ['Wetsuit', 'Snorkel gear', 'Life jacket'],
      },
      {
        activityId: `adventure_${Date.now()}_3`,
        name: 'Rock Climbing Experience',
        description: 'Guided rock climbing with certified instructors',
        category: 'Adventure',
        duration: 5,
        cost: 180,
        equipment: ['Climbing gear', 'Helmet', 'Safety harness'],
      },
    ];
  }

  updateToAdventureFriendly(accommodations) {
    return accommodations.map(acc => ({
      ...acc,
      amenities: [
        ...(acc.amenities || []),
        'Gear Storage',
        'Early Breakfast',
        'Drying Room',
      ],
    }));
  }
}

/**
 * Concrete Decorator - Cultural Enhancement
 * Adds cultural experiences, museums, heritage sites
 */
export class CulturalDecorator extends ItineraryDecorator {
  getDescription() {
    return `${super.getDescription()} + Cultural Immersion`;
  }

  getCost() {
    // Cultural adds 30% to base cost
    return super.getCost() * 1.3;
  }

  getFeatures() {
    return [
      ...super.getFeatures(),
      'Museum and heritage site passes',
      'Cultural expert guides',
      'Traditional performances',
      'Local artisan workshops',
      'Cultural dining experiences',
    ];
  }

  getData() {
    const data = super.getData();
    
    return {
      ...data,
      enhancements: [...(data.enhancements || []), 'cultural'],
      activities: [
        ...data.activities,
        ...this.addCulturalExperiences(),
      ],
      destinations: this.prioritizeCulturalSites(data.destinations),
      estimatedCost: this.getCost(),
    };
  }

  addCulturalExperiences() {
    return [
      {
        activityId: `cultural_${Date.now()}_1`,
        name: 'Museum Tour Package',
        description: 'Guided tours of major museums and galleries',
        category: 'Cultural',
        duration: 4,
        cost: 100,
      },
      {
        activityId: `cultural_${Date.now()}_2`,
        name: 'Traditional Cooking Class',
        description: 'Learn to cook authentic local dishes',
        category: 'Cultural',
        duration: 3,
        cost: 80,
      },
      {
        activityId: `cultural_${Date.now()}_3`,
        name: 'Heritage Walking Tour',
        description: 'Explore historical landmarks with expert guide',
        category: 'Cultural',
        duration: 3,
        cost: 60,
      },
      {
        activityId: `cultural_${Date.now()}_4`,
        name: 'Traditional Performance',
        description: 'Evening cultural show with local artists',
        category: 'Cultural',
        duration: 2,
        cost: 50,
      },
    ];
  }

  prioritizeCulturalSites(destinations) {
    return destinations.map(dest => {
      const culturalCategories = ['historical', 'cultural', 'museum', 'heritage'];
      
      // Handle category as string (schema) or array
      const categoryValue = dest.category || dest.categories || '';
      const categoryArray = Array.isArray(categoryValue) ? categoryValue : [categoryValue];
      
      const isCultural = categoryArray.some(cat => 
        culturalCategories.some(cc => cat.toLowerCase().includes(cc))
      );
      
      return {
        ...dest,
        priority: isCultural ? (dest.priority || 0) + 10 : dest.priority,
        culturalHighlight: isCultural,
      };
    }).sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
}

/**
 * Concrete Decorator - Family-Friendly Enhancement
 * Adds kid-friendly activities and facilities
 */
export class FamilyFriendlyDecorator extends ItineraryDecorator {
  getDescription() {
    return `${super.getDescription()} + Family-Friendly Features`;
  }

  getCost() {
    // Family-friendly adds 25% to base cost
    return super.getCost() * 1.25;
  }

  getFeatures() {
    return [
      ...super.getFeatures(),
      'Kid-friendly accommodations',
      'Child care services',
      'Family-oriented activities',
      'Child meal plans',
      'Stroller and equipment rental',
    ];
  }

  getData() {
    const data = super.getData();
    
    return {
      ...data,
      enhancements: [...(data.enhancements || []), 'family-friendly'],
      activities: [
        ...data.activities,
        ...this.addFamilyActivities(),
      ],
      accommodations: this.updateToFamilyFriendly(data.accommodations),
      estimatedCost: this.getCost(),
    };
  }

  addFamilyActivities() {
    return [
      {
        activityId: `family_${Date.now()}_1`,
        name: 'Theme Park Visit',
        description: 'Fun-filled day at family theme park',
        category: 'Family',
        duration: 6,
        cost: 200,
        ageRange: 'All ages',
      },
      {
        activityId: `family_${Date.now()}_2`,
        name: 'Interactive Science Museum',
        description: 'Hands-on learning experience for kids',
        category: 'Educational',
        duration: 3,
        cost: 75,
        ageRange: '5-15 years',
      },
      {
        activityId: `family_${Date.now()}_3`,
        name: 'Beach Day with Kids Activities',
        description: 'Safe beach fun with supervised activities',
        category: 'Recreation',
        duration: 4,
        cost: 50,
        ageRange: 'All ages',
      },
    ];
  }

  updateToFamilyFriendly(accommodations) {
    return accommodations.map(acc => ({
      ...acc,
      amenities: [
        ...(acc.amenities || []),
        'Kids Club',
        'Family Rooms',
        'Play Area',
        'Baby Sitting Services',
        'Child-Friendly Dining',
      ],
      pricePerNight: (acc.pricePerNight || 100) * 1.2,
      totalCost: (acc.pricePerNight || 100) * 1.2 * acc.nights,
    }));
  }
}

/**
 * Concrete Decorator - Eco-Friendly Enhancement
 * Focuses on sustainable and eco-conscious travel
 */
export class EcoFriendlyDecorator extends ItineraryDecorator {
  getDescription() {
    return `${super.getDescription()} + Eco-Friendly & Sustainable`;
  }

  getCost() {
    // Eco-friendly adds 20% to base cost (sustainable options often cost more)
    return super.getCost() * 1.2;
  }

  getFeatures() {
    return [
      ...super.getFeatures(),
      'Eco-certified accommodations',
      'Carbon-neutral transport',
      'Sustainable tour operators',
      'Local community engagement',
      'Environmental conservation activities',
    ];
  }

  getData() {
    const data = super.getData();
    
    return {
      ...data,
      enhancements: [...(data.enhancements || []), 'eco-friendly'],
      activities: [
        ...data.activities,
        ...this.addEcoActivities(),
      ],
      accommodations: this.updateToEcoCertified(data.accommodations),
      transportation: this.updateToEcoTransport(data.transportation),
      carbonOffset: this.calculateCarbonOffset(data),
      estimatedCost: this.getCost(),
    };
  }

  addEcoActivities() {
    return [
      {
        activityId: `eco_${Date.now()}_1`,
        name: 'Nature Conservation Project',
        description: 'Participate in local reforestation efforts',
        category: 'Eco-Tourism',
        duration: 4,
        cost: 50,
      },
      {
        activityId: `eco_${Date.now()}_2`,
        name: 'Wildlife Sanctuary Visit',
        description: 'Eco-friendly wildlife observation tour',
        category: 'Nature',
        duration: 5,
        cost: 80,
      },
      {
        activityId: `eco_${Date.now()}_3`,
        name: 'Organic Farm Experience',
        description: 'Visit local organic farm and learn sustainable practices',
        category: 'Eco-Tourism',
        duration: 3,
        cost: 60,
      },
    ];
  }

  updateToEcoCertified(accommodations) {
    return accommodations.map(acc => ({
      ...acc,
      ecoFriendly: true,
      amenities: [
        ...(acc.amenities || []),
        'Solar Power',
        'Water Conservation',
        'Organic Meals',
        'Zero Waste Policy',
      ],
    }));
  }

  updateToEcoTransport(transportation) {
    return transportation.map(t => ({
      ...t,
      carbonNeutral: true,
      carbonOffset: this.calculateTransportOffset(t),
    }));
  }

  calculateTransportOffset(transport) {
    // Simple calculation: distance * emission factor
    const emissionFactor = transport.type === 'flight' ? 0.25 : 0.1; // kg CO2 per km
    const distance = transport.distance || 100;
    return (distance * emissionFactor).toFixed(2);
  }

  calculateCarbonOffset(data) {
    const transportOffset = data.transportation.reduce((sum, t) => {
      const emissionFactor = t.type === 'flight' ? 0.25 : 0.1;
      const distance = t.distance || 100;
      return sum + (distance * emissionFactor);
    }, 0);

    return {
      totalCO2: transportOffset.toFixed(2),
      offsetCost: (transportOffset * 0.02).toFixed(2), // $0.02 per kg CO2
    };
  }
}

/**
 * Decorator Factory - Creates and combines decorators
 */
export class DecoratorFactory {
  static enhance(itinerary, enhancements = []) {
    let enhancedItinerary = new BaseItinerary(itinerary);

    const decorators = {
      'luxury': LuxuryDecorator,
      'adventure': AdventureDecorator,
      'cultural': CulturalDecorator,
      'family-friendly': FamilyFriendlyDecorator,
      'eco-friendly': EcoFriendlyDecorator,
    };

    enhancements.forEach(enhancement => {
      const DecoratorClass = decorators[enhancement.toLowerCase()];
      if (DecoratorClass) {
        enhancedItinerary = new DecoratorClass(enhancedItinerary);
      }
    });

    return enhancedItinerary;
  }
}
