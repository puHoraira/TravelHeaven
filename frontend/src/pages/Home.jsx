import { 
  Bus, Hotel, MapPin, Sparkles, Users, Compass, 
  TrendingUp, Globe, Star, Calendar, Clock, 
  Navigation, Shield, Heart, Zap, ChevronRight, Map as MapIcon,
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

  const [statsLoading, setStatsLoading] = useState(false);
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
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState('');
  const [stats, setStats] = useState({
    locations: null,
    hotels: null,
    transport: null,
    guides: null,
  });

  const formatStat = (value) => {
    if (statsLoading) return '…';
    if (typeof value === 'number') return value;
    return '—';
  };

  const safeAvgRating = (doc) => {
    const avg = doc?.rating?.average ?? doc?.averageRating;
    return typeof avg === 'number' ? avg : null;
  };

  const safeViews = (doc) => {
    const v = doc?.views ?? doc?.viewCount;
    return typeof v === 'number' ? v : null;
  };

  const features = [
    {
      icon: MapPin,
      title: `${typeof stats.locations === 'number' ? stats.locations : '—'} Locations`,
      description: 'Explore verified destinations across Bangladesh',
      color: 'blue',
      link: '/locations'
    },
    {
      icon: Hotel,
      title: `${typeof stats.hotels === 'number' ? stats.hotels : '—'} Hotels`,
      description: 'Find stays and rooms listed by guides',
      color: 'green',
      link: '/hotels'
    },
    {
      icon: Bus,
      title: `${typeof stats.transport === 'number' ? stats.transport : '—'} Transport Options`,
      description: 'Browse buses and other approved transport listings',
      color: 'purple',
      link: '/transportation'
    },
    {
      icon: Users,
      title: `${typeof stats.guides === 'number' ? stats.guides : '—'} Expert Guides`,
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
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const results = await Promise.allSettled([
          api.get('/locations', { params: { page: 1, limit: 1 } }),
          api.get('/hotels', { params: { page: 1, limit: 1 } }),
          api.get('/guides', { params: { page: 1, limit: 1 } }),
          api.get('/transportation', { params: { page: 1, limit: 1 } }),
        ]);

        const totalFrom = (r) => (r.status === 'fulfilled' ? (r.value?.pagination?.total ?? null) : null);

        setStats({
          locations: totalFrom(results[0]),
          hotels: totalFrom(results[1]),
          guides: totalFrom(results[2]),
          transport: totalFrom(results[3]),
        });
      } catch (err) {
        // Keep UI usable even if stats fail.
      } finally {
        setStatsLoading(false);
      }
    };

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
    fetchStats();
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
      setPlanSaving(true);

      const destinationText = (planPreview.destination || planDestination || '').trim();

      // Lightweight client-side geocoding so the map has coordinates immediately.
      // Uses Nominatim (OpenStreetMap) like the existing LocationSearchInput.
      const geocode = async (query) => {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'TravelHeaven/1.0',
          },
        });
        if (!response.ok) return null;
        const data = await response.json();
        const first = Array.isArray(data) ? data[0] : null;
        if (!first?.lat || !first?.lon) return null;
        const lat = parseFloat(first.lat);
        const lng = parseFloat(first.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return { latitude: lat, longitude: lng };
      };

      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

      const placeToCoords = new globalThis.Map();
      const maxUniqueGeocodes = 20;
      const allActivities = (planPreview.days || []).flatMap((d) => d.activities || []);
      const uniquePlaces = [...new Set(allActivities.map((a) => (a?.place_name || a?.placeName || '').trim()).filter(Boolean))];

      // Respect Nominatim usage: keep requests slow and deduplicated.
      for (const place of uniquePlaces.slice(0, maxUniqueGeocodes)) {
        const query = destinationText ? `${place}, ${destinationText}` : place;
        // Skip if already geocoded
        if (placeToCoords.has(place)) continue;
        const coords = await geocode(query);
        if (coords) placeToCoords.set(place, coords);
        await sleep(1100);
      }

      const planWithCoords = {
        ...planPreview,
        title: `${destinationText || planPreview.destination || 'AI'} Trip Plan`,
        days: (planPreview.days || []).map((d) => ({
          ...d,
          activities: (d.activities || []).map((a) => {
            const place = (a?.place_name || a?.placeName || '').trim();
            const coords = place ? placeToCoords.get(place) : null;
            if (!coords) return a;
            return {
              ...a,
              coordinates: coords,
            };
          }),
        })),
      };

      const res = await api.post('/itineraries/from-ai', planWithCoords);
      if (!res?.success) {
        throw new Error(res?.message || 'Failed to save itinerary');
      }
      toast.success('Itinerary saved');
      navigate(`/itineraries/${res.data?._id}`);
    } catch (err) {
      toast.error(err?.message || 'Failed to save itinerary');
    } finally {
      setPlanSaving(false);
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
                <p className="stat-number">{formatStat(stats.locations)}</p>
                <p className="stat-label">Locations</p>
              </div>
            </div>
            <div className="stat-item">
              <Hotel size={24} />
              <div>
                <p className="stat-number">{formatStat(stats.hotels)}</p>
                <p className="stat-label">Hotels</p>
              </div>
            </div>
            <div className="stat-item">
              <Bus size={24} />
              <div>
                <p className="stat-number">{formatStat(stats.transport)}</p>
                <p className="stat-label">Transport</p>
              </div>
            </div>
            <div className="stat-item">
              <Users size={24} />
              <div>
                <p className="stat-number">{formatStat(stats.guides)}</p>
                <p className="stat-label">Guides</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <div className="section-header">
          <h2>Start Here</h2>
          <p>Jump into the most-used parts of the app</p>
        </div>
        <div className="actions-grid">
          <div className="action-card" onClick={() => navigate('/locations')} role="button" tabIndex={0}>
            <MapPin size={28} />
            <h3>Explore Locations</h3>
            <p>Browse approved destinations</p>
          </div>
          <div className="action-card" onClick={() => navigate('/hotels')} role="button" tabIndex={0}>
            <Hotel size={28} />
            <h3>Find Hotels</h3>
            <p>Choose stays and rooms</p>
          </div>
          <div className="action-card" onClick={() => navigate('/transportation')} role="button" tabIndex={0}>
            <Bus size={28} />
            <h3>Transport</h3>
            <p>See available transport options</p>
          </div>
          <div className="action-card" onClick={() => navigate('/guides')} role="button" tabIndex={0}>
            <Users size={28} />
            <h3>Hire a Guide</h3>
            <p>Verified local experts</p>
          </div>
        </div>
      </div>

      {/* AI Assistant (Traveler) */}
      {user?.role === 'user' && (
        <div className="ai-advisor-section">
          <div className="ai-card">
            <div className="ai-header">
              <div className="ai-title-group">
                <div className="ai-icon">
                  <Compass size={32} />
                </div>
                <div>
                  <h2>AI Travel Assistant</h2>
                  <p>Generate an itinerary or get route recommendations</p>
                </div>
              </div>
            </div>

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
                      <MapIcon size={20} />
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
                      <div className="journey-steps-header">
                        <div>
                          <h5>Preview</h5>
                          <p className="journey-steps-subtitle">Save it to edit and view on the map.</p>
                        </div>
                        <button
                          type="button"
                          onClick={handleSavePlan}
                          className="ai-submit-btn ai-save-btn"
                          disabled={planSaving}
                        >
                          {planSaving ? 'Saving (adding map pins)…' : 'Save Itinerary'}
                        </button>
                      </div>
                      <ol>
                        {(planPreview.days || []).map((d) => (
                          <li key={d.day_number || d.dayNumber}>
                            <span className="step-number">{d.day_number || d.dayNumber}</span>
                            <div className="step-content">
                              <p className="font-semibold">{d.title || `Day ${d.day_number || d.dayNumber}`}</p>
                              <ul className="journey-activities">
                                {(d.activities || []).map((a, idx) => (
                                  <li key={idx} className="journey-activity">
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
                      <MapIcon size={20} />
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
          </div>
        </div>
      )}

      {/* Recommendations (real data) */}
      {user?.role === 'user' && (
        <div className="destinations-section">
          <div className="section-header">
            <h2>Recommended For You</h2>
            <p>{suggestionsLoading ? 'Loading recommendations…' : 'Based on what’s popular right now'}</p>
          </div>

          <div className="destinations-grid">
            {(suggestions.suggestedLocations || []).slice(0, 4).map((loc) => {
              const rating = safeAvgRating(loc);
              const views = safeViews(loc);
              return (
                <div
                  key={loc._id}
                  className="destination-card"
                  onClick={() => navigate(`/locations/${loc._id}`)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="destination-image">
                    <MapPin size={34} color="white" />
                  </div>
                  <div className="destination-info">
                    <h4>{loc.name}</h4>
                    <div className="destination-meta">
                      <div className="rating">
                        <Star size={14} /> {rating ? rating.toFixed(1) : '—'}
                      </div>
                      <div className="visitors">
                        <TrendingUp size={14} /> {typeof views === 'number' ? views : '—'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Services */}
      <div className="services-section">
        <div className="section-header">
          <h2>Why TravelHeaven</h2>
          <p>Plan faster, book smarter, travel better</p>
        </div>
        <div className="services-grid">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <div key={service.title} className="service-card">
                <div className="service-icon">
                  <Icon size={28} />
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <ul className="service-features">
                  {service.features.map((f) => (
                    <li key={f}>
                      <span>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Grid */}
      <div className="features-section">
        <div className="section-header">
          <h2>What We Offer</h2>
          <p>Everything you need for the perfect trip</p>
        </div>
        <div className="features-grid">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`feature-card feature-${feature.color}`}
                onClick={() => navigate(feature.link)}
                role="button"
                tabIndex={0}
              >
                <div className="feature-icon">
                  <Icon size={28} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <div className="feature-arrow">
                  <ChevronRight size={20} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
