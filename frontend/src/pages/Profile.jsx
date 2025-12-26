import {
  BadgeCheck,
  CalendarCheck,
  Camera,
  Check,
  Compass,
  Edit2,
  Mail,
  MapPin,
  PenSquare,
  Phone,
  Save,
  Shield,
  Star,
  TrendingUp,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { useAuthStore } from '../store/authStore';
import './Profile.css';

const formatStatValue = (value) => {
  if (value === null || value === undefined) return '0';
  if (typeof value === 'number') return value.toLocaleString();
  return value;
};

const Profile = () => {
  const { user, updateProfile } = useAuthStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    location: '',
    bio: '',
    // Guide-specific fields
    experience: '',
    availability: '',
    languages: [],
    specialties: [],
    priceMin: '',
    priceMax: '',
  });
  const [saving, setSaving] = useState(false);

  if (!user) {
    return null;
  }

  const displayName = user.profile?.firstName || user.username || 'Traveler';
  const secondaryName = user.profile?.lastName || user.profile?.title || '';
  const initials = (displayName || 'T')[0]?.toUpperCase();

  const handleEditProfile = () => {
    // Pre-fill the form with current data
    setEditData({
      firstName: user.profile?.firstName || '',
      lastName: user.profile?.lastName || '',
      phone: user.profile?.phone || '',
      location: user.profile?.location || '',
      bio: user.profile?.bio || '',
      experience: user.guideInfo?.experience || '',
      availability: user.guideInfo?.availability || '',
      languages: user.profile?.languages || [],
      specialties: user.profile?.specialties || [],
      priceMin: user.guideInfo?.priceRange?.min || '',
      priceMax: user.guideInfo?.priceRange?.max || '',
    });
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      const profile = {
        firstName: editData.firstName,
        lastName: editData.lastName,
        phone: editData.phone,
        location: editData.location,
        bio: editData.bio,
        languages: editData.languages,
        specialties: editData.specialties,
      };

      let guideInfo = null;
      // Add guide-specific data if user is a guide
      if (user.role === 'guide') {
        guideInfo = {
          experience: editData.experience,
          availability: editData.availability,
          priceRange: {
            min: parseInt(editData.priceMin) || 0,
            max: parseInt(editData.priceMax) || 0,
            currency: 'BDT',
          },
        };
      }

      const result = await updateProfile({ profile, guideInfo });
      
      if (result.success) {
        toast.success('Profile updated successfully!');
        setShowEditModal(false);
      } else {
        toast.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = (field, value) => {
    if (value.trim() && !editData[field].includes(value.trim())) {
      setEditData({ ...editData, [field]: [...editData[field], value.trim()] });
    }
  };

  const handleRemoveItem = (field, index) => {
    setEditData({
      ...editData,
      [field]: editData[field].filter((_, i) => i !== index),
    });
  };

  const stats = [
    {
      label: 'My Trips',
      value: user.profile?.stats?.itineraries ?? user.itineraryCount ?? 0,
      icon: MapPin,
    },
    {
      label: 'Bookings',
      value: user.profile?.stats?.bookings ?? user.bookingCount ?? 0,
      icon: CalendarCheck,
    },
    {
      label: 'Saved Plans',
      value: user.profile?.stats?.subscriptions ?? user.subscriptionCount ?? 0,
      icon: BadgeCheck,
    },
  ];

  const personalDetails = [
    { label: 'Username', value: user.username, icon: UserIcon },
    { label: 'Email', value: user.email, icon: Mail },
    { label: 'Role', value: user.role, icon: Shield },
    { label: 'First Name', value: user.profile?.firstName, icon: UserIcon },
    { label: 'Last Name', value: user.profile?.lastName, icon: UserIcon },
    { label: 'Phone', value: user.profile?.phone, icon: Phone },
    { label: 'Location', value: user.profile?.location, icon: Compass },
  ].filter((item) => item.value);

  const guideDetails = user.role === 'guide'
    ? [
        { label: 'Experience', value: user.guideInfo?.experience },
        { label: 'Availability', value: user.guideInfo?.availability },
        {
          label: 'Verification Status',
          value: user.guideInfo?.verificationStatus,
        },
        {
          label: 'Price Range',
          value: user.guideInfo?.priceRange
            ? `${user.guideInfo.priceRange.min ?? '-'} - ${user.guideInfo.priceRange.max ?? '-'} ${user.guideInfo.priceRange.currency ?? ''}`
            : undefined,
        },
      ].filter((item) => item.value)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="relative">
              <div className="w-40 h-40 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center flex-shrink-0 border-4 border-white/30 shadow-2xl">
                <span className="text-6xl font-bold text-white">{initials}</span>
              </div>
              <button className="absolute bottom-2 right-2 h-10 w-10 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-50 transition-all">
                <Camera className="w-5 h-5" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-5xl font-bold mb-3 drop-shadow-lg">
                {displayName} {secondaryName}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Shield className="h-5 w-5" />
                  <span className="font-semibold capitalize">{user.role}</span>
                </div>
                {user.profile?.location && (
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <MapPin className="h-5 w-5" />
                    <span>{user.profile.location}</span>
                  </div>
                )}
                {user.guideInfo?.verificationStatus === 'approved' && (
                  <div className="flex items-center gap-2 bg-green-500/90 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Check className="h-5 w-5" />
                    <span className="font-semibold">Verified</span>
                  </div>
                )}
              </div>

              {user.profile?.bio && (
                <p className="text-xl text-white/95 leading-relaxed max-w-3xl mb-6">
                  {user.profile.bio}
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleEditProfile}
                  className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
                >
                  <Edit2 className="w-5 h-5" />
                  Edit Profile
                </button>
                <Link
                  to="/itineraries"
                  className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-white/30 transition-all border-2 border-white/30"
                >
                  <MapPin className="w-5 h-5" />
                  Manage Trips
                </Link>
                {user.role === 'guide' && (
                  <Link
                    to="/guide"
                    className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-white/30 transition-all border-2 border-white/30"
                  >
                    <Users className="w-5 h-5" />
                    Guide Dashboard
                  </Link>
                )}
                {user.role === 'user' && (
                  <Link
                    to="/bookings"
                    className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold flex items-center gap-2 hover:bg-white/30 transition-all border-2 border-white/30"
                  >
                    <CalendarCheck className="w-5 h-5" />
                    View Bookings
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 mb-8">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-2">{label}</p>
                  <p className="text-4xl font-bold text-gray-900">{formatStatValue(value)}</p>
                </div>
                <div className="h-16 w-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                  <Icon className="w-8 h-8 text-blue-600" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                  Personal Information
                </h2>
                <button
                  onClick={handleEditProfile}
                  className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Update
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {personalDetails.length === 0 ? (
                  <p className="text-gray-500 col-span-2">Add details to complete your profile.</p>
                ) : (
                  personalDetails.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{label}</p>
                        <p className="text-lg font-semibold text-gray-900">{value}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Languages & Specialties */}
              {(user.profile?.languages?.length > 0 || user.profile?.specialties?.length > 0) && (
                <div className="mt-6 pt-6 border-t space-y-4">
                  {user.profile?.languages?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Languages</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.profile.languages.map((lang, idx) => (
                          <span key={idx} className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl font-medium border border-purple-200">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {user.profile?.specialties?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.profile.specialties.map((spec, idx) => (
                          <span key={idx} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-medium border border-blue-200">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Guide Information */}
            {guideDetails.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
                  Guide Information
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {guideDetails.map(({ label, value }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Star className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{label}</p>
                        <p className="text-lg font-semibold text-gray-900">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Account Highlights */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 border-2 border-blue-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Account Highlights</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-gray-700">
                  <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm">Keep your profile up to date so guides and admins can reach you quickly.</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <div className="h-6 w-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm">Explore public itineraries and subscribe to stay inspired for your next trip.</span>
                </li>
                <li className="flex items-start gap-3 text-gray-700">
                  <div className="h-6 w-6 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm">Access role-specific dashboards using the quick action buttons above.</span>
                </li>
              </ul>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">Account Type</span>
                  <span className="font-semibold text-gray-900 capitalize">{user.role}</span>
                </div>
                {user.guideInfo?.rating?.average > 0 && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <span className="text-gray-700">Rating</span>
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-gray-900">{user.guideInfo.rating.average.toFixed(1)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl my-8" onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Edit2 className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Edit Profile</h2>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-white hover:text-gray-200 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-blue-600" />
                  Basic Information
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      value={editData.firstName}
                      onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={editData.lastName}
                      onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={editData.phone}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={editData.location}
                      onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter location"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    <textarea
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tell us about yourself..."
                    />
                  </div>
                </div>
              </div>

              {/* Languages */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Languages</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editData.languages.map((lang, idx) => (
                    <span key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg border border-purple-300">
                      {lang}
                      <button
                        onClick={() => handleRemoveItem('languages', idx)}
                        className="hover:text-purple-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="language-input"
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add a language"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddItem('languages', e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('language-input');
                      handleAddItem('languages', input.value);
                      input.value = '';
                    }}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Specialties */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Specialties / Interests</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {editData.specialties.map((spec, idx) => (
                    <span key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg border border-blue-300">
                      {spec}
                      <button
                        onClick={() => handleRemoveItem('specialties', idx)}
                        className="hover:text-blue-900"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="specialty-input"
                    className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add a specialty"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddItem('specialties', e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById('specialty-input');
                      handleAddItem('specialties', input.value);
                      input.value = '';
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Guide-Specific Fields */}
              {user.role === 'guide' && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    Guide Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                      <input
                        type="text"
                        value={editData.experience}
                        onChange={(e) => setEditData({ ...editData, experience: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 5 years"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Availability</label>
                      <input
                        type="text"
                        value={editData.availability}
                        onChange={(e) => setEditData({ ...editData, availability: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Weekends"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Min Price (BDT/day)</label>
                      <input
                        type="number"
                        value={editData.priceMin}
                        onChange={(e) => setEditData({ ...editData, priceMin: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Minimum price"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Price (BDT/day)</label>
                      <input
                        type="number"
                        value={editData.priceMax}
                        onChange={(e) => setEditData({ ...editData, priceMax: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Maximum price"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-8 py-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
