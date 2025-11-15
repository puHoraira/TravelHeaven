import {
  BadgeCheck,
  CalendarCheck,
  Compass,
  Mail,
  MapPin,
  PenSquare,
  Phone,
  Shield,
  User as UserIcon,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './Profile.css';

const formatStatValue = (value) => {
  if (value === null || value === undefined) return '0';
  if (typeof value === 'number') return value.toLocaleString();
  return value;
};

const Profile = () => {
  const { user } = useAuthStore();

  if (!user) {
    return null;
  }

  const displayName = user.profile?.firstName || user.username || 'Traveler';
  const secondaryName = user.profile?.lastName || user.profile?.title || '';
  const initials = (displayName || 'T')[0]?.toUpperCase();

  const handleEditProfile = () => {
    toast('Profile editing coming soon', {
      position: 'bottom-center',
      icon: '🛠️',
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
    <div className="max-w-6xl mx-auto space-y-8">
      <section className="profile-header rounded-2xl overflow-hidden shadow-lg">
        {/* Cover Photo */}
        <div className="profile-cover">
          <div className="absolute -top-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 left-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          
          {/* Avatar positioned absolutely */}
          <div className="profile-avatar flex items-center justify-center rounded-2xl font-bold">
            {initials || 'T'}
          </div>
        </div>

        {/* Profile Info Section (White Background) */}
        <div className="profile-info-section">
          <div className="profile-details">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">{displayName}</h1>
                  {secondaryName && (
                    <span className="text-xl font-medium text-gray-600">{secondaryName}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-gray-600">
                  <span className="role-badge inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium">
                    <Shield size={14} />
                    {user.role}
                  </span>
                  {user.profile?.location && (
                    <span className="inline-flex items-center gap-2">
                      <Compass size={16} />
                      {user.profile.location}
                    </span>
                  )}
                  {user.guideInfo?.verificationStatus && (
                    <span className="inline-flex items-center gap-2">
                      <BadgeCheck size={16} />
                      {user.guideInfo.verificationStatus}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="profile-actions flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleEditProfile}
              className="btn btn-secondary flex items-center gap-2"
            >
              <PenSquare size={16} />
              Edit Profile
            </button>
            <Link to="/itineraries" className="btn btn-primary flex items-center gap-2">
              <MapPin size={16} />
              Manage Trips
            </Link>
            {user.role === 'guide' && (
              <Link to="/guide" className="btn btn-secondary flex items-center gap-2">
                <Users size={16} />
                Guide Dashboard
              </Link>
            )}
            {user.role === 'user' && (
              <Link to="/bookings" className="btn btn-secondary flex items-center gap-2">
                <CalendarCheck size={16} />
                View Bookings
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="stats-card rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{formatStatValue(value)}</p>
              </div>
              <div className="stats-icon rounded-full p-3">
                <Icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="info-card card">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            <button
              type="button"
              onClick={handleEditProfile}
              className="update-link text-sm font-medium"
            >
              Update
            </button>
          </div>
          <dl className="grid gap-4">
            {personalDetails.length === 0 ? (
              <p className="text-gray-500">Add details to complete your profile.</p>
            ) : (
              personalDetails.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-start gap-3">
                  <div className="detail-icon mt-0.5 rounded-lg p-2">
                    <Icon size={16} />
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{label}</dt>
                    <dd className="text-base text-gray-900">{value}</dd>
                  </div>
                </div>
              ))
            )}
          </dl>
        </div>

        <div className="info-card card">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Account Highlights</h2>
          <ul className="space-y-4">
            <li className="flex items-center gap-3 text-gray-600">
              <span className="highlight-bullet h-2 w-2 rounded-full" />
              Keep your profile up to date so guides and admins can reach you quickly.
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <span className="highlight-bullet h-2 w-2 rounded-full" />
              Explore public itineraries and subscribe to stay inspired for your next trip.
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <span className="highlight-bullet h-2 w-2 rounded-full" />
              Access role-specific dashboards using the quick action buttons above.
            </li>
          </ul>
        </div>
      </section>

      {guideDetails.length > 0 && (
        <section className="guide-info-card card">
          <h2 className="mb-6 text-xl font-semibold text-gray-900">Guide Information</h2>
          <dl className="grid gap-4 md:grid-cols-2">
            {guideDetails.map(({ label, value }) => (
              <div key={label}>
                <dt className="text-sm font-medium text-gray-500">{label}</dt>
                <dd className="text-base text-gray-900">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
};

export default Profile;
