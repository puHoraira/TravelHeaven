import { Link, useLocation } from 'react-router-dom';
import { Home, Map, MapPin, Hotel, Users, Bus, Train, Calendar } from 'lucide-react';

const UserNav = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinkClass = (path) => {
    return `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
      isActive(path)
        ? 'bg-blue-100 text-blue-700'
        : 'text-gray-600 hover:bg-gray-100'
    }`;
  };

  return (
    <>
      <Link to="/home" className={navLinkClass('/home')}>
        <Home className="w-4 h-4" />
        Home
      </Link>
      <Link to="/itineraries" className={navLinkClass('/itineraries')}>
        <Map className="w-4 h-4" />
        My Trips
      </Link>
      <Link to="/itineraries/public" className={navLinkClass('/itineraries/public')}>
        <MapPin className="w-4 h-4" />
        Explore
      </Link>
      <Link to="/locations" className={navLinkClass('/locations')}>
        <MapPin className="w-4 h-4" />
        Locations
      </Link>
      <Link to="/hotels" className={navLinkClass('/hotels')}>
        <Hotel className="w-4 h-4" />
        Hotels
      </Link>
      <Link to="/guides" className={navLinkClass('/guides')}>
        <Users className="w-4 h-4" />
        Guides
      </Link>
      <Link to="/transportation" className={navLinkClass('/transportation')}>
        <Bus className="w-4 h-4" />
        Transportation
      </Link>
      <Link to="/railway" className={navLinkClass('/railway')}>
        <Train className="w-4 h-4" />
        BD Railway
      </Link>
      <Link to="/trains" className={navLinkClass('/trains')}>
        <Train className="w-4 h-4" />
        All Trains
      </Link>
      <Link to="/bookings" className={navLinkClass('/bookings')}>
        <Calendar className="w-4 h-4" />
        Bookings
      </Link>
    </>
  );
};

export default UserNav;
