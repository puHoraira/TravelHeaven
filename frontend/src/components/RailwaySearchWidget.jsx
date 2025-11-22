import {
  AlertCircle,
  Calendar,
  Clock,
  Edit2,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  Train,
  Users,
  X
} from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';

/**
 * Railway Search Component for Itinerary Integration
 * Usage: <RailwaySearchWidget from="Dhaka" to="Cox's Bazar" date="2025-11-24" />
 */
const RailwaySearchWidget = ({ from, to, date, onSelectTrain }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectedSeatClass, setSelectedSeatClass] = useState('S_CHAIR');
  const [bearerToken, setBearerToken] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [deviceKey, setDeviceKey] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [journeyDate, setJourneyDate] = useState(date || '');
  const [isEditingStations, setIsEditingStations] = useState(false);
  const [editedFrom, setEditedFrom] = useState(from || '');
  const [editedTo, setEditedTo] = useState(to || '');
  const [seatClasses] = useState([
    { value: 'S_CHAIR', label: 'Shulov Chair' },
    { value: 'SNIGDHA', label: 'Snigdha' },
    { value: 'AC_S', label: 'AC Seat' },
    { value: 'AC_B', label: 'AC Berth' },
    { value: 'F_SEAT', label: 'First Seat' },
    { value: 'SHOVAN', label: 'Shovan' }
  ]);

  // Update edited values when props change
  useEffect(() => {
    setEditedFrom(from || '');
    setEditedTo(to || '');
  }, [from, to]);

  const searchTrains = async () => {
    const searchFrom = editedFrom || from;
    const searchTo = editedTo || to;

    if (!searchFrom || !searchTo) {
      toast.error('From and To locations are required');
      return;
    }

    if (!journeyDate) {
      toast.error('Journey date is required');
      return;
    }

    setLoading(true);
    setExpanded(true);

    try {
      const params = {
        fromCity: searchFrom,
        toCity: searchTo,
        date: journeyDate,
        seatClass: selectedSeatClass
      };

      // Add bearer token if provided
      if (bearerToken && bearerToken.trim()) {
        params.bearerToken = bearerToken.trim();
      }

      // Add device ID and key if provided
      if (deviceId && deviceId.trim()) {
        params.deviceId = deviceId.trim();
      }
      if (deviceKey && deviceKey.trim()) {
        params.deviceKey = deviceKey.trim();
      }

      console.log('🚂 Searching trains:', params);

      const { data } = await api.get('/railway/search', { params });

      console.log('📦 Railway API Response:', data);

      // Check if response has the expected structure
      let trains = [];
      
      if (data.success && data.data && data.data.trains) {
        // Backend wrapped response format
        trains = data.data.trains;
      } else if (data.trains) {
        // Direct trains array format
        trains = data.trains;
      } else if (Array.isArray(data)) {
        // Array of trains directly
        trains = data;
      }

      console.log('✅ Parsed trains:', trains, 'length:', trains.length);
      setResults(trains);
      
      if (trains.length === 0) {
        toast('No trains found for this route', { icon: '🚫' });
      } else {
        toast.success(`Found ${trains.length} train(s)`);
      }
    } catch (error) {
      console.error('Railway search error:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to search trains';
      
      // Check if it's an authentication error
      if (errorMsg.includes('authentication') || errorMsg.includes('Railway API requires')) {
        toast.error('Railway API requires active session. Click "Book Directly" to search on official site.', {
          duration: 5000
        });
        setResults([]);
      } else {
        toast.error(errorMsg);
        setResults([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-search when journey date changes
  useEffect(() => {
    if (journeyDate && from && to && expanded) {
      searchTrains();
    }
  }, [journeyDate]);

  const handleBookTrain = (train, seatType) => {
    if (onSelectTrain) {
      onSelectTrain({
        ...train,
        selectedSeatType: seatType
      });
    }
    // Open Bangladesh Railway booking page
    window.open('https://eticket.railway.gov.bd/', '_blank');
  };

  return (
    <div className="border border-green-200 rounded-lg bg-green-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Train className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Find Trains</h3>
        </div>
        
        <div className="flex gap-2">
          {!expanded && (
            <button
              onClick={searchTrains}
              disabled={loading || !from || !to || !journeyDate}
              className="btn btn-sm flex items-center gap-2"
              style={{ 
                backgroundColor: 'white',
                color: '#16a34a',
                border: '1.5px solid rgba(22, 163, 74, 0.3)'
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#16a34a' }} />
                  <span style={{ color: '#16a34a' }}>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" style={{ color: '#16a34a' }} />
                  <span style={{ color: '#16a34a' }}>Search Trains</span>
                </>
              )}
            </button>
          )}
          
          <a
            href="https://eticket.railway.gov.bd/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm flex items-center gap-2"
            style={{ 
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none'
            }}
          >
            <ExternalLink className="h-4 w-4" />
            <span>Book Directly</span>
          </a>
        </div>
      </div>

      {/* Search Parameters */}
      <div className="space-y-2">
        {!from || !to || !journeyDate ? (
          <p className="text-sm text-green-700">
            Set "From", "To" locations and journey date to search for trains
          </p>
        ) : (
          <>
            {/* Station Names with Edit Feature */}
            {isEditingStations ? (
              <div className="space-y-2 bg-white p-3 rounded-lg border border-green-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-900">Edit Station Names</span>
                  <button
                    onClick={() => {
                      setIsEditingStations(false);
                      setEditedFrom(from);
                      setEditedTo(to);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">From Station</label>
                    <input
                      type="text"
                      value={editedFrom}
                      onChange={(e) => setEditedFrom(e.target.value)}
                      placeholder="e.g., Rangpur, Dhaka, Chittagong"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Original: {from}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">To Station</label>
                    <input
                      type="text"
                      value={editedTo}
                      onChange={(e) => setEditedTo(e.target.value)}
                      placeholder="e.g., Rangpur, Dhaka, Chittagong"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Original: {to}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsEditingStations(false);
                      searchTrains();
                    }}
                    className="w-full btn btn-sm flex items-center justify-center gap-2"
                    style={{ backgroundColor: '#16a34a', color: 'white' }}
                  >
                    <Search className="h-4 w-4" />
                    Search with Updated Names
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">{editedFrom || from}</span>
                  <span>→</span>
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">{editedTo || to}</span>
                </div>
                <button
                  onClick={() => setIsEditingStations(true)}
                  className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 px-2 py-1 rounded"
                  title="Edit station names for search"
                >
                  <Edit2 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              </div>
            )}
            
            {/* Date Picker */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-green-700" />
              <input
                type="date"
                value={journeyDate}
                onChange={(e) => setJourneyDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="border border-green-300 rounded px-2 py-1 bg-white text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <span className="text-xs text-green-600">
                {new Date(journeyDate).toLocaleDateString('en-US', { 
                  weekday: 'short',
                  day: 'numeric', 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </>
        )}

        {/* Seat Class Selector */}
        {!expanded && from && to && journeyDate && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-green-700">Class:</label>
              <select
                value={selectedSeatClass}
                onChange={(e) => setSelectedSeatClass(e.target.value)}
                className="text-sm border border-green-300 rounded px-2 py-1 bg-white"
              >
                {seatClasses.map(cls => (
                  <option key={cls.value} value={cls.value}>{cls.label}</option>
                ))}
              </select>
            </div>

            {/* Bearer Token Input */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setShowTokenInput(!showTokenInput)}
                className="text-xs text-green-600 hover:text-green-700 underline"
              >
                {showTokenInput ? '− Hide Token Input' : '+ Add Bearer Token (Optional)'}
              </button>
              
              {showTokenInput && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-green-700 font-medium mb-1">
                      Bearer Token (Authorization header):
                    </label>
                    <textarea
                      value={bearerToken}
                      onChange={(e) => setBearerToken(e.target.value)}
                      placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCJ9..."
                      className="w-full text-xs border border-green-300 rounded px-2 py-1 bg-white resize-none font-mono"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-green-700 font-medium mb-1">
                      Device ID (x-device-id header):
                    </label>
                    <input
                      type="text"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      placeholder="25ff16b9762a46b319f28b37e2a26c8e"
                      className="w-full text-xs border border-green-300 rounded px-2 py-1 bg-white font-mono"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-green-700 font-medium mb-1">
                      Device Key (x-device-key header):
                    </label>
                    <textarea
                      value={deviceKey}
                      onChange={(e) => setDeviceKey(e.target.value)}
                      placeholder="99c75c445104f3645838cd91f71f98673b6ecee0cdd7aeedeb15c1d24c2782e6..."
                      className="w-full text-xs border border-green-300 rounded px-2 py-1 bg-white resize-none font-mono"
                      rows={2}
                    />
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded p-2">
                    <p className="text-xs text-blue-900 font-semibold mb-1">💡 How to get these values:</p>
                    <ol className="text-xs text-blue-800 space-y-1 ml-4 list-decimal">
                      <li>Open https://eticket.railway.gov.bd/ and login</li>
                      <li>Press F12 → Network tab</li>
                      <li>Search for trains</li>
                      <li>Find "search-trips-v2" request</li>
                      <li>Copy: Authorization, x-device-id, x-device-key headers</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {expanded && results && Array.isArray(results) && (
        <div className="space-y-2 pt-2 border-t border-green-200">
          {results.length === 0 ? (
            <div className="text-center py-4 text-gray-600">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>No trains available for this route</p>
              <p className="text-sm mt-1">Try changing the date or seat class</p>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">
                {results.length} train{results.length > 1 ? 's' : ''} available
              </p>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.map((train, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg p-4 border hover:shadow-md transition-shadow"
                  >
                    {/* Train Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Train className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-bold text-base">{train.tripNumber}</p>
                          <p className="text-xs text-gray-500">
                            {train.originCity} → {train.destinationCity}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Clock className="h-3 w-3" />
                          <span>{train.travelTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Departure & Arrival */}
                    <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                      <div className="bg-blue-50 p-2 rounded">
                        <p className="text-xs text-gray-500 mb-1">Departure</p>
                        <p className="font-semibold text-blue-700">{train.departureDateTime}</p>
                        {train.boardingPoints && train.boardingPoints[0] && (
                          <p className="text-xs text-gray-600 mt-1">
                            {train.boardingPoints[0].name}
                          </p>
                        )}
                      </div>
                      
                      <div className="bg-green-50 p-2 rounded">
                        <p className="text-xs text-gray-500 mb-1">Arrival</p>
                        <p className="font-semibold text-green-700">{train.arrivalDateTime}</p>
                      </div>
                    </div>

                    {/* Seat Types */}
                    {train.seatTypes && train.seatTypes.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600 mb-2">Available Classes:</p>
                        
                        {train.seatTypes.map((seat, seatIdx) => (
                          <div
                            key={seatIdx}
                            className={`flex items-center justify-between p-2 rounded border ${
                              seat.availability.available 
                                ? 'bg-white border-gray-200' 
                                : 'bg-gray-50 border-gray-200 opacity-60'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{seat.typeName}</p>
                                {seat.availability.available ? (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                    <Users className="h-3 w-3 inline mr-1" />
                                    {seat.availability.online} seats
                                  </span>
                                ) : (
                                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                    Sold Out
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="font-bold text-green-600">
                                  ৳{seat.totalFare}
                                </p>
                                {seat.vatAmount > 0 && (
                                  <p className="text-xs text-gray-500">
                                    +VAT ৳{seat.vatAmount}
                                  </p>
                                )}
                              </div>
                              
                              {seat.availability.available && (
                                <button
                                  onClick={() => handleBookTrain(train, seat)}
                                  className="btn btn-sm bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Book
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
            </>
          )}
          
          <button
            onClick={() => setExpanded(false)}
            className="text-sm hover:underline w-full text-center pt-2"
            style={{ color: '#16a34a' }}
          >
            Hide Results
          </button>
        </div>
      )}
    </div>
  );
};

export default RailwaySearchWidget;
