import {
  AlertCircle,
  ArrowLeft,
  BedDouble,
  Bus,
  Calendar,
  Camera,
  Car,
  CheckCircle,
  Clock,
  Coffee,
  DollarSign,
  ExternalLink,
  Facebook,
  Globe,
  Info,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Plane,
  Ship,
  Star,
  Train,
  User,
  Users,
  Wifi,
  Wind,
  X,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../lib/api';
import { getImageUrlFromMixed } from '../lib/media';

const TransportIcon = ({ type, className = "h-5 w-5" }) => {
  const icons = {
    bus: Bus,
    train: Train,
    taxi: Car,
    'rental-car': Car,
    flight: Plane,
    boat: Ship,
    launch: Ship,
    cng: Car,
    rickshaw: Car,
  };
  const Icon = icons[type] || Bus;
  return <Icon className={className} />;
};

const TransportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [transport, setTransport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchTransport = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/transportation/${id}`);
        setTransport(data);
      } catch (error) {
        toast.error(error?.message || 'Failed to load transport details');
        navigate('/transportation');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTransport();
    }
  }, [id, navigate]);

  const getImageUrl = (image) => getImageUrlFromMixed(image);

  const facilityIcons = {
    ac: Wind,
    wifi: Wifi,
    toilet: Info,
    tv: Info,
    charging: Zap,
    'charging-port': Zap,
    blanket: Info,
    snacks: Coffee,
    water: Coffee,
    music: Info,
    'reclining-seat': BedDouble,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Loading transport details...</p>
      </div>
    );
  }

  if (!transport) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-gray-600">Transport not found</p>
        <button onClick={() => navigate('/transportation')} className="mt-4 text-blue-600 hover:underline">
          Back to Transportation
        </button>
      </div>
    );
  }

  const hasImages = transport.images && transport.images.length > 0;
  const hasRoute = transport.route?.from?.name && transport.route?.to?.name;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      {hasImages ? (
        <div className="relative h-[60vh] overflow-hidden bg-gray-900">
          <img 
            src={getImageUrl(transport.images[currentImageIndex])} 
            alt={transport.name}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Back Button */}
          <button 
            onClick={() => navigate('/transportation')} 
            className="absolute top-6 left-6 h-12 w-12 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-all text-white shadow-lg"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Image Counter */}
          {transport.images.length > 1 && (
            <div className="absolute top-6 right-6 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
              <Camera className="h-5 w-5" />
              <span className="font-medium">{currentImageIndex + 1} / {transport.images.length}</span>
            </div>
          )}

          {/* Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <TransportIcon type={transport.type} className="h-8 w-8" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold drop-shadow-lg">{transport.name}</h1>
                      {transport.operator?.name && (
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-lg text-white/90">{transport.operator.name}</span>
                          {transport.operator.verified && (
                            <CheckCircle className="h-5 w-5 text-green-400" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3">
                    {transport.averageRating > 0 && (
                      <div className="flex items-center gap-2 bg-yellow-500/90 backdrop-blur-sm px-4 py-2 rounded-full">
                        <Star className="h-5 w-5" fill="currentColor" />
                        <span className="font-bold text-lg">{transport.averageRating.toFixed(1)}</span>
                        <span className="text-white/90">({transport.totalReviews} reviews)</span>
                      </div>
                    )}
                    <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-lg capitalize font-medium">
                      {transport.type.replace('-', ' ')}
                    </span>
                    {transport.operator?.type && (
                      <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-lg capitalize">
                        {transport.operator.type} Operator
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Image Navigation */}
          {transport.images.length > 1 && (
            <div className="absolute bottom-28 left-0 right-0">
              <div className="max-w-7xl mx-auto px-8">
                <div className="flex gap-2 justify-center">
                  {transport.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`h-2 rounded-full transition-all ${
                        idx === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/75'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-[60vh] bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="h-32 w-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6">
              <TransportIcon type={transport.type} className="h-20 w-20" />
            </div>
            <h1 className="text-5xl font-bold mb-3 drop-shadow-lg">{transport.name}</h1>
            {transport.operator?.name && (
              <p className="text-2xl text-white/90">{transport.operator.name}</p>
            )}
          </div>
          <button 
            onClick={() => navigate('/transportation')} 
            className="absolute top-6 left-6 h-12 w-12 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center transition-all text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Left Column: Main Info */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Route Info */}
            {hasRoute && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                  Route Information
                </h2>
                
                <div className="relative">
                  {/* From */}
                  <div className="flex items-start gap-4 mb-8">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">Starting Point</p>
                      <p className="text-xl font-bold text-gray-900">{transport.route.from.name}</p>
                      {transport.route.from.address && (
                        <p className="text-gray-600 mt-1">{transport.route.from.address}</p>
                      )}
                    </div>
                  </div>

                  {/* Connecting Line */}
                  <div className="absolute left-6 top-14 bottom-14 w-0.5 bg-gradient-to-b from-blue-300 to-purple-300"></div>

                  {/* Stops */}
                  {transport.route.stops && transport.route.stops.length > 0 && (
                    <div className="space-y-6 mb-8">
                      {transport.route.stops.map((stop, idx) => (
                        <div key={idx} className="flex items-start gap-4 relative">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 bg-purple-50 rounded-lg flex items-center justify-center border-2 border-purple-200">
                              <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                            </div>
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p className="font-semibold text-gray-800">{stop.name}</p>
                            {stop.estimatedArrival && (
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {stop.estimatedArrival}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* To */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-1">Destination</p>
                      <p className="text-xl font-bold text-gray-900">{transport.route.to.name}</p>
                      {transport.route.to.address && (
                        <p className="text-gray-600 mt-1">{transport.route.to.address}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Distance & Duration */}
                {(transport.route.distance?.value || transport.route.duration?.estimated) && (
                  <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
                    {transport.route.distance?.value && (
                      <div className="bg-blue-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                          <Navigation className="h-5 w-5" />
                          <span className="text-sm font-medium">Distance</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {transport.route.distance.value} {transport.route.distance.unit}
                        </p>
                      </div>
                    )}
                    {transport.route.duration?.estimated && (
                      <div className="bg-purple-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-purple-600 mb-2">
                          <Clock className="h-5 w-5" />
                          <span className="text-sm font-medium">Duration</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                          {transport.route.duration.estimated}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* About */}
            {transport.description && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                  About This Service
                </h2>
                <p className="text-gray-700 text-lg leading-relaxed">{transport.description}</p>
              </div>
            )}

            {/* Schedule */}
            {transport.schedule && (transport.schedule.departures?.length > 0 || transport.schedule.operatingHours) && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                  Schedule & Timings
                </h2>

                {transport.schedule.operatingHours && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">Operating Hours</span>
                    </div>
                    <p className="text-lg text-gray-800 ml-7">{transport.schedule.operatingHours}</p>
                  </div>
                )}

                {transport.schedule.frequency && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">Frequency</span>
                    </div>
                    <p className="text-lg text-gray-800 ml-7">{transport.schedule.frequency}</p>
                  </div>
                )}

                {transport.schedule.departures && transport.schedule.departures.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-gray-700 mb-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold">Departure Times</span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {transport.schedule.departures.map((time, idx) => (
                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-center">
                          <span className="font-mono font-semibold text-blue-900">{time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {transport.schedule.daysOfWeek && transport.schedule.daysOfWeek.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold">Operating Days:</span> {transport.schedule.daysOfWeek.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Facilities & Amenities */}
            {transport.facilities && transport.facilities.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                  Facilities & Amenities
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {transport.facilities.map((facility, idx) => {
                    const Icon = facilityIcons[facility] || Info;
                    return (
                      <div key={idx} className="flex items-center gap-3 bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <span className="font-medium text-gray-800 capitalize">{facility.replace('-', ' ')}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price Classes */}
            {transport.pricing?.classes && transport.pricing.classes.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                  Available Classes
                </h2>
                <div className="space-y-4">
                  {transport.pricing.classes.map((cls, idx) => (
                    <div key={idx} className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-bold text-gray-900">{cls.name}</h3>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-blue-600">
                            {cls.price}
                            <span className="text-lg text-gray-600 ml-1">{transport.pricing.currency}</span>
                          </div>
                          <div className="text-xs text-gray-500">{transport.pricing.priceType}</div>
                        </div>
                      </div>
                      {cls.facilities && cls.facilities.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {cls.facilities.map((f, i) => (
                            <span key={i} className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full border border-green-200">
                              ✓ {f}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Pricing Card */}
            {transport.pricing && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-6 border-2 border-green-200">
                <div className="flex items-center gap-2 text-green-700 mb-4">
                  <DollarSign className="h-6 w-6" />
                  <h3 className="text-xl font-bold">Pricing</h3>
                </div>
                <div className="mb-4">
                  <div className="text-4xl font-bold text-gray-900">
                    {transport.pricing.amount}
                    <span className="text-xl text-gray-600 ml-2">{transport.pricing.currency}</span>
                  </div>
                  <p className="text-gray-600 mt-1 capitalize">{transport.pricing.priceType}</p>
                </div>
                {transport.pricing.priceNote && (
                  <p className="text-sm text-gray-600 italic bg-white/50 rounded-lg p-3 border border-green-100">
                    {transport.pricing.priceNote}
                  </p>
                )}
              </div>
            )}

            {/* Booking Card */}
            {transport.booking && (transport.booking.onlineUrl || transport.booking.phoneNumbers?.length > 0) && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Book This Service</h3>
                <div className="space-y-3">
                  {transport.booking.onlineUrl && (
                    <a
                      href={transport.booking.onlineUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      <ExternalLink className="h-5 w-5" />
                      Book Online
                    </a>
                  )}
                  {transport.booking.phoneNumbers && transport.booking.phoneNumbers.map((phone, idx) => (
                    <a
                      key={idx}
                      href={`tel:${phone}`}
                      className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                    >
                      <Phone className="h-5 w-5" />
                      {phone}
                    </a>
                  ))}
                </div>
                {transport.booking.instructions && (
                  <p className="text-sm text-gray-600 mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Info className="h-4 w-4 inline mr-1" />
                    {transport.booking.instructions}
                  </p>
                )}
              </div>
            )}

            {/* Contact Card */}
            {transport.contactInfo && (
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {transport.contactInfo.phone && transport.contactInfo.phone.map((phone, idx) => (
                    <a key={idx} href={`tel:${phone}`} className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors p-3 rounded-lg hover:bg-blue-50">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Phone</div>
                        <div className="font-medium">{phone}</div>
                      </div>
                    </a>
                  ))}
                  {transport.contactInfo.email && (
                    <a href={`mailto:${transport.contactInfo.email}`} className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors p-3 rounded-lg hover:bg-blue-50">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Email</div>
                        <div className="font-medium text-sm">{transport.contactInfo.email}</div>
                      </div>
                    </a>
                  )}
                  {transport.contactInfo.website && (
                    <a href={transport.contactInfo.website} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors p-3 rounded-lg hover:bg-blue-50">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Globe className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Website</div>
                        <div className="font-medium text-sm flex items-center gap-1">
                          Visit Website
                          <ExternalLink className="w-3 h-3" />
                        </div>
                      </div>
                    </a>
                  )}
                  {transport.contactInfo.whatsapp && (
                    <a 
                      href={`https://wa.me/${transport.contactInfo.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 text-gray-700 hover:text-green-600 transition-colors p-3 rounded-lg hover:bg-green-50"
                    >
                      <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">WhatsApp</div>
                        <div className="font-medium">{transport.contactInfo.whatsapp}</div>
                      </div>
                    </a>
                  )}
                  {transport.contactInfo.facebook && (
                    <a href={transport.contactInfo.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-700 hover:text-blue-600 transition-colors p-3 rounded-lg hover:bg-blue-50">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Facebook className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Facebook</div>
                        <div className="font-medium text-sm">View Page</div>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Capacity Card */}
            {transport.capacity && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 border-2 border-purple-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Capacity</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="text-gray-700">Total Seats</span>
                    </div>
                    <span className="font-bold text-lg text-purple-600">{transport.capacity.total}</span>
                  </div>
                  {transport.capacity.available !== undefined && (
                    <div className="flex items-center justify-between p-3 bg-white/70 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="text-gray-700">Available</span>
                      </div>
                      <span className="font-bold text-lg text-green-600">{transport.capacity.available}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stats Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border-2 border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                {transport.viewCount > 0 && (
                  <div className="flex items-center justify-between p-2">
                    <span className="text-gray-600">Views</span>
                    <span className="font-bold text-lg text-blue-600">{transport.viewCount}</span>
                  </div>
                )}
                {transport.bookingCount > 0 && (
                  <div className="flex items-center justify-between p-2">
                    <span className="text-gray-600">Bookings</span>
                    <span className="font-bold text-lg text-green-600">{transport.bookingCount}</span>
                  </div>
                )}
                {transport.totalReviews > 0 && (
                  <div className="flex items-center justify-between p-2">
                    <span className="text-gray-600">Reviews</span>
                    <span className="font-bold text-lg text-purple-600">{transport.totalReviews}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportDetail;
