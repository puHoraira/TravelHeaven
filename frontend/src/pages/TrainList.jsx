import { useEffect, useMemo, useState } from 'react';
import { Train, Search, Loader2, Calendar, MapPin, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { trains, searchTrains as filterTrains } from '../data/trainList';
import { useLocation, useNavigate } from 'react-router-dom';
import './TrainList.css';

const TrainList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [trainRoutes, setTrainRoutes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter trains based on search query
  const filteredTrains = searchQuery ? filterTrains(searchQuery) : trains;

  // Get unique train names for display
  const uniqueTrains = {};
  filteredTrains.forEach(train => {
    if (!uniqueTrains[train.name]) {
      uniqueTrains[train.name] = [];
    }
    uniqueTrains[train.name].push(train.number);
  });

  const getTrainNameByNumber = useMemo(() => {
    const map = new Map(trains.map((train) => [train.number, train.name]));
    return (trainNumber) => map.get(trainNumber) || null;
  }, []);

  // Fetch train route details
  const fetchTrainRoutes = async (trainNumber, trainName, dateOverride) => {
    try {
      setLoading(true);
      const dateToUse = dateOverride || selectedDate;
      setSelectedTrain({ number: trainNumber, name: trainName });
      
      const response = await api.post('/railway/routes', {
        trainNumber,
        date: dateToUse
      });

      console.log('API Response:', response.data);
      console.log('Train Routes Data:', response.data.data);
      console.log('Success flag:', response.data.success);
      console.log('Has data?:', !!response.data.data);

      if (response.data && response.data.data) {
        const routeData = response.data.data;
        console.log('Setting trainRoutes to:', routeData);
        console.log('Routes array:', routeData.routes);
        console.log('Is routes an array?', Array.isArray(routeData.routes));
        console.log('Days array:', routeData.days);
        console.log('Is days an array?', Array.isArray(routeData.days));
        
        try {
          setTrainRoutes(routeData);
          console.log('✅ State set successfully');
          toast.success(`Routes loaded for ${trainName} (${trainNumber})`);
        } catch (setStateError) {
          console.error('❌ Error setting state:', setStateError);
          throw setStateError;
        }
      } else {
        toast.error(response.data.message || 'Failed to fetch routes');
        setTrainRoutes(null);
      }
    } catch (error) {
      console.error('Train routes error:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch train routes');
      setTrainRoutes(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const trainNumber = params.get('trainNumber');
    const date = params.get('date');
    const trainNameParam = params.get('trainName');

    if (!trainNumber) return;

    const dateToUse = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : selectedDate;
    if (dateToUse !== selectedDate) setSelectedDate(dateToUse);

    const resolvedName = trainNameParam || getTrainNameByNumber(trainNumber) || `Train ${trainNumber}`;
    fetchTrainRoutes(trainNumber, resolvedName, dateToUse);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  // Close route details
  const closeRouteDetails = () => {
    setSelectedTrain(null);
    setTrainRoutes(null);
    navigate('/trains', { replace: true });
  };

  return (
    <div className="train-list-page">
      {/* Header */}
      <div className="train-list-header">
        <div className="header-content">
          <div className="header-icon">
            <Train size={48} />
          </div>
          <h1>Bangladesh Railway Trains</h1>
          <p>Explore all {trains.length} trains and their routes</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-bar">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by train name or number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>
              <X size={18} />
            </button>
          )}
        </div>
        <div className="search-stats">
          Found {filteredTrains.length} trains
        </div>
      </div>

      {/* Date Selector */}
      <div className="date-selector">
        <Calendar size={20} />
        <label>Select Date for Routes:</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Train List */}
      <div className="trains-grid">
        {Object.entries(uniqueTrains).map(([trainName, trainNumbers]) => (
          <div key={trainName} className="train-card">
            <div className="train-card-header">
              <Train size={24} />
              <h3>{trainName}</h3>
            </div>
            <div className="train-numbers">
              {trainNumbers.map(number => (
                <button
                  key={number}
                  className={`train-number-btn ${selectedTrain?.number === number ? 'active' : ''}`}
                  onClick={() => fetchTrainRoutes(number, trainName)}
                  disabled={loading}
                >
                  <span className="train-number">{number}</span>
                  {loading && selectedTrain?.number === number && (
                    <Loader2 size={16} className="spin" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Route Details Modal */}
      {selectedTrain && (
        <div className="route-modal-overlay" onClick={closeRouteDetails}>
          <div className="route-modal" onClick={(e) => e.stopPropagation()}>
            <div className="route-modal-header">
              <div>
                <h2>{selectedTrain.name}</h2>
                <p>Train Number: {selectedTrain.number}</p>
                <p className="route-date">
                  <Calendar size={16} />
                  {new Date(selectedDate).toLocaleDateString('en-BD', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <button className="close-btn" onClick={closeRouteDetails}>
                <X size={24} />
              </button>
            </div>

            {loading && (
              <div className="loading-container">
                <Loader2 size={48} className="spin" />
                <p>Loading route details...</p>
              </div>
            )}

            {!loading && trainRoutes && (
              <div className="route-details">
                {console.log('Rendering with trainRoutes:', trainRoutes)}
                {console.log('trainRoutes.routes:', trainRoutes.routes)}
                {console.log('trainRoutes.days:', trainRoutes.days)}
                
                {/* Train Name & Duration */}
                {trainRoutes.train_name && (
                  <div className="train-info-banner">
                    <h3>{trainRoutes.train_name}</h3>
                    {trainRoutes.total_duration && (
                      <p className="total-duration">Total Duration: {trainRoutes.total_duration}</p>
                    )}
                  </div>
                )}

                {/* Available Days */}
                {trainRoutes.days && trainRoutes.days.length > 0 && (
                  <div className="available-days">
                    <h3>Available Days</h3>
                    <div className="days-list">
                      {trainRoutes.days.map((day, index) => (
                        <span key={index} className="day-badge">{day}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Route Stations */}
                {trainRoutes.routes && trainRoutes.routes.length > 0 && (
                  <div className="route-stations">
                    <h3>Route & Schedule ({trainRoutes.routes.length} Stations)</h3>
                    <div className="stations-timeline">
                      {trainRoutes.routes.map((station, index) => (
                        <div key={index} className="station-item">
                          <div className="station-number">{index + 1}</div>
                          <div className="station-marker">
                            <div className="marker-dot"></div>
                            {index < trainRoutes.routes.length - 1 && (
                              <div className="marker-line"></div>
                            )}
                          </div>
                          <div className="station-info">
                            <div className="station-header">
                              <h4>
                                <MapPin size={16} />
                                {station.city}
                              </h4>
                              <div className="station-times">
                                {station.departure_time && (
                                  <span className="departure">
                                    <Clock size={14} />
                                    Departure: {station.departure_time}
                                  </span>
                                )}
                                {station.arrival_time && (
                                  <span className="arrival">
                                    <Clock size={14} />
                                    Arrival: {station.arrival_time}
                                  </span>
                                )}
                              </div>
                            </div>
                            {station.halt && (
                              <p className="halt-time">Halt: {station.halt}</p>
                            )}
                            {station.duration && (
                              <p className="duration">Duration: {station.duration}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No Routes Available */}
                {(!trainRoutes.routes || trainRoutes.routes.length === 0) && (
                  <div className="no-routes">
                    <Train size={48} />
                    <p>No route information available for this date</p>
                  </div>
                )}
              </div>
            )}

            {!loading && !trainRoutes && (
              <div className="error-container">
                <p>Failed to load route details. Please try again.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainList;
