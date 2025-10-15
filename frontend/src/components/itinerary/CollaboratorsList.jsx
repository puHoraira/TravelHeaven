import { Users, Eye, Edit, Crown } from 'lucide-react';

/**
 * CollaboratorsList Component - Displays and manages itinerary collaborators
 * Design Pattern: Observer Pattern - Collaborators observe itinerary changes
 * 
 * @param {Array} collaborators - Array of collaborator objects
 * @param {string} ownerId - Owner user ID
 * @param {Function} onRemove - Callback when removing collaborator (owner only)
 * @param {boolean} isOwner - Whether current user is owner
 */
export default function CollaboratorsList({ 
  collaborators = [], 
  ownerId, 
  onRemove, 
  isOwner = false 
}) {
  const getPermissionBadge = (permission) => {
    if (permission === 'edit') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          <Edit size={12} />
          Can Edit
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
        <Eye size={12} />
        View Only
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users className="text-blue-600" size={20} />
        <h3 className="text-lg font-semibold text-gray-900">
          Collaborators ({collaborators.length})
        </h3>
      </div>

      {collaborators.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <Users size={48} className="mx-auto mb-2 opacity-30" />
          <p>No collaborators yet</p>
          {isOwner && <p className="text-sm mt-1">Invite others to plan together</p>}
        </div>
      ) : (
        <div className="space-y-2">
          {collaborators.map((collab) => (
            <div
              key={collab.userId?._id || collab.userId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  {collab.userId?.name?.charAt(0).toUpperCase() || '?'}
                </div>

                {/* User Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {collab.userId?.name || 'Unknown User'}
                    </p>
                    {collab.userId?._id === ownerId && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                        <Crown size={12} />
                        Owner
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {collab.userId?.email || 'No email'}
                  </p>
                </div>
              </div>

              {/* Permission & Actions */}
              <div className="flex items-center gap-2">
                {getPermissionBadge(collab.permission)}
                
                {isOwner && collab.userId?._id !== ownerId && onRemove && (
                  <button
                    onClick={() => onRemove(collab.userId._id)}
                    className="text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
