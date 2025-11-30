import { useState, useEffect } from 'react';
import { 
  Train, 
  Search, 
  Calendar, 
  MapPin, 
  Clock, 
  Users,
  DollarSign,
  Info,
  ExternalLink,
  Loader2,
  AlertCircle,
  ArrowRight,
  Filter,
  RefreshCw,
  List,
  Route
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import StationAutocomplete from '../components/StationAutocomplete';
import './BDRailway.css';

const BDRailway = () => {
  const [searchParams, setSearchParams] = useState({
    fromCity: '',
    toCity: '',
    date: '',
    seatClass: 'S_CHAIR'
  });

  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [bearerToken, setBearerToken] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [deviceKey, setDeviceKey] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterClass, setFilterClass] = useState('all');
  const [showRoutes, setShowRoutes] = useState(false);
  const [trainRoutes, setTrainRoutes] = useState(null);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  const seatClasses = [
    { value: 'S_CHAIR', label: 'Shulov Chair' },
    { value: 'SNIGDHA', label: 'Snigdha' },
    { value: 'AC_S', label: 'AC Seat' },
    { value: 'AC_B', label: 'AC Berth' },
    { value: 'F_SEAT', label: 'First Seat' },
    { value: 'SHOVAN', label: 'Shovan' }
  ];

  const popularRoutes = [
    { from: 'Dhaka', to: 'Chittagong', icon: '🏙️→🏖️' },
    { from: 'Dhaka', to: 'Sylhet', icon: '🏙️→🌲' },
    { from: 'Dhaka', to: 'Rajshahi', icon: '🏙️→🏛️' },
    { from: 'Dhaka', to: 'Khulna', icon: '🏙️→🌊' },
    { from: 'Chittagong', to: 'Sylhet', icon: '🏖️→🌲' },
    { from: 'Rangpur', to: 'Dhaka', icon: '🌾→🏙️' }
  ];

  const handleSearch = async (e) => {
    if (e) e.preventDefault();

    if (!searchParams.fromCity || !searchParams.toCity) {
      toast.error('Please enter both From and To cities');
      return;
    }

    if (!searchParams.date) {
      toast.error('Please select journey date');
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const params = {
        fromCity: searchParams.fromCity,
        toCity: searchParams.toCity,
        date: searchParams.date,
        seatClass: searchParams.seatClass
      };

      if (bearerToken && bearerToken.trim()) {
        params.bearerToken = bearerToken.trim();
      }
      if (deviceId && deviceId.trim()) {
        params.deviceId = deviceId.trim();
      }
      if (deviceKey && deviceKey.trim()) {
        params.deviceKey = deviceKey.trim();
      }

      console.log('🚂 Searching trains:', params);

      const { data } = await api.get('/railway/search', { params });

      let trainsList = [];
      if (data.success && data.data && data.data.trains) {
        trainsList = data.data.trains;
      } else if (data.trains) {
        trainsList = data.trains;
      } else if (Array.isArray(data)) {
        trainsList = data;
      }

      setTrains(trainsList);

      if (trainsList.length === 0) {
        toast('No trains found for this route', { icon: '🚫' });
      } else {
        toast.success(`Found ${trainsList.length} train(s)`);
      }
    } catch (error) {
      console.error('Railway search error:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to search trains';
      
      if (errorMsg.includes('authentication') || errorMsg.includes('Railway API requires')) {
        toast.error('Railway API requires active session. Use "Book on Official Site" to search.', {
          duration: 5000
        });
      } else {
        toast.error(errorMsg);
      }
      setTrains([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRoute = (route) => {
    setSearchParams({
      ...searchParams,
      fromCity: route.from,
      toCity: route.to
    });
  };

  const fetchTrainRoutes = async (trainNumber) => {
    try {
      setLoadingRoutes(true);
      const today = new Date().toISOString().split('T')[0];
      
      const response = await api.post('/railway/routes', {
        trainNumber,
        date: today
      });

      if (response.data && response.data.data) {
        setTrainRoutes(response.data.data);
        setShowRoutes(true);
      }
    } catch (error) {
      console.error('Failed to fetch train routes:', error);
      toast.error('Failed to load route details');
    } finally {
      setLoadingRoutes(false);
    }
  };

  const swapCities = () => {
    setSearchParams({
      ...searchParams,
      fromCity: searchParams.toCity,
      toCity: searchParams.fromCity
    });
  };

  const handleBookTrain = (train, seatType) => {
    window.open('https://eticket.railway.gov.bd/', '_blank');
  };

  const filteredTrains = filterClass === 'all' 
    ? trains 
    : trains.filter(train => 
        train.seatTypes?.some(seat => seat.typeName.toLowerCase().includes(filterClass.toLowerCase()))
      );

  return (
    <div className="bd-railway-page">
      {/* Hero Section */}
      <div className="railway-hero">
        <div className="hero-content">
          <div className="hero-icon">
            <Train size={48} />
          </div>
          <h1>Bangladesh Railway</h1>
          <p>Search and book train tickets across Bangladesh</p>
        </div>
      </div>

      <div className="railway-container">
        {/* Search Section */}
        <div className="search-card">
          <div className="card-header">
            <Train className="header-icon" />
            <h2>Search Trains</h2>
          </div>

          <form onSubmit={handleSearch} className="search-form">
            <div className="form-row">
              <StationAutocomplete
                value={searchParams.fromCity}
                onChange={(value) => setSearchParams({ ...searchParams, fromCity: value })}
                placeholder="e.g., Dhaka, Chittagong, Sylhet"
                label="From Station"
              />

              <button 
                type="button" 
                onClick={swapCities}
                className="swap-btn"
                title="Swap stations"
              >
                <RefreshCw size={20} />
              </button>

              <StationAutocomplete
                value={searchParams.toCity}
                onChange={(value) => setSearchParams({ ...searchParams, toCity: value })}
                placeholder="e.g., Dhaka, Chittagong, Sylhet"
                label="To Station"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  Journey Date
                </label>
                <input
                  type="date"
                  value={searchParams.date}
                  onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>
                  <Users size={16} />
                  Seat Class
                </label>
                <select
                  value={searchParams.seatClass}
                  onChange={(e) => setSearchParams({ ...searchParams, seatClass: e.target.value })}
                  className="form-input"
                >
                  {seatClasses.map(cls => (
                    <option key={cls.value} value={cls.value}>{cls.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="advanced-section">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="advanced-toggle"
              >
                {showAdvanced ? '− Hide Advanced Options' : '+ Show Advanced Options (API Tokens)'}
              </button>

              {showAdvanced && (
                <div className="advanced-inputs">
                  <div className="form-group">
                    <label>Bearer Token (Optional)</label>
                    <textarea
                      value={bearerToken}
                      onChange={(e) => setBearerToken(e.target.value)}
                      placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCJ9..."
                      className="form-input"
                      rows={2}
                    />
                  </div>

                  <div className="form-group">
                    <label>Device ID (Optional)</label>
                    <input
                      type="text"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      placeholder="25ff16b9762a46b319f28b37e2a26c8e"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Device Key (Optional)</label>
                    <textarea
                      value={deviceKey}
                      onChange={(e) => setDeviceKey(e.target.value)}
                      placeholder="99c75c445104f3645838cd91f71f98673b6ecee0..."
                      className="form-input"
                      rows={2}
                    />
                  </div>

                  <div className="info-box">
                    <Info size={16} />
                    <div>
                      <p className="info-title">How to get API tokens:</p>
                      <ol>
                        <li>Visit https://eticket.railway.gov.bd/ and login</li>
                        <li>Open Browser DevTools (F12) → Network tab</li>
                        <li>Search for trains on the website</li>
                        <li>Find "search-trips-v2" request</li>
                        <li>Copy the Authorization, x-device-id, and x-device-key headers</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search size={20} />
                    Search Trains
                  </>
                )}
              </button>

              <a
                href="https://eticket.railway.gov.bd/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
              >
                <ExternalLink size={20} />
                Book on Official Site
              </a>
            </div>
          </form>
        </div>

        {/* Popular Routes */}
        <div className="popular-routes-card">
          <div className="routes-header">
            <h3>
              <Train size={20} />
              Popular Routes
            </h3>
          </div>
          <div className="routes-grid">
            {popularRoutes.map((route, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickRoute(route)}
                className="route-card"
              >
                <span className="route-icon">{route.icon}</span>
                <div className="route-info">
                  <span className="route-from">{route.from}</span>
                  <ArrowRight size={16} />
                  <span className="route-to">{route.to}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* All Train Routes Modal/Section */}
        {showRoutes && trainRoutes && (
          <div className="train-routes-section">
            <div className="routes-header">
              <h2>
                <Route size={24} />
                All Train Routes
              </h2>
              <button
                onClick={() => setShowRoutes(false)}
                className="btn btn-secondary"
              >
                Hide Routes
              </button>
            </div>

            <div className="routes-content">
              {trainRoutes.data && trainRoutes.data.routes ? (
                <div className="routes-list">
                  {trainRoutes.data.routes.map((route, idx) => (
                    <div key={idx} className="route-item">
                      <div className="route-number">
                        <Train size={20} />
                        <span>{route.train_number || route.trainNumber || 'N/A'}</span>
                      </div>
                      <div className="route-details">
                        <div className="route-name">
                          {route.train_name || route.trainName || 'Unknown Train'}
                        </div>
                        <div className="route-path">
                          <MapPin size={14} />
                          <span>{route.from_station || route.fromStation}</span>
                          <ArrowRight size={14} />
                          <MapPin size={14} />
                          <span>{route.to_station || route.toStation}</span>
                        </div>
                        {route.departure_time && (
                          <div className="route-time">
                            <Clock size={14} />
                            <span>Departs: {route.departure_time}</span>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSearchParams({
                            ...searchParams,
                            fromCity: route.from_station || route.fromStation,
                            toCity: route.to_station || route.toStation
                          });
                          setShowRoutes(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="btn-select-route"
                      >
                        Select Route
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="routes-raw-data">
                  <pre>{JSON.stringify(trainRoutes, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Section */}
        {searched && (
          <div className="results-section">
            <div className="results-header">
              <h2>
                {loading ? 'Searching...' : `${filteredTrains.length} Train${filteredTrains.length !== 1 ? 's' : ''} Found`}
              </h2>
              
              {trains.length > 0 && (
                <div className="filter-group">
                  <Filter size={16} />
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Classes</option>
                    <option value="ac">AC Classes</option>
                    <option value="chair">Chair Classes</option>
                    <option value="snigdha">Snigdha</option>
                    <option value="shovan">Shovan</option>
                  </select>
                </div>
              )}
            </div>

            {loading ? (
              <div className="loading-state">
                <Loader2 className="animate-spin" size={48} />
                <p>Searching for available trains...</p>
              </div>
            ) : filteredTrains.length === 0 ? (
              <div className="empty-state">
                <AlertCircle size={48} />
                <h3>No Trains Found</h3>
                <p>Try adjusting your search criteria or select a different date</p>
              </div>
            ) : (
              <div className="trains-list">
                {filteredTrains.map((train, idx) => (
                  <div key={idx} className="train-card">
                    <div className="train-header">
                      <div className="train-info">
                        <Train className="train-icon" />
                        <div>
                          <h3>{train.tripNumber}</h3>
                          <p className="train-route">
                            {train.originCity} → {train.destinationCity}
                          </p>
                        </div>
                      </div>
                      <div className="train-duration">
                        <Clock size={16} />
                        <span>{train.travelTime}</span>
                      </div>
                    </div>

                    <div className="train-schedule">
                      <div className="schedule-item departure">
                        <span className="schedule-label">Departure</span>
                        <span className="schedule-time">{train.departureDateTime}</span>
                        {train.boardingPoints && train.boardingPoints[0] && (
                          <span className="schedule-station">{train.boardingPoints[0].name}</span>
                        )}
                      </div>
                      <div className="schedule-divider">
                        <ArrowRight size={20} />
                      </div>
                      <div className="schedule-item arrival">
                        <span className="schedule-label">Arrival</span>
                        <span className="schedule-time">{train.arrivalDateTime}</span>
                      </div>
                    </div>

                    {train.seatTypes && train.seatTypes.length > 0 && (
                      <div className="seat-types">
                        <h4>Available Classes:</h4>
                        {train.seatTypes.map((seat, seatIdx) => (
                          <div 
                            key={seatIdx} 
                            className={`seat-type-card ${!seat.availability.available ? 'unavailable' : ''}`}
                          >
                            <div className="seat-type-info">
                              <span className="seat-type-name">{seat.typeName}</span>
                              {seat.availability.available ? (
                                <span className="seat-available">
                                  <Users size={14} />
                                  {seat.availability.online} seats
                                </span>
                              ) : (
                                <span className="seat-unavailable">Sold Out</span>
                              )}
                            </div>
                            <div className="seat-type-actions">
                              <div className="seat-price">
                                <DollarSign size={16} />
                                <span className="price-amount">৳{seat.totalFare}</span>
                                {seat.vatAmount > 0 && (
                                  <span className="price-vat">+VAT ৳{seat.vatAmount}</span>
                                )}
                              </div>
                              {seat.availability.available && (
                                <button
                                  onClick={() => handleBookTrain(train, seat)}
                                  className="btn btn-book"
                                >
                                  <ExternalLink size={16} />
                                  Book Now
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info Section */}
        <div className="info-section">
          <div className="info-card">
            <Info size={24} />
            <h3>About Bangladesh Railway</h3>
            <p>
              Bangladesh Railway is the state-owned railway operator in Bangladesh. 
              Our platform helps you search for available trains and their schedules. 
              For actual booking, you'll be redirected to the official Bangladesh Railway e-ticketing portal.
            </p>
          </div>

          <div className="info-card">
            <AlertCircle size={24} />
            <h3>Important Notes</h3>
            <ul>
              <li>Search results may require API authentication for real-time availability</li>
              <li>Book tickets through the official Bangladesh Railway website</li>
              <li>Check train schedules and availability before planning your journey</li>
              <li>Arrive at the station at least 30 minutes before departure</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BDRailway;
