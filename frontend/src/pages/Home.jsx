import { 
  Bus, Hotel, MapPin, Sparkles, Users, Compass, Train, 
  TrendingUp, Globe, Star, Award, Calendar, Clock, 
  Navigation, Shield, Heart, Zap, ChevronRight, Map,
  Camera
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import './Home.css';

const Home = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const [showOptions, setShowOptions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState({
    suggestedLocations: [],
    suggestedHotels: [],
    suggestedItineraries: [],
    myRecentItineraries: [],
  });

  const [planDestination, setPlanDestination] = useState('');
  const [planDays, setPlanDays] = useState(3);
  const [planBudget, setPlanBudget] = useState('mid');
  const [planInterests, setPlanInterests] = useState('');
  const [planTravelerType, setPlanTravelerType] = useState('');
  const [planPreview, setPlanPreview] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState('');
  const [stats] = useState({
    locations: 150,
    hotels: 89,
    trains: 155,
    guides: 45
  });

  const features = [
    {
      icon: MapPin,
      title: '150+ Destinations',
      description: 'Explore amazing places across Bangladesh',
      color: 'blue',
      link: '/locations'
    },
    {
      icon: Hotel,
      title: '89+ Hotels',
      description: 'Find perfect accommodation for your stay',
      color: 'green',
      link: '/hotels'
    },
    {
      icon: Train,
      title: '155+ Trains',
      description: 'Book train tickets with complete route details',
      color: 'purple',
      link: '/trains'
    },
    {
      icon: Users,
      title: '45+ Expert Guides',
      description: 'Get local insights from verified guides',
      color: 'orange',
      link: '/guides'
    }
  ];

  const services = [
    {
      icon: Compass,
      title: 'Smart Trip Planning',
      description: 'AI-powered route recommendations for your journey',
      features: ['Real-time routes', 'Cost estimates', 'Travel time']
    },
    {
      icon: Shield,
      title: 'Verified Information',
      description: 'All hotels and guides are verified by our team',
      features: ['Trusted reviews', 'Quality assured', 'Secure bookings']
    },
    {
      icon: Zap,
      title: 'Instant Booking',
      description: 'Book hotels, trains, and transport in seconds',
      features: ['Quick checkout', 'Multiple options', 'Best prices']
    },
    {
      icon: Heart,
      title: 'Local Experiences',
      description: 'Discover hidden gems recommended by locals',
      features: ['Authentic culture', 'Local cuisine', 'Off-beat paths']
    }
  ];

  const popularDestinations = [
    { name: "Cox's Bazar", image: '🏖️', rating: 4.8, visitors: '12K+' },
    { name: 'Sundarbans', image: '🌿', rating: 4.9, visitors: '8K+' },
    { name: 'Rangamati', image: '⛰️', rating: 4.7, visitors: '5K+' },
    { name: 'Sylhet', image: '🌲', rating: 4.6, visitors: '10K+' }
  ];

  const handleAskAI = async () => {
    if (!origin || !destination) {
      setAiError('Please enter both origin and destination');
      return;
    }
    setAiLoading(true);
    setAiError('');
    setAiResult(null);
    try {
      const res = await api.post('/ai/route-advisor', { origin, destination });
      // Backward-compatible: this endpoint historically returns raw JSON (no {success,data} wrapper)
      const payload = res?.success ? res.data : res;
      setAiResult(payload);
    } catch (err) {
      setAiError(err?.message || err?.error || err || 'Something went wrong');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!user || user.role !== 'user') return;
      setSuggestionsLoading(true);
      try {
        const res = await api.get('/suggestions/dashboard', { params: { limit: 6 } });
        if (res?.success) {
          setSuggestions({
            suggestedLocations: res.data?.suggestedLocations || [],
            suggestedHotels: res.data?.suggestedHotels || [],
            suggestedItineraries: res.data?.suggestedItineraries || [],
            myRecentItineraries: res.data?.myRecentItineraries || [],
          });
        }
      } catch (err) {
        // Keep the home page usable even if suggestions fail.
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
  }, [user]);

  const handlePreviewPlan = async () => {
    if (!planDestination.trim()) {
      setPlanError('Please enter a destination');
      return;
    }
    setPlanLoading(true);
    setPlanError('');
    setPlanPreview(null);
    try {
      const interests = planInterests
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.post('/ai/itinerary/preview', {
        destination: planDestination.trim(),
        durationDays: Number(planDays) || 3,
        budgetLevel: planBudget,
        interests,
        travelerType: planTravelerType.trim(),
      });

      if (!res?.success) {
        throw new Error(res?.message || 'Failed to preview itinerary');
      }
      setPlanPreview(res.data);
    } catch (err) {
      setPlanError(err?.message || 'Failed to generate itinerary');
    } finally {
      setPlanLoading(false);
    }
  };

  const handleSavePlan = async () => {
    if (!planPreview) return;
    try {
      const res = await api.post('/itineraries/from-ai', {
        ...planPreview,
        title: `${planPreview.destination || planDestination} Trip Plan`,
      });
      if (!res?.success) {
        throw new Error(res?.message || 'Failed to save itinerary');
      }
      toast.success('Itinerary saved');
      navigate(`/itineraries/${res.data?._id}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to save itinerary');
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <div className="hero-banner">
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={16} />
            <span>Explore Bangladesh Like Never Before</span>
          </div>
          <h1 className="hero-title">
            Welcome {user?.profile?.firstName || user?.username}! 👋
          </h1>
          <p className="hero-subtitle">
            {user?.role === 'admin' && 'Manage the platform and oversee all travel operations'}
            {user?.role === 'guide' && 'Share your expertise and help travelers explore Bangladesh'}
            {user?.role === 'user' && 'Discover amazing destinations and plan your perfect journey'}
          </p>
          <div className="hero-stats">
            <div className="stat-item">
              <Globe size={24} />
              <div>
                <p className="stat-number">{stats.locations}+</p>
                <p className="stat-label">Locations</p>
              </div>
            </div>
            <div className="stat-item">
              <Hotel size={24} />
              <div>
                <p className="stat-number">{stats.hotels}+</p>
                <p className="stat-label">Hotels</p>
              </div>
            </div>
            <div className="stat-item">
              <Train size={24} />
              <div>
                <p className="stat-number">{stats.trains}+</p>
                <p className="stat-label">Trains</p>
              </div>
            </div>
            <div className="stat-item">
              <Users size={24} />
              <div>
                <p className="stat-number">{stats.guides}+</p>
                <p className="stat-label">Guides</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Options (Traveler) */}
      {user?.role === 'user' && (
        <div className="ai-advisor-section">
          <div className="ai-card">
            <div className="ai-header">
              <div className="ai-title-group">
                <div className="ai-icon">
                  <Compass size={32} />
                </div>
                <div>
                  <h2>Options</h2>
                  <p>Plan a day-by-day itinerary or get route recommendations</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowOptions((v) => !v)}
                className="ai-submit-btn"
                style={{ maxWidth: 260 }}
              >
                <span>{showOptions ? 'Hide Options' : 'Show Options'}</span>
              </button>
            </div>

            {showOptions && (
              <div className="ai-content">
                {/* AI Day-by-day Itinerary */}
                <div className="ai-results" style={{ marginBottom: 16 }}>
                  <div className="ai-summary">
                    <Sparkles size={24} />
                    <div>
                      <h3>AI Day-by-day Itinerary</h3>
                      <p>Generate a 2–4 activity/day plan you can save and edit.</p>
                    </div>
                  </div>

                  <div className="ai-input-group">
                    <div className="ai-input-wrapper">
                      <Navigation size={20} />
                      <input
                        type="text"
                        placeholder="Destination (e.g., Cox's Bazar)"
                        value={planDestination}
                        onChange={(e) => setPlanDestination(e.target.value)}
                      />
                    </div>
                    <div className="ai-input-wrapper">
                      <Calendar size={20} />
                      <input
                        type="number"
                        min={1}
                        max={14}
                        placeholder="Days"
                        value={planDays}
                        onChange={(e) => setPlanDays(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ai-input-group">
                    <div className="ai-input-wrapper">
                      <Map size={20} />
                      <input
                        type="text"
                        placeholder="Interests (comma-separated, e.g., beaches, food, hiking)"
                        value={planInterests}
                        onChange={(e) => setPlanInterests(e.target.value)}
                      />
                    </div>
                    <div className="ai-input-wrapper">
                      <Users size={20} />
                      <input
                        type="text"
                        placeholder="Traveler type (optional, e.g., solo, family)"
                        value={planTravelerType}
                        onChange={(e) => setPlanTravelerType(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ai-input-group">
                    <div className="ai-input-wrapper">
                      <span className="currency">৳</span>
                      <select value={planBudget} onChange={(e) => setPlanBudget(e.target.value)}>
                        <option value="low">Low</option>
                        <option value="mid">Mid</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <button onClick={handlePreviewPlan} className="ai-submit-btn" disabled={planLoading}>
                    {planLoading ? (
                      <>
                        <div className="loading-spinner"></div>
                        <span>Generating…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        <span>Preview Itinerary</span>
                      </>
                    )}
                  </button>

                  {planError && (
                    <div className="ai-error">
                      <span>⚠️</span> {planError}
                    </div>
                  )}

                  {planPreview && (
                    <div className="journey-steps">
                      <h5>Preview</h5>
                      <ol>
                        {(planPreview.days || []).map((d) => (
                          <li key={d.day_number || d.dayNumber}>
                            <span className="step-number">{d.day_number || d.dayNumber}</span>
                            <div className="step-content">
                              <p className="font-semibold">{d.title || `Day ${d.day_number || d.dayNumber}`}</p>
                              <ul style={{ marginTop: 6 }}>
                                {(d.activities || []).map((a, idx) => (
                                  <li key={idx} style={{ marginBottom: 6 }}>
                                    <p>
                                      <strong>{a.time_of_day || a.timeOfDay || 'Any time'}:</strong> {a.place_name || a.placeName}
                                    </p>
                                    <p className="step-route">{a.description}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </li>
                        ))}
                      </ol>

                      <button type="button" onClick={handleSavePlan} className="ai-submit-btn" style={{ marginTop: 12 }}>
                        Save Itinerary
                      </button>
                    </div>
                  )}
                </div>

                {/* Route Advisor (origin -> destination) */}
                <div className="ai-results">
                  <div className="ai-summary">
                    <Sparkles size={24} />
                    <div>
                      <h3>Route Advisor</h3>
                      <p>Get transport options from origin to destination.</p>
                    </div>
                  </div>

                  <div className="ai-input-group">
                    <div className="ai-input-wrapper">
                      <Map size={20} />
                      <input
                        type="text"
                        placeholder="Starting point (e.g., Dhaka)"
                        value={origin}
                        onChange={e => setOrigin(e.target.value)}
                      />
                    </div>
                    <div className="ai-input-wrapper">
                      <Navigation size={20} />
                      <input
                        type="text"
                        placeholder="Destination (e.g., Cox's Bazar)"
                        value={destination}
                        onChange={e => setDestination(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAskAI}
                    className="ai-submit-btn"
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <>
                        <div className="loading-spinner"></div>
                        <span>AI is thinking...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        <span>Get AI Recommendations</span>
                      </>
                    )}
                  </button>

                  {aiError && (
                    <div className="ai-error">
                      <span>⚠️</span> {aiError}
                    </div>
                  )}

                  {aiResult && (
                    <div className="transport-options">
                      {aiResult.recommendedTransports?.map((t, idx) => (
                        <div key={idx} className="transport-card">
                          <div className="transport-header">
                            <h4>{t.mode?.replace('_', ' ') || `Option ${idx + 1}`}</h4>
                            <span className="transport-badge">Option {idx + 1}</span>
                          </div>

                          <div className="transport-stats">
                            <div className="stat">
                              <Clock size={16} />
                              <div>
                                <p className="stat-value">
                                  {t.estimatedDurationText || 
                                    (t.estimatedDurationMinutes ? `${Math.round(t.estimatedDurationMinutes / 60)}h` : 'N/A')}
                                </p>
                                <p className="stat-label">Duration</p>
                              </div>
                            </div>
                            <div className="stat">
                              <span className="currency">৳</span>
                              <div>
                                <p className="stat-value">{t.estimatedCostRange || 'N/A'}</p>
                                <p className="stat-label">Cost</p>
                              </div>
                            </div>
                            <div className="stat">
                              <MapPin size={16} />
                              <div>
                                <p className="stat-value">{t.numberOfStops ?? 0}</p>
                                <p className="stat-label">Stops</p>
                              </div>
                            </div>
                          </div>

                          <div className="journey-steps">
                            <h5>Journey Steps</h5>
                            <ol>
                              {t.steps?.map((step, stepIdx) => (
                                <li key={stepIdx}>
                                  <span className="step-number">{step.order || stepIdx + 1}</span>
                                  <div className="step-content">
                                    <p>{step.instruction}</p>
                                    <p className="step-route">
                                      {step.from} → {step.to} ({step.transportType})
                                    </p>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Features Grid */}
      <div className="features-section">
        <div className="section-header">
          <h2>What We Offer</h2>
          <p>Everything you need for the perfect trip</p>
        </div>
        <div className="features-grid">
          </div>
        </div>
      )}

      {/* Options (Traveler) */}
      {user?.role === 'user' && (
        <div className="ai-advisor-section">
          <div className="ai-card">
            <div className="ai-header">
              <div className="ai-title-group">
                <div className="ai-icon">
                  <Compass size={32} />
                </div>
                <div>
                  <h2>Options</h2>
                  <p>Plan a day-by-day itinerary or get route recommendations</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowOptions((v) => !v)}
                className="ai-submit-btn"
                style={{ maxWidth: 260 }}
              >
                <span>{showOptions ? 'Hide Options' : 'Show Options'}</span>
              </button>
            </div>

            {showOptions && (
              <div className="ai-content">
                {/* AI Day-by-day Itinerary */}
                <div className="ai-results" style={{ marginBottom: 16 }}>
                  <div className="ai-summary">
                    <Sparkles size={24} />
                    <div>
                      <h3>AI Day-by-day Itinerary</h3>
                      <p>Generate a 2–4 activity/day plan you can save and edit.</p>
                    </div>
                  </div>

                  <div className="ai-input-group">
                    <div className="ai-input-wrapper">
                      <Navigation size={20} />
                      <input
                        type="text"
                        placeholder="Destination (e.g., Cox's Bazar)"
                        value={planDestination}
                        onChange={(e) => setPlanDestination(e.target.value)}
                      />
                    </div>
                    <div className="ai-input-wrapper">
                      <Calendar size={20} />
                      <input
                        type="number"
                        min={1}
                        max={14}
                        placeholder="Days"
                        value={planDays}
                        onChange={(e) => setPlanDays(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ai-input-group">
                    <div className="ai-input-wrapper">
                      <Map size={20} />
                      <input
                        type="text"
                        placeholder="Interests (comma-separated, e.g., beaches, food, hiking)"
                        value={planInterests}
                        onChange={(e) => setPlanInterests(e.target.value)}
                      />
                    </div>
                    <div className="ai-input-wrapper">
                      <Users size={20} />
                      <input
                        type="text"
                        placeholder="Traveler type (optional, e.g., solo, family)"
                        value={planTravelerType}
                        onChange={(e) => setPlanTravelerType(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="ai-input-group">
                    <div className="ai-input-wrapper">
                      <span className="currency">৳</span>
                      <select value={planBudget} onChange={(e) => setPlanBudget(e.target.value)}>
                        <option value="low">Low</option>
                        <option value="mid">Mid</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <button onClick={handlePreviewPlan} className="ai-submit-btn" disabled={planLoading}>
                    {planLoading ? (
                      <>
                        <div className="loading-spinner"></div>
                        <span>Generating…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        <span>Preview Itinerary</span>
                      </>
                    )}
                  </button>

                  {planError && (
                    <div className="ai-error">
                      <span>⚠️</span> {planError}
                    </div>
                  )}

                  {planPreview && (
                    <div className="journey-steps">
                      <h5>Preview</h5>
                      <ol>
                        {(planPreview.days || []).map((d) => (
                          <li key={d.day_number || d.dayNumber}>
                            <span className="step-number">{d.day_number || d.dayNumber}</span>
                            <div className="step-content">
                              <p className="font-semibold">{d.title || `Day ${d.day_number || d.dayNumber}`}</p>
                              <ul style={{ marginTop: 6 }}>
                                {(d.activities || []).map((a, idx) => (
                                  <li key={idx} style={{ marginBottom: 6 }}>
                                    <p>
                                      <strong>{a.time_of_day || a.timeOfDay || 'Any time'}:</strong> {a.place_name || a.placeName}
                                    </p>
                                    <p className="step-route">{a.description}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </li>
                        ))}
                      </ol>

                      <button type="button" onClick={handleSavePlan} className="ai-submit-btn" style={{ marginTop: 12 }}>
                        Save Itinerary
                      </button>
                    </div>
                  )}
                </div>

                {/* Route Advisor (origin -> destination) */}
                <div className="ai-results">
                  <div className="ai-summary">
                    <Sparkles size={24} />
                    <div>
                      <h3>Route Advisor</h3>
                      <p>Get transport options from origin to destination.</p>
                    </div>
                  </div>

                  <div className="ai-input-group">
                    <div className="ai-input-wrapper">
                      <Map size={20} />
                      <input
                        type="text"
                        placeholder="Starting point (e.g., Dhaka)"
                        value={origin}
                        onChange={e => setOrigin(e.target.value)}
                      />
                    </div>
                    <div className="ai-input-wrapper">
                      <Navigation size={20} />
                      <input
                        type="text"
                        placeholder="Destination (e.g., Cox's Bazar)"
                        value={destination}
                        onChange={e => setDestination(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAskAI}
                    className="ai-submit-btn"
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <>
                        <div className="loading-spinner"></div>
                        <span>AI is thinking...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={20} />
                        <span>Get AI Recommendations</span>
                      </>
                    )}
                  </button>

                  {aiError && (
                    <div className="ai-error">
                      <span>⚠️</span> {aiError}
                    </div>
                  )}

                  {aiResult && (
                    <div className="transport-options">
                      {aiResult.recommendedTransports?.map((t, idx) => (
                        <div key={idx} className="transport-card">
                          <div className="transport-header">
                            <h4>{t.mode?.replace('_', ' ') || `Option ${idx + 1}`}</h4>
                            <span className="transport-badge">Option {idx + 1}</span>
                          </div>

                          <div className="transport-stats">
                            <div className="stat">
                              <Clock size={16} />
                              <div>
                                <p className="stat-value">
                                  {t.estimatedDurationText || 
                                    (t.estimatedDurationMinutes ? 
                                      `${Math.floor(t.estimatedDurationMinutes / 60)}h ${t.estimatedDurationMinutes % 60}m` : 
                                      'N/A')}
                                </p>
                                <p className="stat-label">Duration</p>
                              </div>
                            </div>
                            <div className="stat">
                              <span className="currency">৳</span>
                              <div>
                                <p className="stat-value">{t.estimatedCostRange || 'N/A'}</p>
                                <p className="stat-label">Estimated Cost</p>
                              </div>
                            </div>
                            <div className="stat">
                              <MapPin size={16} />
                              <div>
                                <p className="stat-value">{t.numberOfStops ?? t.steps?.length ?? 0}</p>
                                <p className="stat-label">Stops</p>
                              </div>
                            </div>
                          </div>

                          {Array.isArray(t.mustVisitPlaces) && t.mustVisitPlaces.length > 0 && (
                            <div className="must-visit">
                              <h5>
                                <Camera size={16} />
                                Must-Visit Places
                              </h5>
                              <div className="places-tags">
                                {t.mustVisitPlaces.map((place, i) => (
                                  <span key={i} className="place-tag">{place}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {Array.isArray(t.steps) && t.steps.length > 0 && (
                            <div className="journey-steps">
                              <h5>Journey Steps</h5>
                              <ol>
                                {t.steps.map(step => (
                                  <li key={step.order || `${idx}-${step.instruction}`}>
                                    <span className="step-number">{step.order}</span>
                                    <div className="step-content">
                                      <p>{step.instruction}</p>
                                      {step.from && step.to && (
                                        <p className="step-route">
                                          {step.from} → {step.to} ({step.transportType})
                                        </p>
                                      )}
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}

                          <div className="pros-cons">
                            {Array.isArray(t.pros) && t.pros.length > 0 && (
                              <div className="pros">
                                <h5>✓ Advantages</h5>
                                <ul>
                                  {t.pros.map((p, i) => (
                                    <li key={i}>{p}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {Array.isArray(t.cons) && t.cons.length > 0 && (
                              <div className="cons">
                                <h5>✗ Considerations</h5>
                                <ul>
                                  {t.cons.map((c, i) => (
                                    <li key={i}>{c}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
