import File from '../models/File.js';

/**
 * Helper functions for working with MongoDB file storage
 */

/**
 * Process uploaded images and return array of file references
 * @param {Array} files - Array of uploaded files from multer
 * @param {String} userId - ID of the user uploading
 * @param {Object} relatedTo - Object with model and id for relating files
 * @returns {Array} Array of objects with file ID and caption
 */
export const processImageUploads = async (files, userId, relatedTo = null) => {
  if (!files || files.length === 0) return [];

  const fileRefs = [];

  for (const file of files) {
    const fileDoc = new File({
      filename: `${Date.now()}-${file.originalname}`,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      data: file.buffer,
      encoding: file.encoding,
      uploadedBy: userId,
      relatedTo,
    });

    await fileDoc.save();

    fileRefs.push({
      file: fileDoc._id,
      caption: file.caption || '',
    });
  }

  return fileRefs;
};

/**
 * Process single file upload and return file ID
 * @param {Object} file - Single uploaded file from multer
 * @param {String} userId - ID of the user uploading
 * @param {Object} relatedTo - Object with model and id for relating file
 * @returns {String} File ID
 */
export const processSingleFileUpload = async (file, userId, relatedTo = null) => {
  if (!file) return null;

  const fileDoc = new File({
    filename: `${Date.now()}-${file.originalname}`,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    data: file.buffer,
    encoding: file.encoding,
    uploadedBy: userId,
    relatedTo,
  });

  await fileDoc.save();
  return fileDoc._id;
};

/**
 * Delete file from MongoDB
 * @param {String} fileId - ID of file to delete
 */
export const deleteFileById = async (fileId) => {
  await File.findByIdAndDelete(fileId);
};

/**
 * Delete multiple files from MongoDB
 * @param {Array} fileIds - Array of file IDs to delete
 */
export const deleteMultipleFiles = async (fileIds) => {
  await File.deleteMany({ _id: { $in: fileIds } });
};

/**
 * Get file URL by ID
 * @param {String} fileId - File ID
 * @returns {String} File URL
 */
export const getFileUrl = (fileId) => {
  return `/api/files/${fileId}`;
};

/**
 * Populate file references in a document
 * @param {Object} doc - Mongoose document
 * @param {String} path - Path to populate (e.g., 'images.file')
 * @returns {Object} Populated document
 */
export const populateFiles = async (doc, path) => {
  return await doc.populate(path);
};

/**
 * Update file relation metadata
 * @param {String} fileId - File ID
 * @param {Object} relatedTo - Object with model and id
 */
export const updateFileRelation = async (fileId, relatedTo) => {
  await File.findByIdAndUpdate(fileId, { relatedTo });
};

/**
 * Get file as base64 data URL
 * @param {String} fileId - File ID
 * @returns {String} Base64 data URL
 */
export const getFileAsDataURL = async (fileId) => {
  const file = await File.findById(fileId);
  if (!file) return null;
  return file.toDataURL();
};

/**
 * Validate file type
 * @param {String} mimetype - File mimetype
 * @param {Array} allowedTypes - Array of allowed mimetypes
 * @returns {Boolean}
 */
export const validateFileType = (mimetype, allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']) => {
  return allowedTypes.includes(mimetype);
};

/**
 * Convert file size to human readable format
 * @param {Number} bytes - File size in bytes
 * @returns {String} Human readable size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};
