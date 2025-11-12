import { Transport } from '../models/Transport.js';

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Find direct routes between two locations
 */
export async function findDirectRoutes(fromLat, fromLng, toLat, toLng, options = {}) {
  const {
    maxDistance = 5, // Max distance from origin/destination in km
    transportType = null,
    limit = 20,
  } = options;

  try {
    console.log('🔍 findDirectRoutes called with:', {
      fromLat, fromLng, toLat, toLng, maxDistance, transportType
    });

    const transports = await Transport.find({
      approvalStatus: 'approved',
      ...(transportType && { type: transportType }),
      'route.from.location.coordinates': { $exists: true },
      'route.to.location.coordinates': { $exists: true },
    })
      .populate('locationId', 'name address')
      .populate('guideId', 'name email phone')
      .lean();

    console.log(`📦 Found ${transports.length} approved transports with coordinates`);

    const matchedRoutes = transports
      .map(transport => {
        const [fromLon, fromLat_t] = transport.route.from.location.coordinates;
        const [toLon, toLat_t] = transport.route.to.location.coordinates;

        const distanceFromOrigin = calculateDistance(fromLat, fromLng, fromLat_t, fromLon);
        const distanceFromDestination = calculateDistance(toLat, toLng, toLat_t, toLon);
        const matchScore = distanceFromOrigin + distanceFromDestination;

        const matched = {
          ...transport,
          distanceFromOrigin: parseFloat(distanceFromOrigin.toFixed(2)),
          distanceFromDestination: parseFloat(distanceFromDestination.toFixed(2)),
          matchScore: parseFloat(matchScore.toFixed(2)),
          matchType: 'direct',
        };

        console.log(`🚌 Transport ${transport.type} (${transport.route.from.name} → ${transport.route.to.name}):`, {
          distanceFromOrigin: matched.distanceFromOrigin,
          distanceFromDestination: matched.distanceFromDestination,
          withinThreshold: matched.distanceFromOrigin <= maxDistance && matched.distanceFromDestination <= maxDistance,
          maxDistance
        });

        return matched;
      })
      .filter(t => t.distanceFromOrigin <= maxDistance && t.distanceFromDestination <= maxDistance)
      .sort((a, b) => a.matchScore - b.matchScore)
      .slice(0, limit);

    console.log(`✅ Matched ${matchedRoutes.length} direct routes`);
    return matchedRoutes;
  } catch (error) {
    console.error('Error finding direct routes:', error);
    throw error;
  }
}

/**
 * Find routes with nearby stops
 */
export async function findRoutesWithNearbyStops(fromLat, fromLng, toLat, toLng, options = {}) {
  const {
    maxDistance = 10,
    transportType = null,
    limit = 20,
  } = options;

  try {
    const transports = await Transport.find({
      approvalStatus: 'approved',
      ...(transportType && { type: transportType }),
      'route.stops': { $exists: true, $not: { $size: 0 } },
    })
      .populate('locationId', 'name address')
      .populate('guideId', 'name email phone')
      .lean();

    const matchedRoutes = [];

    for (const transport of transports) {
      let nearestOriginStop = null;
      let nearestDestinationStop = null;
      let minOriginDistance = Infinity;
      let minDestinationDistance = Infinity;

      // Check main origin and destination
      if (transport.route.from?.location?.coordinates) {
        const [fromLon, fromLat_t] = transport.route.from.location.coordinates;
        const dist = calculateDistance(fromLat, fromLng, fromLat_t, fromLon);
        if (dist < minOriginDistance) {
          minOriginDistance = dist;
          nearestOriginStop = {
            ...transport.route.from,
            type: 'origin',
            stopOrder: 0,
          };
        }
      }

      if (transport.route.to?.location?.coordinates) {
        const [toLon, toLat_t] = transport.route.to.location.coordinates;
        const dist = calculateDistance(toLat, toLng, toLat_t, toLon);
        if (dist < minDestinationDistance) {
          minDestinationDistance = dist;
          nearestDestinationStop = {
            ...transport.route.to,
            type: 'destination',
            stopOrder: transport.route.stops.length + 1,
          };
        }
      }

      // Check all stops
      transport.route.stops.forEach((stop, index) => {
        if (stop.location?.coordinates) {
          const [stopLon, stopLat] = stop.location.coordinates;

          const distFromOrigin = calculateDistance(fromLat, fromLng, stopLat, stopLon);
          if (distFromOrigin < minOriginDistance) {
            minOriginDistance = distFromOrigin;
            nearestOriginStop = {
              ...stop,
              type: 'stop',
              stopOrder: index + 1,
            };
          }

          const distFromDest = calculateDistance(toLat, toLng, stopLat, stopLon);
          if (distFromDest < minDestinationDistance) {
            minDestinationDistance = distFromDest;
            nearestDestinationStop = {
              ...stop,
              type: 'stop',
              stopOrder: index + 1,
            };
          }
        }
      });

      // If both stops found within distance and origin before destination
      if (
        nearestOriginStop &&
        nearestDestinationStop &&
        minOriginDistance <= maxDistance &&
        minDestinationDistance <= maxDistance &&
        nearestOriginStop.stopOrder < nearestDestinationStop.stopOrder
      ) {
        matchedRoutes.push({
          ...transport,
          nearestOriginStop,
          nearestDestinationStop,
          distanceFromOrigin: parseFloat(minOriginDistance.toFixed(2)),
          distanceFromDestination: parseFloat(minDestinationDistance.toFixed(2)),
          matchScore: parseFloat((minOriginDistance + minDestinationDistance).toFixed(2)),
          matchType: 'nearby-stops',
          walkingRequired: true,
        });
      }
    }

    return matchedRoutes
      .sort((a, b) => a.matchScore - b.matchScore)
      .slice(0, limit);
  } catch (error) {
    console.error('Error finding routes with nearby stops:', error);
    throw error;
  }
}

/**
 * Find all transport options
 */
export async function findAllTransportOptions(fromLat, fromLng, toLat, toLng, options = {}) {
  try {
    const directRoutes = await findDirectRoutes(fromLat, fromLng, toLat, toLng, options);

    let nearbyRoutes = [];
    if (directRoutes.length === 0) {
      nearbyRoutes = await findRoutesWithNearbyStops(fromLat, fromLng, toLat, toLng, options);
    }

    return {
      directRoutes,
      nearbyRoutes,
      totalOptions: directRoutes.length + nearbyRoutes.length,
      hasDirectRoute: directRoutes.length > 0,
      recommendation: directRoutes.length > 0 
        ? 'Direct routes available' 
        : nearbyRoutes.length > 0 
          ? 'No direct routes, but alternatives with nearby stops available' 
          : 'No transport options found',
    };
  } catch (error) {
    console.error('Error finding transport options:', error);
    throw error;
  }
}

/**
 * Find transport by location names
 */
export async function findTransportByLocationNames(fromLocation, toLocation, options = {}) {
  try {
    const query = {
      approvalStatus: 'approved',
      $or: [
        {
          'route.from.name': new RegExp(fromLocation, 'i'),
          'route.to.name': new RegExp(toLocation, 'i'),
        },
      ],
    };

    if (options.transportType) {
      query.type = options.transportType;
    }

    const transports = await Transport.find(query)
      .populate('locationId', 'name address')
      .populate('guideId', 'name email phone')
      .sort({ averageRating: -1, bookingCount: -1 })
      .limit(options.limit || 20)
      .lean();

    return transports;
  } catch (error) {
    console.error('Error finding transport by location names:', error);
    throw error;
  }
}

/**
 * Get popular routes
 */
export async function getPopularRoutes(options = {}) {
  try {
    const { limit = 10, type = null } = options;

    const query = {
      approvalStatus: 'approved',
      ...(type && { type }),
    };

    const transports = await Transport.find(query)
      .populate('locationId', 'name address')
      .populate('guideId', 'name email phone')
      .sort({ bookingCount: -1, averageRating: -1, viewCount: -1 })
      .limit(limit)
      .lean();

    return transports;
  } catch (error) {
    console.error('Error getting popular routes:', error);
    throw error;
  }
}

/**
 * Search by operator
 */
export async function searchByOperator(operatorName, options = {}) {
  try {
    const query = {
      approvalStatus: 'approved',
      'operator.name': new RegExp(operatorName, 'i'),
    };

    if (options.type) {
      query.type = options.type;
    }

    const transports = await Transport.find(query)
      .populate('locationId', 'name address')
      .populate('guideId', 'name email phone')
      .sort({ averageRating: -1 })
      .limit(options.limit || 20)
      .lean();

    return transports;
  } catch (error) {
    console.error('Error searching by operator:', error);
    throw error;
  }
}
