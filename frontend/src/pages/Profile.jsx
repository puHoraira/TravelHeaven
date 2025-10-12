import { useAuthStore } from '../store/authStore';

const Profile = () => {
  const { user } = useAuthStore();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <p className="text-gray-900">{user?.username}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <p className="text-gray-900">{user?.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
              {user?.role}
            </span>
          </div>

          {user?.profile && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <p className="text-gray-900">{user.profile.firstName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <p className="text-gray-900">{user.profile.lastName}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
