/**
 * Example Controller: How to handle file uploads with MongoDB storage
 * This file demonstrates various file upload scenarios
 */

import Location from '../models/Location.js';
import Hotel from '../models/Hotel.js';
import { User } from '../models/User.js';
import File from '../models/File.js';
import { processImageUploads, deleteMultipleFiles } from '../utils/fileHelpers.js';

// ============================================================================
// EXAMPLE 1: Create Location with Multiple Images
// ============================================================================
// Route: POST /api/locations/with-images
// Middleware: authenticate, upload.array('images', 5), saveToMongoDB

export const createLocationWithImages = async (req, res) => {
  try {
    const { name, description, category, city, country, coordinates } = req.body;

    // savedFiles is populated by saveToMongoDB middleware
    const imageRefs = req.savedFiles ? req.savedFiles.map((file, index) => ({
      file: file._id,
      caption: req.body.captions?.[index] || `${name} - Image ${index + 1}`
    })) : [];

    const location = new Location({
      name,
      description,
      category,
      city,
      country,
      coordinates: {
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude
      },
      images: imageRefs,
      createdBy: req.user._id
    });

    await location.save();

    // Update file relations
    if (req.savedFiles) {
      await Promise.all(req.savedFiles.map(file => 
        File.findByIdAndUpdate(file._id, {
          relatedTo: {
            model: 'Location',
            id: location._id
          }
        })
      ));
    }

    // Populate images for response
    await location.populate('images.file');

    res.status(201).json({
      success: true,
      message: 'Location created with images',
      location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// EXAMPLE 2: Add Images to Existing Location
// ============================================================================
// Route: POST /api/locations/:id/images
// Middleware: authenticate, upload.array('images', 5), saveToMongoDB

export const addLocationImages = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    if (!req.savedFiles || req.savedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images uploaded'
      });
    }

    // Add new images to existing array
    const newImages = req.savedFiles.map((file, index) => ({
      file: file._id,
      caption: req.body.captions?.[index] || ''
    }));

    location.images.push(...newImages);
    await location.save();

    // Update file relations
    await Promise.all(req.savedFiles.map(file => 
      File.findByIdAndUpdate(file._id, {
        relatedTo: {
          model: 'Location',
          id: location._id
        }
      })
    ));

    await location.populate('images.file');

    res.json({
      success: true,
      message: 'Images added successfully',
      location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// EXAMPLE 3: Update Location Image Caption
// ============================================================================
// Route: PATCH /api/locations/:locationId/images/:imageIndex

export const updateImageCaption = async (req, res) => {
  try {
    const { locationId, imageIndex } = req.params;
    const { caption } = req.body;

    const location = await Location.findById(locationId);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    if (!location.images[imageIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    location.images[imageIndex].caption = caption;
    await location.save();

    res.json({
      success: true,
      message: 'Caption updated',
      image: location.images[imageIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// EXAMPLE 4: Delete Location Image
// ============================================================================
// Route: DELETE /api/locations/:locationId/images/:imageIndex

export const deleteLocationImage = async (req, res) => {
  try {
    const { locationId, imageIndex } = req.params;

    const location = await Location.findById(locationId);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    if (!location.images[imageIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Get file ID before removing
    const fileId = location.images[imageIndex].file;

    // Remove from array
    location.images.splice(imageIndex, 1);
    await location.save();

    // Delete file from MongoDB
    await File.findByIdAndDelete(fileId);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// EXAMPLE 5: Get Location with Populated Images
// ============================================================================
// Route: GET /api/locations/:id/with-images

export const getLocationWithImages = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id)
      .populate('images.file')
      .populate('createdBy', 'name email');

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    res.json({
      success: true,
      location
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// EXAMPLE 6: Upload Guide Verification Document
// ============================================================================
// Route: POST /api/guides/verification-document
// Middleware: authenticate, upload.single('document'), saveToMongoDB

export const uploadVerificationDocument = async (req, res) => {
  try {
    if (!req.savedFile) {
      return res.status(400).json({
        success: false,
        message: 'No document uploaded'
      });
    }

    const user = await User.findById(req.user._id);

    // Delete old verification document if exists
    if (user.guideInfo.verificationDocument) {
      await File.findByIdAndDelete(user.guideInfo.verificationDocument);
    }

    // Set new verification document
    user.guideInfo.verificationDocument = req.savedFile._id;
    user.guideInfo.verificationStatus = 'pending';
    user.guideInfo.verificationResubmittedAt = new Date();

    await user.save();

    // Update file relation
    await File.findByIdAndUpdate(req.savedFile._id, {
      relatedTo: {
        model: 'User',
        id: user._id
      }
    });

    res.json({
      success: true,
      message: 'Verification document uploaded successfully',
      file: {
        id: req.savedFile._id,
        url: req.savedFile.url,
        originalName: req.savedFile.originalName
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// EXAMPLE 7: Create Hotel with Room Photos
// ============================================================================
// Route: POST /api/hotels/with-photos
// Middleware: authenticate, upload.fields([
//   { name: 'hotelImages', maxCount: 5 },
//   { name: 'roomPhotos', maxCount: 10 }
// ]), saveToMongoDB

export const createHotelWithPhotos = async (req, res) => {
  try {
    const { name, description, location, priceRange, amenities, rooms } = req.body;

    // Process hotel images
    const hotelImageRefs = req.savedFiles
      .filter(f => f.originalname.startsWith('hotel-'))
      .map(file => ({
        file: file._id,
        caption: `${name} - Hotel view`
      }));

    // Process room photos
    const roomPhotoRefs = req.savedFiles
      .filter(f => f.originalname.startsWith('room-'))
      .map(file => ({
        file: file._id,
        caption: 'Room view'
      }));

    const hotel = new Hotel({
      name,
      description,
      location,
      priceRange,
      amenities,
      images: hotelImageRefs,
      rooms: rooms.map((room, index) => ({
        ...room,
        photos: roomPhotoRefs.slice(index * 2, (index + 1) * 2) // 2 photos per room
      })),
      guideId: req.user._id
    });

    await hotel.save();

    // Update all file relations
    await Promise.all(req.savedFiles.map(file => 
      File.findByIdAndUpdate(file._id, {
        relatedTo: {
          model: 'Hotel',
          id: hotel._id
        }
      })
    ));

    await hotel.populate('images.file rooms.photos.file');

    res.status(201).json({
      success: true,
      message: 'Hotel created with photos',
      hotel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// EXAMPLE 8: Delete Document and Clean Up Files
// ============================================================================

export const deleteLocationWithFiles = async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Location not found'
      });
    }

    // Collect all file IDs
    const fileIds = location.images.map(img => img.file);

    // Delete location
    await Location.findByIdAndDelete(req.params.id);

    // Delete all associated files
    if (fileIds.length > 0) {
      await deleteMultipleFiles(fileIds);
    }

    res.json({
      success: true,
      message: 'Location and all associated files deleted',
      deletedFiles: fileIds.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ============================================================================
// EXAMPLE 9: Get File Statistics
// ============================================================================

export const getFileStatistics = async (req, res) => {
  try {
    const stats = await File.aggregate([
      {
        $group: {
          _id: '$mimetype',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' },
          avgSize: { $avg: '$size' }
        }
      },
      {
        $project: {
          mimetype: '$_id',
          count: 1,
          totalSize: 1,
          avgSize: 1,
          totalSizeMB: { $divide: ['$totalSize', 1048576] },
          avgSizeMB: { $divide: ['$avgSize', 1048576] }
        }
      }
    ]);

    const totalStats = await File.aggregate([
      {
        $group: {
          _id: null,
          totalFiles: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }
      }
    ]);

    res.json({
      success: true,
      byType: stats,
      overall: {
        totalFiles: totalStats[0]?.totalFiles || 0,
        totalSizeMB: (totalStats[0]?.totalSize || 0) / 1048576
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
