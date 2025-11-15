import { Bus, Hotel, MapPin, Sparkles, Users, Compass } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import './Home.css';

const Home = () => {
  const { user } = useAuthStore();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

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
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="hero-section-red bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg p-8 text-white">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Travel Heaven, {user?.profile?.firstName || user?.username}!
        </h1>
        <p className="text-xl opacity-90">
          {user?.role === 'admin' && 'Manage approvals and oversee all activities'}
          {user?.role === 'guide' && 'Share amazing locations with travelers'}
          {user?.role === 'user' && 'Discover and book your next adventure'}
        </p>
      </div>

      {/* Stats/Features */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stats-card card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Locations</h3>
              <p className="text-sm text-gray-600">Discover destinations</p>
            </div>
          </div>
        </div>

        <div className="stats-card card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Hotel className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Hotels</h3>
              <p className="text-sm text-gray-600">Find accommodation</p>
            </div>
          </div>
        </div>

        <div className="stats-card card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bus className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Transportation</h3>
              <p className="text-sm text-gray-600">Travel with ease</p>
            </div>
          </div>
        </div>

        <div className="stats-card card hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Community</h3>
              <p className="text-sm text-gray-600">Join travelers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role-specific information */}
      <div className="info-card card">
        <div className="flex items-start gap-4">
          <Sparkles className="w-8 h-8 text-primary-600 flex-shrink-0" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {user?.role === 'admin' && 'Admin Dashboard'}
              {user?.role === 'guide' && 'Guide Dashboard'}
              {user?.role === 'user' && 'Start Your Journey'}
            </h2>

            {user?.role === 'admin' && (
              <div className="space-y-2">
                <p className="text-gray-600">As an admin, you can:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Review and approve guide submissions</li>
                  <li>Manage locations, hotels, and transportation</li>
                  <li>View system statistics and reports</li>
                  <li>Oversee all user activities</li>
                </ul>
              </div>
            )}

            {user?.role === 'guide' && (
              <div className="space-y-2">
                <p className="text-gray-600">As a guide, you can:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Add new tourist locations with images</li>
                  <li>List hotels for each location</li>
                  <li>Add transportation options</li>
                  <li>Track approval status of your submissions</li>
                </ul>
              </div>
            )}

            {user?.role === 'user' && (
              <div className="space-y-2">
                <p className="text-gray-600">As a tourist, you can:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Browse approved locations and destinations</li>
                  <li>Find hotels and accommodations</li>
                  <li>Check transportation options</li>
                  <li>Book services for your trip</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section card">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {user?.role === 'guide' && (
            <>
              <a href="/guide/locations" className="btn btn-primary text-center">
                Add Location
              </a>
              <a href="/guide/hotels" className="btn btn-primary text-center">
                Add Hotel
              </a>
              <a href="/guide/transport" className="btn btn-primary text-center">
                Add Transport
              </a>
            </>
          )}

          {user?.role === 'user' && (
            <>
              <a href="/locations" className="btn btn-primary text-center">
                Browse Locations
              </a>
              <a href="/hotels" className="btn btn-primary text-center">
                Find Hotels
              </a>
              <a href="/transportation" className="btn btn-primary text-center">
                View Transport
              </a>
            </>
          )}

          {user?.role === 'admin' && (
            <>
              <a href="/admin/approvals" className="btn btn-primary text-center">
                Pending Approvals
              </a>
              <a href="/admin" className="btn btn-primary text-center">
                View Statistics
              </a>
              <a href="/locations" className="btn btn-secondary text-center">
                Browse All
              </a>
            </>
          )}
        </div>
      </div>

      {/* AI Route Advisor - User Dashboard */}
      {user?.role === 'user' && (
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Compass className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Route Advisor</h2>
              <p className="text-sm text-gray-600">
                Get AI recommendations on how to travel between two places in Bangladesh using different transports.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g. Dhaka"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="e.g. Cox's Bazar"
                value={destination}
                onChange={e => setDestination(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={handleAskAI}
            className="btn btn-primary"
            disabled={aiLoading}
          >
            {aiLoading ? 'Thinking with AI...' : 'Ask AI for Route'}
          </button>

          {aiError && (
            <p className="mt-3 text-sm text-red-600">{aiError}</p>
          )}

          {aiResult && (
            <div className="mt-6 space-y-5">
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-xl p-5 border-l-4 border-primary-500">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-600" />
                  AI Recommendation
                </h3>
                <p className="text-gray-700">{aiResult.summary}</p>
              </div>

              <div className="grid gap-5">
                {aiResult.recommendedTransports?.map((t, idx) => (
                  <div key={idx} className="bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-4 text-white">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold capitalize">
                          {t.mode?.replace('_', ' ') || `Option ${idx + 1}`}
                        </h4>
                        <span className="bg-white text-primary-700 px-3 py-1 rounded-full text-sm font-semibold">
                          Option {idx + 1}
                        </span>
                      </div>
                    </div>

                    {/* Key Info Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-5 bg-gray-50 border-b">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Duration</p>
                        <p className="font-bold text-gray-900">
                          {t.estimatedDurationText || (t.estimatedDurationMinutes ? `${Math.floor(t.estimatedDurationMinutes / 60)}h ${t.estimatedDurationMinutes % 60}m` : 'N/A')}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Cost</p>
                        <p className="font-bold text-gray-900">{t.estimatedCostRange || 'N/A'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Stops</p>
                        <p className="font-bold text-gray-900">{t.numberOfStops ?? t.steps?.length ?? 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-1">Mode</p>
                        <p className="font-bold text-gray-900 capitalize">{t.mode || 'Mixed'}</p>
                      </div>
                    </div>

                    {/* Must-Visit Places */}
                    {Array.isArray(t.mustVisitPlaces) && t.mustVisitPlaces.length > 0 && (
                      <div className="px-5 py-4 bg-amber-50 border-b">
                        <h5 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Must-Visit Places
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {t.mustVisitPlaces.map((place, i) => (
                            <span key={i} className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-medium">
                              {place}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Steps */}
                    {Array.isArray(t.steps) && t.steps.length > 0 && (
                      <div className="px-5 py-4 border-b">
                        <h5 className="text-sm font-bold text-gray-900 mb-3">Journey Steps</h5>
                        <ol className="space-y-2">
                          {t.steps.map(step => (
                            <li key={step.order || `${idx}-${step.instruction}`} className="flex gap-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                                {step.order}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm text-gray-800">{step.instruction}</p>
                                {step.from && step.to && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {step.from} → {step.to} ({step.transportType})
                                  </p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Pros & Cons */}
                    <div className="grid md:grid-cols-2 gap-4 px-5 py-4">
                      {Array.isArray(t.pros) && t.pros.length > 0 && (
                        <div>
                          <p className="text-sm font-bold text-green-700 mb-2">✓ Pros</p>
                          <ul className="space-y-1">
                            {t.pros.map((p, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-green-500 mt-0.5">•</span>
                                <span>{p}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {Array.isArray(t.cons) && t.cons.length > 0 && (
                        <div>
                          <p className="text-sm font-bold text-red-700 mb-2">✗ Cons</p>
                          <ul className="space-y-1">
                            {t.cons.map((c, i) => (
                              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-red-500 mt-0.5">•</span>
                                <span>{c}</span>
                              </li>
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
      )}
    </div>
  );
};

export default Home;
