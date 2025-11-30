import { 
  Bus, Hotel, MapPin, Sparkles, Users, Compass, Train, 
  TrendingUp, Globe, Star, Award, Calendar, Clock, 
  Navigation, Shield, Heart, Zap, ChevronRight, Map,
  Camera
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      const res = await fetch('/api/ai/route-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to get AI route');
      }
      setAiResult(data);
    } catch (err) {
      setAiError(err.message || 'Something went wrong');
    } finally {
      setAiLoading(false);
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

      {/* Features Grid */}
      <div className="features-section">
        <div className="section-header">
          <h2>What We Offer</h2>
          <p>Everything you need for the perfect trip</p>
        </div>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`feature-card feature-${feature.color}`}
              onClick={() => navigate(feature.link)}
            >
              <div className="feature-icon">
                <feature.icon size={32} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <div className="feature-arrow">
                <ChevronRight size={20} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Destinations */}
      <div className="destinations-section">
        <div className="section-header">
          <h2>Popular Destinations</h2>
          <p>Most loved places by travelers</p>
        </div>
        <div className="destinations-grid">
          {popularDestinations.map((dest, index) => (
            <div key={index} className="destination-card" onClick={() => navigate('/locations')}>
              <div className="destination-image">
                <span className="destination-emoji">{dest.image}</span>
              </div>
              <div className="destination-info">
                <h4>{dest.name}</h4>
                <div className="destination-meta">
                  <span className="rating">
                    <Star size={14} fill="currentColor" />
                    {dest.rating}
                  </span>
                  <span className="visitors">
                    <Users size={14} />
                    {dest.visitors}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Services Section */}
      <div className="services-section">
        <div className="section-header">
          <h2>Why Choose Travel Heaven?</h2>
          <p>Your complete travel companion</p>
        </div>
        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <div className="service-icon">
                <service.icon size={40} />
              </div>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <ul className="service-features">
                {service.features.map((feat, i) => (
                  <li key={i}>
                    <span>✓</span> {feat}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Role-specific Quick Actions */}
      <div className="quick-actions-section">
        <div className="section-header">
          <h2>Quick Actions</h2>
          <p>Get started in seconds</p>
        </div>
        <div className="actions-grid">
          {user?.role === 'user' && (
            <>
              <div className="action-card" onClick={() => navigate('/locations')}>
                <MapPin size={32} />
                <h3>Explore Locations</h3>
                <p>Browse 150+ verified destinations</p>
              </div>
              <div className="action-card" onClick={() => navigate('/hotels')}>
                <Hotel size={32} />
                <h3>Find Hotels</h3>
                <p>Book from 89+ accommodations</p>
              </div>
              <div className="action-card" onClick={() => navigate('/trains')}>
                <Train size={32} />
                <h3>Train Routes</h3>
                <p>View all 155+ train schedules</p>
              </div>
              <div className="action-card" onClick={() => navigate('/transportation')}>
                <Bus size={32} />
                <h3>Transportation</h3>
                <p>Find buses and cabs</p>
              </div>
              <div className="action-card" onClick={() => navigate('/guides')}>
                <Users size={32} />
                <h3>Expert Guides</h3>
                <p>Connect with 45+ local guides</p>
              </div>
              <div className="action-card" onClick={() => navigate('/bookings')}>
                <Calendar size={32} />
                <h3>My Bookings</h3>
                <p>Track your reservations</p>
              </div>
            </>
          )}

          {user?.role === 'guide' && (
            <>
              <div className="action-card" onClick={() => navigate('/guide/locations')}>
                <MapPin size={32} />
                <h3>Add Location</h3>
                <p>Share new destinations</p>
              </div>
              <div className="action-card" onClick={() => navigate('/guide/hotels')}>
                <Hotel size={32} />
                <h3>List Hotel</h3>
                <p>Add accommodation options</p>
              </div>
              <div className="action-card" onClick={() => navigate('/guide/transport')}>
                <Bus size={32} />
                <h3>Add Transport</h3>
                <p>Include travel services</p>
              </div>
              <div className="action-card" onClick={() => navigate('/profile')}>
                <Users size={32} />
                <h3>My Profile</h3>
                <p>Manage your listings</p>
              </div>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <div className="action-card" onClick={() => navigate('/admin/approvals')}>
                <Award size={32} />
                <h3>Pending Approvals</h3>
                <p>Review submissions</p>
              </div>
              <div className="action-card" onClick={() => navigate('/admin')}>
                <TrendingUp size={32} />
                <h3>Dashboard</h3>
                <p>View platform statistics</p>
              </div>
              <div className="action-card" onClick={() => navigate('/admin/guide-verifications')}>
                <Shield size={32} />
                <h3>Verify Guides</h3>
                <p>Approve guide applications</p>
              </div>
              <div className="action-card" onClick={() => navigate('/locations')}>
                <MapPin size={32} />
                <h3>Browse All</h3>
                <p>View all content</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* AI Route Advisor */}
      {user?.role === 'user' && (
        <div className="ai-advisor-section">
          <div className="ai-card">
            <div className="ai-header">
              <div className="ai-title-group">
                <div className="ai-icon">
                  <Compass size={32} />
                </div>
                <div>
                  <h2>AI Route Advisor</h2>
                  <p>Get intelligent travel recommendations powered by AI</p>
                </div>
              </div>
            </div>

            <div className="ai-content">
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
                <div className="ai-results">
                  <div className="ai-summary">
                    <Sparkles size={24} />
                    <div>
                      <h3>AI Recommendation</h3>
                      <p>{aiResult.summary}</p>
                    </div>
                  </div>

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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
