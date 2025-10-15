import { Link, useLocation } from 'react-router-dom';
import { Shield, MapPin, Hotel, Bus, Users, UserCheck } from 'lucide-react';

const AdminNav = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navLinkClass = (path) => {
    return `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
      isActive(path)
        ? 'bg-red-100 text-red-700'
        : 'text-gray-600 hover:bg-gray-100'
    }`;
  };

  return (
    <>
      <Link to="/admin" className={navLinkClass('/admin')}>
        <Shield className="w-4 h-4" />
        Dashboard
      </Link>
      <Link to="/admin/approvals" className={navLinkClass('/admin/approvals')}>
        <Shield className="w-4 h-4" />
        Approvals
      </Link>
      <Link to="/admin/guide-verifications" className={navLinkClass('/admin/guide-verifications')}>
        <UserCheck className="w-4 h-4" />
        Guide Verifications
      </Link>
      <Link to="/locations" className={navLinkClass('/locations')}>
        <MapPin className="w-4 h-4" />
        All Locations
      </Link>
      <Link to="/hotels" className={navLinkClass('/hotels')}>
        <Hotel className="w-4 h-4" />
        All Hotels
      </Link>
      <Link to="/transportation" className={navLinkClass('/transportation')}>
        <Bus className="w-4 h-4" />
        All Transport
      </Link>
      <Link to="/guides" className={navLinkClass('/guides')}>
        <Users className="w-4 h-4" />
        All Guides
      </Link>
    </>
  );
};

export default AdminNav;
