import { Link, useLocation } from 'react-router-dom';
import { Briefcase, MapPin, Hotel, Bus } from 'lucide-react';

const GuideNav = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinkClass = (path) => {
    return `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
      isActive(path)
        ? 'bg-purple-100 text-purple-700'
        : 'text-gray-600 hover:bg-gray-100'
    }`;
  };

  return (
    <>
      <Link to="/guide" className={navLinkClass('/guide')}>
        <Briefcase className="w-4 h-4" />
        Dashboard
      </Link>
      <Link to="/guide/locations" className={navLinkClass('/guide/locations')}>
        <MapPin className="w-4 h-4" />
        My Locations
      </Link>
      <Link to="/guide/hotels" className={navLinkClass('/guide/hotels')}>
        <Hotel className="w-4 h-4" />
        My Hotels
      </Link>
      <Link to="/guide/transport" className={navLinkClass('/guide/transport')}>
        <Bus className="w-4 h-4" />
        My Transport
      </Link>
      <Link to="/locations" className={navLinkClass('/locations')}>
        <MapPin className="w-4 h-4" />
        Browse
      </Link>
    </>
  );
};

export default GuideNav;
