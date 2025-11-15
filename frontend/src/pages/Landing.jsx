import { Briefcase, Bus, Heart, Hotel, MapPin, Shield, Star, TrendingUp, UserCircle, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header with Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-50 header-nav">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MapPin className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">Travel Heaven</span>
            </div>
            
            {/* Navigation with Login Buttons */}
            <nav className="flex items-center gap-4">
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium transition-colors"
              >
                <UserCircle className="w-5 h-5" />
                Tourist Login
              </Link>
              <Link
                to="/guide/login"
                className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg font-medium transition-colors"
              >
                <Briefcase className="w-5 h-5" />
                Guide Login
              </Link>
              <Link
                to="/admin/login"
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
              >
                <Shield className="w-5 h-5" />
                Admin Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Sign Up
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="hero-title text-5xl font-bold text-gray-900 mb-6">
            Your Journey Starts Here
          </h1>
          <p className="hero-subtitle text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Discover amazing destinations, plan your perfect trip, and connect with expert travel guides. 
            Travel Heaven makes your travel dreams come true.
          </p>
          
          <div className="hero-cta mt-10 flex flex-col items-center gap-4">
            <p className="text-gray-600 text-lg">
              Join our community to explore destinations, collaborate with guides, and plan unforgettable trips.
            </p>
            <Link
              to="/register"
              className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium text-lg shadow-lg"
            >
              Create Your Account
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section max-w-full py-16 overflow-hidden">
        <h2 className="section-header text-3xl font-bold text-center text-gray-900 mb-12 px-4">
          What Travel Heaven Offers
        </h2>
        <div className="features-container">
          {/* First set of cards */}
          <div className="feature-card">
            <div className="feature-icon w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Amazing Locations
            </h3>
            <p className="text-gray-600">
              Discover curated travel destinations from experienced guides around the world.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Hotel className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Best Hotels
            </h3>
            <p className="text-gray-600">
              Find the perfect accommodation with verified reviews and ratings.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Bus className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Easy Transportation
            </h3>
            <p className="text-gray-600">
              Access comprehensive transportation options for seamless travel.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Expert Guides
            </h3>
            <p className="text-gray-600">
              Connect with verified travel guides and plan your perfect itinerary.
            </p>
          </div>

          {/* Duplicate set for infinite loop effect */}
          <div className="feature-card">
            <div className="feature-icon w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Amazing Locations
            </h3>
            <p className="text-gray-600">
              Discover curated travel destinations from experienced guides around the world.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Hotel className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Best Hotels
            </h3>
            <p className="text-gray-600">
              Find the perfect accommodation with verified reviews and ratings.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Bus className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Easy Transportation
            </h3>
            <p className="text-gray-600">
              Access comprehensive transportation options for seamless travel.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Expert Guides
            </h3>
            <p className="text-gray-600">
              Connect with verified travel guides and plan your perfect itinerary.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="section-header text-3xl font-bold text-center mb-12">
            Why Choose Travel Heaven?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="benefit-item text-center">
              <Star className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Verified Reviews</h3>
              <p className="text-blue-100">
                Read authentic reviews from real travelers to make informed decisions.
              </p>
            </div>

            <div className="benefit-item text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Trip Planning</h3>
              <p className="text-blue-100">
                Create and share detailed itineraries with collaborative tools.
              </p>
            </div>

            <div className="benefit-item text-center">
              <Shield className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Trusted Platform</h3>
              <p className="text-blue-100">
                All content is verified and approved by our admin team for quality.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="section-header text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="how-it-works-step text-center">
            <div className="step-number w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Sign Up Free
            </h3>
            <p className="text-gray-600">
              Create your account and join our community of travelers.
            </p>
          </div>

          <div className="how-it-works-step text-center">
            <div className="step-number w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Explore & Plan
            </h3>
            <p className="text-gray-600">
              Browse destinations, find guides, and create your trip itinerary.
            </p>
          </div>

          <div className="how-it-works-step text-center">
            <div className="step-number w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Travel & Share
            </h3>
            <p className="text-gray-600">
              Experience amazing trips and share your stories with others.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <Heart className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">
            Ready to Start Your Adventure?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of travelers who trust Travel Heaven for their journeys.
          </p>
          <Link
            to="/register"
            className="cta-button inline-block px-8 py-3 rounded-lg font-medium text-lg shadow-lg"
          >
            Create Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="w-6 h-6 text-blue-400" />
            <span className="text-xl font-bold text-white">Travel Heaven</span>
          </div>
          <p>© 2025 Travel Heaven. Your trusted travel companion.</p>
          <p className="mt-2 text-sm text-gray-400">
            Tourist Helper System with Software Design Patterns
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
