import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

/**
 * Smart Itinerary Recommendation Component
 * Demonstrates the pattern-driven recommendation system
 */
const RecommendationWizard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');
  const [preferences, setPreferences] = useState({
    budget: 1000,
    duration: 3,
    startDate: '',
    endDate: '',
    interests: [],
    optimizationGoal: 'budget',
    enhancements: [],
    minRating: 3.5,
  });
  const [recommendation, setRecommendation] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [selectedLocations, setSelectedLocations] = useState([]);

  const interestOptions = [
    'cultural', 'historical', 'adventure', 'beach', 
    'relaxation', 'nature', 'shopping', 'nightlife'
  ];

  const enhancementOptions = [
    { value: 'luxury', label: 'Luxury', description: '5-star hotels, VIP experiences' },
    { value: 'adventure', label: 'Adventure', description: 'Hiking, water sports, climbing' },
    { value: 'cultural', label: 'Cultural', description: 'Museums, heritage sites, traditions' },
    { value: 'family-friendly', label: 'Family Friendly', description: 'Kid activities, child care' },
    { value: 'eco-friendly', label: 'Eco Friendly', description: 'Sustainable, carbon-neutral' },
  ];

  const strategyOptions = [
    { value: 'budget', label: 'Budget Optimized', description: 'Minimize costs, maximize value' },
    { value: 'activity', label: 'Activity Driven', description: 'Maximize experiences and variety' },
    { value: 'comfort', label: 'Comfort Prioritized', description: 'Balance comfort and quality' },
    { value: 'time', label: 'Time Efficient', description: 'Minimize travel time' },
  ];

  const handleInputChange = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field, value) => {
    setPreferences(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value],
    }));
  };

  const generateRecommendation = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await api.post('/recommendations/generate', preferences);

      console.log('Recommendation response:', data);

      if (!data?.success) {
        setErrorMsg(data?.message || 'Failed to generate recommendation.');
        return;
      }

      setRecommendation(data);
      setSelectedLocations([]); // Reset selected locations
      setStep(4);
    } catch (error) {
      console.error('Error generating recommendation:', error);
      const code = error?.code;
      const errorMessage = error?.message || 'Unknown error';
      if (code === 'NO_LOCATIONS') {
        setErrorMsg(errorMessage || 'No approved locations are available yet.');
      } else if (code === 'NO_MATCHING_LOCATIONS' || code === 'NO_DESTINATIONS') {
        setErrorMsg(errorMessage || 'No locations match your current preferences.');
      } else {
        setErrorMsg(`Failed to generate recommendation: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const compareStrategies = async () => {
    setLoading(true);
    try {
      const data = await api.post('/recommendations/compare', preferences);
      setComparison(data);
    } catch (error) {
      console.error('Error comparing strategies:', error);
      alert('Failed to compare strategies.');
    } finally {
      setLoading(false);
    }
  };

  const saveItinerary = async () => {
    if (!recommendation?.itinerary) return;
    
    // Validate that at least one location is selected
    if (selectedLocations.length === 0) {
      alert('Please select at least one location to save the itinerary!');
      return;
    }

    setLoading(true);
    try {
      // Create a meaningful title from selected location names
      const locationNames = selectedLocations.map(loc => loc.name).filter(Boolean);
      const itineraryTitle = locationNames.length > 0 
        ? locationNames.slice(0, 3).join(', ') + (locationNames.length > 3 ? ' & more' : ' Trip')
        : 'My Smart Itinerary';
      
      // Prepare itinerary data with selected locations only and preferences
      const itineraryToSave = {
        ...recommendation.itinerary,
        title: itineraryTitle, // Use selected location names as title
        destinations: selectedLocations, // Only save selected locations
        budget: preferences.budget, // Include budget from preferences
        startDate: preferences.startDate, // Include start date
        endDate: preferences.endDate, // Include end date
        duration: preferences.duration, // Include duration
        preferences: preferences, // Include all preferences
      };
      
      console.log('💾 Saving itinerary with budget:', preferences.budget);
      console.log('📦 Full itinerary data:', itineraryToSave);

      await api.post('/recommendations/save', itineraryToSave);
      alert('Itinerary saved successfully!');
      navigate('/itineraries');
    } catch (error) {
      console.error('Error saving itinerary:', error);
      alert('Failed to save itinerary.');
    } finally {
      setLoading(false);
    }
  };

  const toggleLocationSelection = (location) => {
    setSelectedLocations(prev => {
      // Use both _id and name to identify unique locations
      const locationId = location._id?.toString() || location.name;
      const isSelected = prev.some(loc => {
        const prevId = loc._id?.toString() || loc.name;
        return prevId === locationId;
      });
      
      if (isSelected) {
        return prev.filter(loc => {
          const prevId = loc._id?.toString() || loc.name;
          return prevId !== locationId;
        });
      } else {
        return [...prev, location];
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-center mb-8">
        🎯 Smart Itinerary Recommendation
      </h1>

      {errorMsg && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex justify-between mb-8">
        {['Preferences', 'Strategy', 'Enhancements', 'Result'].map((label, idx) => (
          <div
            key={idx}
            className={`flex-1 text-center pb-2 border-b-4 ${
              step > idx ? 'border-blue-500' : 'border-gray-300'
            }`}
          >
            <span className={step > idx ? 'text-blue-600 font-semibold' : 'text-gray-500'}>
              {idx + 1}. {label}
            </span>
          </div>
        ))}
      </div>

      {/* Step 1: Basic Preferences */}
      {step === 1 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Step 1: Your Preferences</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Budget ($)</label>
              <input
                type="number"
                value={preferences.budget}
                onChange={(e) => handleInputChange('budget', Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Duration (days)</label>
              <input
                type="number"
                value={preferences.duration}
                onChange={(e) => handleInputChange('duration', Number(e.target.value))}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={preferences.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={preferences.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Interests</label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map(interest => (
                <button
                  key={interest}
                  onClick={() => toggleArrayItem('interests', interest)}
                  className={`px-4 py-2 rounded ${
                    preferences.interests.includes(interest)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Next: Choose Strategy →
          </button>
        </div>
      )}

      {/* Step 2: Strategy Selection */}
      {step === 2 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Step 2: Optimization Strategy</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {strategyOptions.map(strategy => (
              <div
                key={strategy.value}
                onClick={() => handleInputChange('optimizationGoal', strategy.value)}
                className={`p-4 border-2 rounded cursor-pointer ${
                  preferences.optimizationGoal === strategy.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                <h3 className="font-semibold">{strategy.label}</h3>
                <p className="text-sm text-gray-600">{strategy.description}</p>
              </div>
            ))}
          </div>

          <button
            onClick={compareStrategies}
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600 mb-2"
          >
            {loading ? 'Comparing...' : '📊 Compare All Strategies'}
          </button>

          {comparison && (
            <div className="bg-gray-50 p-4 rounded mb-4">
              <h3 className="font-semibold mb-2">Strategy Comparison:</h3>
              {comparison.comparison.recommendations.map((rec, idx) => (
                <div key={idx} className="flex justify-between border-b py-2">
                  <span className="font-medium">{rec.strategy}</span>
                  <span>Cost: ${rec.cost}</span>
                  <span>Destinations: {rec.destinationCount}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Next: Add Enhancements →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Enhancements */}
      {step === 3 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-2xl font-semibold mb-4">Step 3: Enhance Your Trip (Optional)</h2>

          <div className="grid grid-cols-1 gap-4 mb-4">
            {enhancementOptions.map(enhancement => (
              <div
                key={enhancement.value}
                onClick={() => toggleArrayItem('enhancements', enhancement.value)}
                className={`p-4 border-2 rounded cursor-pointer ${
                  preferences.enhancements.includes(enhancement.value)
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{enhancement.label}</h3>
                    <p className="text-sm text-gray-600">{enhancement.description}</p>
                  </div>
                  {preferences.enhancements.includes(enhancement.value) && (
                    <span className="text-2xl">✓</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-gray-300 text-gray-700 py-2 rounded"
            >
              ← Back
            </button>
            <button
              onClick={generateRecommendation}
              disabled={loading}
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              {loading ? 'Generating...' : '✨ Generate Recommendation'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 4 && recommendation && (
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl shadow-xl">
          <div className="text-center mb-6">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
              🎉 Your Smart Itinerary
            </h2>
            <p className="text-gray-600">Optimized for {recommendation.summary?.strategyUsed || 'Best Experience'}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm font-medium">💰 Your Budget</span>
              </div>
              <p className="text-3xl font-bold text-green-600">${preferences.budget}</p>
              <p className="text-xs text-gray-500 mt-1">Estimated cost: ${recommendation.summary?.totalCost || 0}</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm font-medium">📍 Destinations</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">{recommendation.itinerary?.destinations?.length || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Locations available</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm font-medium">📅 Duration</span>
              </div>
              <p className="text-3xl font-bold text-purple-600">{preferences.duration} days</p>
              <p className="text-xs text-gray-500 mt-1">{preferences.startDate || 'Flexible dates'}</p>
            </div>
          </div>

          {/* Destinations */}
          {recommendation.itinerary?.destinations && recommendation.itinerary.destinations.length > 0 && (
            <div className="mb-6">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">📍 Select Destinations</h3>
                    <p className="text-sm text-gray-500 mt-1">Click to choose locations for your itinerary</p>
                  </div>
                  <div className="bg-blue-100 px-4 py-2 rounded-full">
                    <span className="text-blue-700 font-semibold">
                      {selectedLocations.length} / {recommendation.itinerary.destinations.length} selected
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {recommendation.itinerary.destinations.map((dest, idx) => {
                    const locationId = dest._id?.toString() || dest.name;
                    const isSelected = selectedLocations.some(loc => {
                      const prevId = loc._id?.toString() || loc.name;
                      return prevId === locationId;
                    });
                    
                    return (
                      <div 
                        key={`${locationId}-${idx}`}
                        onClick={() => toggleLocationSelection(dest)}
                        className={`p-4 rounded-lg cursor-pointer transition-all transform hover:scale-102 ${
                          isSelected 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                            : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-semibold ${
                                isSelected ? 'text-white' : 'text-gray-800'
                              }`}>
                                {dest.name || 'Unknown Location'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <span className={isSelected ? 'text-blue-100' : 'text-gray-600'}>
                                ⭐ {typeof dest.rating === 'object' ? dest.rating?.average || 'N/A' : dest.rating || 'N/A'}
                              </span>
                              {dest.category && (
                                <span className={`px-2 py-1 rounded text-xs ${
                                  isSelected ? 'bg-white bg-opacity-20' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {dest.category}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`flex-shrink-0 ml-3 w-8 h-8 rounded-full flex items-center justify-center ${
                            isSelected 
                              ? 'bg-white bg-opacity-30' 
                              : 'bg-gray-100'
                          }`}>
                            {isSelected ? (
                              <span className="text-white text-xl">✓</span>
                            ) : (
                              <span className="text-gray-400 text-xl">+</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Features */}
          {recommendation.summary?.features && recommendation.summary.features.length > 0 && (
            <div className="mb-6">
              <div className="bg-white p-5 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-gray-800 mb-3">✨ Enhancements Included</h3>
                <div className="flex flex-wrap gap-2">
                  {recommendation.summary.features.map((feature, idx) => (
                    <span key={idx} className="px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full text-sm font-medium shadow-sm hover:shadow-md transition-shadow">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {(!recommendation.itinerary?.destinations || recommendation.itinerary.destinations.length === 0) && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 p-5 rounded-lg mb-6 shadow-md">
              <div className="flex items-start">
                <span className="text-3xl mr-3">⚠️</span>
                <div>
                  <h4 className="font-bold text-yellow-800 mb-1">No Destinations Found</h4>
                  <p className="text-yellow-700 text-sm">Try adjusting your preferences or selecting different interests to get more recommendations.</p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm"
            >
              ← Start Over
            </button>
            <button
              onClick={saveItinerary}
              disabled={loading || selectedLocations.length === 0}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all shadow-lg ${
                loading || selectedLocations.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                `💾 Save ${selectedLocations.length} Location${selectedLocations.length !== 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationWizard;
