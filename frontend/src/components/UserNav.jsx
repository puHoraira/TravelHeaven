import { Link, useLocation } from 'react-router-dom';
import { Home, Map, MapPin, Hotel, Users, Bus, Train, Calendar, Sparkles, ChevronDown } from 'lucide-react';

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

  const isAnyActive = (paths) => paths.some((path) => isActive(path));

  const navGroupClass = (paths) => {
    const active = isAnyActive(paths);
    return `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors cursor-pointer list-none ${
      active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
    }`;
  };

  const closeParentDetails = (event) => {
    const details = event?.currentTarget?.closest('details');
    if (details) details.removeAttribute('open');
  };

  return (
    <>
      <Link to="/home" className={navLinkClass('/home')}>
        <Home className="w-4 h-4" />
        Home
      </Link>
      <Link to="/recommendations" className={navLinkClass('/recommendations')}>
        <Sparkles className="w-4 h-4" />
        Smart Recommendations
      </Link>

      <details className="relative">
        <summary className={navGroupClass(['/itineraries', '/itineraries/public'])}>
          <Map className="w-4 h-4" />
          Trips
          <ChevronDown className="ml-1 h-4 w-4" />
        </summary>
        <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
          <Link
            to="/itineraries"
            className={navLinkClass('/itineraries')}
            onClick={closeParentDetails}
          >
            <Map className="w-4 h-4" />
            My Trips
          </Link>
          <Link
            to="/itineraries/public"
            className={navLinkClass('/itineraries/public')}
            onClick={closeParentDetails}
          >
            <MapPin className="w-4 h-4" />
            Explore
          </Link>
        </div>
      </details>

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

      <details className="relative">
        <summary className={navGroupClass(['/transportation', '/railway', '/trains'])}>
          <Bus className="w-4 h-4" />
          Transport
          <ChevronDown className="ml-1 h-4 w-4" />
        </summary>
        <div className="absolute left-0 top-full z-20 mt-2 w-60 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
          <Link
            to="/transportation"
            className={navLinkClass('/transportation')}
            onClick={closeParentDetails}
          >
            <Bus className="w-4 h-4" />
            Transportation
          </Link>
          <Link
            to="/railway"
            className={navLinkClass('/railway')}
            onClick={closeParentDetails}
          >
            <Train className="w-4 h-4" />
            BD Railway
          </Link>
          <Link
            to="/trains"
            className={navLinkClass('/trains')}
            onClick={closeParentDetails}
          >
            <Train className="w-4 h-4" />
            All Trains
          </Link>
        </div>
      </details>

      <Link to="/bookings" className={navLinkClass('/bookings')}>
        <Calendar className="w-4 h-4" />
        Bookings
      </Link>
    </>
  );
};

export default UserNav;
