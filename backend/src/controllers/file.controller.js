import File from '../models/File.js';

export const uploadFile = async (req, res) => {
  try {
    if (!req.savedFile && (!req.savedFiles || req.savedFiles.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    if (req.savedFile) {
      return res.status(201).json({
        success: true,
        message: 'File uploaded successfully',
        file: {
          id: req.savedFile._id,
          filename: req.savedFile.filename,
          originalName: req.savedFile.originalName,
          mimetype: req.savedFile.mimetype,
          size: req.savedFile.size,
          url: req.savedFile.url,
        },
      });
    }

    if (req.savedFiles) {
      return res.status(201).json({
        success: true,
        message: 'Files uploaded successfully',
        files: req.savedFiles.map(file => ({
          id: file._id,
          filename: file.filename,
          originalName: file.originalName,
          mimetype: file.mimetype,
          size: file.size,
          url: file.url,
        })),
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message,
    });
  }
};

export const getFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Set appropriate headers
    res.set({
      'Content-Type': file.mimetype,
      'Content-Length': file.size,
      'Content-Disposition': `inline; filename="${file.originalName}"`,
    });

    // Send the file buffer
    res.send(file.data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving file',
      error: error.message,
    });
  }
};

export const getFileMetadata = async (req, res) => {
  try {
    const file = await File.findById(req.params.id)
      .select('-data')
      .populate('uploadedBy', 'name email');

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    res.json({
      success: true,
      file,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving file metadata',
      error: error.message,
    });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Check if user has permission to delete
    if (req.user && (req.user._id.toString() !== file.uploadedBy?.toString() && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this file',
      });
    }

    await File.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message,
    });
  }
};

export const getUserFiles = async (req, res) => {
  try {
    const files = await File.find({ uploadedBy: req.user._id })
      .select('-data')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: files.length,
      files,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving files',
      error: error.message,
    });
  }
};

export const updateFileMetadata = async (req, res) => {
  try {
    const { caption, description, tags } = req.body;
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // Check if user has permission to update
    if (req.user && (req.user._id.toString() !== file.uploadedBy?.toString() && req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this file',
      });
    }

    if (caption !== undefined) file.metadata.caption = caption;
    if (description !== undefined) file.metadata.description = description;
    if (tags !== undefined) file.metadata.tags = tags;

    await file.save();

    res.json({
      success: true,
      message: 'File metadata updated successfully',
      file: file.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating file metadata',
      error: error.message,
    });
  }
};
