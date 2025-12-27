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
  const [successMsg, setSuccessMsg] = useState('');
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

  const computeEndDate = (startDate, durationDays) => {
    if (!startDate) return '';
    const duration = Number(durationDays) || 0;
    if (duration <= 0) return '';
    const d = new Date(startDate);
    if (Number.isNaN(d.getTime())) return '';
    d.setDate(d.getDate() + duration - 1);
    return d.toISOString().slice(0, 10);
  };

  const effectivePreferences = () => {
    const endDate = computeEndDate(preferences.startDate, preferences.duration);
    return {
      ...preferences,
      budget: Number(preferences.budget) || 0,
      duration: Number(preferences.duration) || 0,
      endDate,
    };
  };

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
    setSuccessMsg('');
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
    setSuccessMsg('');
    try {
      const data = await api.post('/recommendations/generate', effectivePreferences());

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
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const data = await api.post('/recommendations/compare', effectivePreferences());
      if (!data?.success) {
        setErrorMsg(data?.message || 'Failed to compare strategies.');
        return;
      }
      setComparison(data);
    } catch (error) {
      console.error('Error comparing strategies:', error);
      setErrorMsg(error?.message || 'Failed to compare strategies.');
    } finally {
      setLoading(false);
    }
  };

  const saveItinerary = async () => {
    if (!recommendation?.itinerary) return;
    
    // Validate that at least one location is selected
    if (selectedLocations.length === 0) {
      setErrorMsg('Please select at least one location to save the itinerary.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const finalPreferences = effectivePreferences();
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
        budget: finalPreferences.budget, // Include budget from preferences
        startDate: finalPreferences.startDate, // Include start date
        endDate: finalPreferences.endDate, // Derived from startDate + duration
        duration: finalPreferences.duration, // Include duration
        preferences: finalPreferences, // Include all preferences
      };
      
      console.log('💾 Saving itinerary with budget:', preferences.budget);
      console.log('📦 Full itinerary data:', itineraryToSave);

      const res = await api.post('/recommendations/save', itineraryToSave);
      if (!res?.success) {
        throw new Error(res?.message || 'Failed to save itinerary.');
      }
      setSuccessMsg('Itinerary saved successfully. Redirecting…');
      navigate('/itineraries');
    } catch (error) {
      console.error('Error saving itinerary:', error);
      setErrorMsg(error?.message || 'Failed to save itinerary.');
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Smart Recommendations</h1>
          <p className="text-gray-600 mt-2 max-w-2xl">
            Tell us your preferences and we’ll generate a suggested itinerary using our recommendation strategies.
          </p>
        </div>

      {errorMsg && (
        <div className="mb-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-6 rounded border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMsg}
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Preferences', 'Strategy', 'Enhancements', 'Result'].map((label, idx) => {
            const n = idx + 1;
            const isDone = step > n;
            const isActive = step === n;
            const badgeClass = isDone || isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700';
            const labelClass = isDone || isActive ? 'text-gray-900' : 'text-gray-500';

            return (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${badgeClass}`}>
                  {isDone ? '✓' : n}
                </div>
                <div className="min-w-0">
                  <div className={`text-sm font-semibold ${labelClass}`}>{label}</div>
                  <div className="text-xs text-gray-500">Step {n} of 4</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step 1: Basic Preferences */}
      {step === 1 && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-semibold mb-1 text-gray-900">Preferences</h2>
          <p className="text-sm text-gray-600 mb-5">Set budget, duration, dates and interests.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Budget (USD)</label>
              <input
                type="number"
                value={preferences.budget}
                onChange={(e) => handleInputChange('budget', Number(e.target.value))}
                min={0}
                inputMode="numeric"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Duration (days)</label>
              <input
                type="number"
                value={preferences.duration}
                onChange={(e) => handleInputChange('duration', Number(e.target.value))}
                min={1}
                inputMode="numeric"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Start Date</label>
              <input
                type="date"
                value={preferences.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                End date auto-calculates: <span className="font-medium text-gray-700">{computeEndDate(preferences.startDate, preferences.duration) || '—'}</span>
              </p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700">Interests</label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map(interest => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleArrayItem('interests', interest)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    preferences.interests.includes(interest)
                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {interest.charAt(0).toUpperCase() + interest.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Next: Choose Strategy →
          </button>
        </div>
      )}

      {/* Step 2: Strategy Selection */}
      {step === 2 && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-semibold mb-1 text-gray-900">Strategy</h2>
          <p className="text-sm text-gray-600 mb-5">Choose what to optimize for, or compare all strategies.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {strategyOptions.map(strategy => (
              <div
                key={strategy.value}
                onClick={() => handleInputChange('optimizationGoal', strategy.value)}
                className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                  preferences.optimizationGoal === strategy.value
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
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
            className="w-full inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 mb-3"
          >
            {loading ? 'Comparing…' : 'Compare All Strategies'}
          </button>

          {Array.isArray(comparison?.comparison?.recommendations) && (
            <div className="bg-gray-50 p-4 rounded mb-4">
              <h3 className="font-semibold mb-3 text-gray-800">Strategy Comparison</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {comparison.comparison.recommendations.map((rec, idx) => (
                  <div key={idx} className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{rec.strategy}</span>
                      <span className={`text-xs px-2 py-1 rounded ${rec.ok === false ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                        {rec.ok === false ? 'No data' : 'OK'}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-700 flex justify-between">
                      <span>Cost</span>
                      <span className="font-medium">${Number(rec.cost || 0).toFixed(0)}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-700 flex justify-between">
                      <span>Destinations</span>
                      <span className="font-medium">{rec.destinationCount}</span>
                    </div>
                    {rec.ok === false && rec.error && (
                      <div className="mt-2 text-xs text-red-700">{rec.error}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setStep(1)}
              type="button"
              className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              type="button"
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Next: Enhancements →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Enhancements */}
      {step === 3 && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-semibold mb-1 text-gray-900">Enhancements</h2>
          <p className="text-sm text-gray-600 mb-5">Optional add-ons applied after the base itinerary is generated.</p>

          <div className="grid grid-cols-1 gap-4 mb-4">
            {enhancementOptions.map(enhancement => (
              <div
                key={enhancement.value}
                onClick={() => toggleArrayItem('enhancements', enhancement.value)}
                className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                  preferences.enhancements.includes(enhancement.value)
                    ? 'border-purple-300 bg-purple-50'
                    : 'border-gray-200 hover:bg-gray-50'
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

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setStep(2)}
              type="button"
              className="flex-1 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={generateRecommendation}
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Generating…' : 'Generate Recommendation'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 4 && recommendation && (
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-sm">
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Your Smart Itinerary</h2>
            <p className="text-gray-600">Optimized for <span className="font-semibold text-gray-800">{recommendation.summary?.strategyUsed || 'Best Experience'}</span></p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm font-medium">Your Budget</span>
              </div>
              <p className="text-3xl font-bold text-green-600">${preferences.budget}</p>
              <p className="text-xs text-gray-500 mt-1">Estimated cost: ${Number(recommendation.summary?.totalCost || 0).toFixed(0)}</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm font-medium">Destinations</span>
              </div>
              <p className="text-3xl font-bold text-blue-600">{recommendation.itinerary?.destinations?.length || 0}</p>
              <p className="text-xs text-gray-500 mt-1">In this itinerary</p>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 text-sm font-medium">Duration</span>
              </div>
              <p className="text-3xl font-bold text-purple-600">{preferences.duration} days</p>
              <p className="text-xs text-gray-500 mt-1">
                {preferences.startDate
                  ? `${preferences.startDate} → ${computeEndDate(preferences.startDate, preferences.duration)}`
                  : 'Dates set when you choose a start date'}
              </p>
            </div>
          </div>

          {(recommendation.summary?.counts?.available || recommendation.summary?.counts?.filtered) && (
            <div className="mb-6">
              <div className="bg-white p-5 rounded-xl shadow-md">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Data Used</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="border rounded-lg p-4">
                    <div className="font-semibold text-gray-900 mb-2">Approved (Available)</div>
                    <div className="flex justify-between text-gray-700"><span>Locations</span><span className="font-medium">{recommendation.summary?.counts?.available?.locations ?? '—'}</span></div>
                    <div className="flex justify-between text-gray-700"><span>Hotels</span><span className="font-medium">{recommendation.summary?.counts?.available?.hotels ?? '—'}</span></div>
                    <div className="flex justify-between text-gray-700"><span>Transport</span><span className="font-medium">{recommendation.summary?.counts?.available?.transport ?? '—'}</span></div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="font-semibold text-gray-900 mb-2">After Filters</div>
                    <div className="flex justify-between text-gray-700"><span>Locations</span><span className="font-medium">{recommendation.summary?.counts?.filtered?.locations ?? '—'}</span></div>
                    <div className="flex justify-between text-gray-700"><span>Hotels</span><span className="font-medium">{recommendation.summary?.counts?.filtered?.hotels ?? '—'}</span></div>
                    <div className="flex justify-between text-gray-700"><span>Transport</span><span className="font-medium">{recommendation.summary?.counts?.filtered?.transport ?? '—'}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Destinations */}
          {recommendation.itinerary?.destinations && recommendation.itinerary.destinations.length > 0 && (
            <div className="mb-6">
              <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">📍 Select Destinations</h3>
                    <p className="text-sm text-gray-500 mt-1">Click to choose locations for your itinerary</p>
                  </div>
                  <div className="bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                    <span className="text-gray-700 font-semibold text-sm">
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
                        className={`p-4 rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-white border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className={`font-semibold ${
                                isSelected ? 'text-gray-900' : 'text-gray-800'
                              }`}>
                                {dest.name || 'Unknown Location'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                              <span className={isSelected ? 'text-gray-700' : 'text-gray-600'}>
                                ⭐ {typeof dest.rating === 'object' ? dest.rating?.average || 'N/A' : dest.rating || 'N/A'}
                              </span>
                              {dest.category && (
                                <span className={`px-2 py-1 rounded text-xs ${
                                  isSelected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {dest.category}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`flex-shrink-0 ml-3 w-8 h-8 rounded-full flex items-center justify-center ${
                            isSelected 
                              ? 'bg-blue-600' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {isSelected ? (
                              <span className="text-white text-lg">✓</span>
                            ) : (
                              <span className="text-gray-400 text-lg">+</span>
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
                    <span key={idx} className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-sm font-medium">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {(!recommendation.itinerary?.destinations || recommendation.itinerary.destinations.length === 0) && (
            <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-xl mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
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
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                loading || selectedLocations.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
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
    </div>
  );
};

export default RecommendationWizard;
