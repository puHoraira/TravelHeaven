import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';

const API_PREFIX = import.meta.env.VITE_API_URL || '/api';
const FILE_BASE_URL = import.meta.env.VITE_FILE_BASE_URL
  || (API_PREFIX.startsWith('http') ? API_PREFIX.replace(/\/api$/, '') : 'http://localhost:5000');

const GuideVerifications = () => {
  const [pendingGuides, setPendingGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPendingGuides();
  }, []);

  const getErrorMessage = (error, fallback) => {
    if (!error) return fallback;
    if (typeof error === 'string') return error;
    return error.message || error.error || error.response?.data?.message || fallback;
  };

  const resolveDocumentUrl = (doc) => {
    if (!doc) return null;

    const raw = doc.url || doc.path || doc.diskPath;
    if (!raw && doc.filename) {
      return `${FILE_BASE_URL}/uploads/${doc.filename}`;
    }

    if (!raw) return null;

    if (/^https?:\/\//i.test(raw)) {
      return raw;
    }

    const cleaned = raw.replace(/\\/g, '/');
    const uploadsIndex = cleaned.lastIndexOf('uploads');
    const relativePath = uploadsIndex !== -1
      ? cleaned.slice(uploadsIndex)
      : cleaned.replace(/^\/?/, '');

    return `${FILE_BASE_URL}/${relativePath.replace(/^\/?/, '')}`;
  };

  const fetchPendingGuides = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/pending-guides');
      const payload = response?.data ?? response;
      const guides = payload?.guides ?? payload?.data?.guides ?? [];
      setPendingGuides(guides);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch pending guides'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (guideId) => {
    if (!window.confirm('Are you sure you want to approve this guide?')) return;

    try {
      const response = await api.post(`/admin/approve-guide/${guideId}`);
      const payload = response?.data ?? response;
      const message = payload?.message || 'Guide approved successfully';
      toast.success(message);
      fetchPendingGuides();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to approve guide'));
    }
  };

  const handleReject = async (guideId) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      const response = await api.post(`/admin/reject-guide/${guideId}`, { reason });
      const payload = response?.data ?? response;
      const message = payload?.message || 'Guide rejected successfully';
      toast.success(message);
      fetchPendingGuides();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to reject guide'));
    }
  };

  const openDocumentModal = (guide) => {
    setSelectedGuide(guide);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedGuide(null);
    setShowModal(false);
  };

  const selectedDocumentUrl = resolveDocumentUrl(selectedGuide?.guideInfo?.verificationDocument);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Guide Verifications
      </h1>

      {pendingGuides.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 text-lg">No pending guide verifications</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingGuides.map((guide) => (
            <div
              key={guide._id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {guide.profile.firstName} {guide.profile.lastName}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Username</p>
                      <p className="font-medium">{guide.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{guide.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{guide.profile.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Experience</p>
                      <p className="font-medium">{guide.guideInfo.experience || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Verification Document</p>
                    <p className="font-medium text-blue-600">
                      {guide.guideInfo.verificationDocument?.originalName || 'No document'}
                    </p>
                    <p className="text-xs text-gray-500">
                      Uploaded: {new Date(guide.guideInfo.verificationDocument?.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => openDocumentModal(guide)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      View Document
                    </button>
                    <button
                      onClick={() => handleApprove(guide._id)}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(guide._id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                </div>

                <div className="ml-4">
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    Pending
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Modal */}
      {showModal && selectedGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Verification Document - {selectedGuide.profile.firstName} {selectedGuide.profile.lastName}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              {selectedDocumentUrl ? (
                <iframe
                  src={selectedDocumentUrl}
                  className="w-full h-[600px] border border-gray-300 rounded"
                  title="Verification Document"
                />
              ) : (
                <div className="flex h-[300px] items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50">
                  <p className="text-gray-500">Document preview unavailable. Download from admin storage.</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleApprove(selectedGuide._id);
                  closeModal();
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Approve Guide
              </button>
              <button
                onClick={() => {
                  handleReject(selectedGuide._id);
                  closeModal();
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Reject Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuideVerifications;
