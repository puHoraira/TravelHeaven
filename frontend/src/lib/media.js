const API_URL = import.meta.env.VITE_API_URL || '/api';

const normalizeApiBase = (apiUrl) => {
  // If API_URL ends with '/api', strip it to get server origin/base.
  // Examples:
  //  - '/api' -> '' (same origin)
  //  - 'http://localhost:5000/api' -> 'http://localhost:5000'
  //  - 'https://myapp.com/api' -> 'https://myapp.com'
  if (!apiUrl) return '';
  if (apiUrl === '/api') return '';
  return apiUrl.replace(/\/api\/?$/, '');
};

const API_BASE = normalizeApiBase(API_URL);

export const getFileUrl = (fileIdOrPath) => {
  if (!fileIdOrPath) return null;

  // If already absolute URL
  if (typeof fileIdOrPath === 'string' && fileIdOrPath.startsWith('http')) {
    return fileIdOrPath;
  }

  // Data/blob URLs (client-side previews)
  if (typeof fileIdOrPath === 'string' && (fileIdOrPath.startsWith('data:') || fileIdOrPath.startsWith('blob:'))) {
    return fileIdOrPath;
  }

  // If it is already a /api/files/... path
  if (typeof fileIdOrPath === 'string' && fileIdOrPath.startsWith('/api/')) {
    return `${API_BASE}${fileIdOrPath}`;
  }

  // If it is an absolute /uploads/... or other server path
  if (typeof fileIdOrPath === 'string' && fileIdOrPath.startsWith('/')) {
    return `${API_BASE}${fileIdOrPath}`;
  }

  // Otherwise assume it's a file ID
  return `${API_BASE}/api/files/${fileIdOrPath}`;
};

export const getImageUrlFromMixed = (image) => {
  if (!image) return null;

  // Common direct URL shape
  if (typeof image === 'object' && typeof image.url === 'string') {
    return getFileUrl(image.url);
  }

  // Common direct path shape
  if (typeof image === 'object' && typeof image.path === 'string') {
    return getFileUrl(image.path);
  }

  // MongoDB file reference objects
  if (typeof image === 'object' && image.file) {
    const file = image.file;
    const fileId = typeof file === 'object'
      ? (file._id || file.id || file.toString?.())
      : file;
    return getFileUrl(fileId);
  }

  // Legacy string paths
  if (typeof image === 'string') {
    return getFileUrl(image);
  }

  return null;
};
