# MongoDB File Storage System

## Overview

All file uploads (images, PDFs, documents) are now stored directly in MongoDB instead of the file system. This provides better data consistency, easier backups, and simplified deployment.

## Features

- ✅ Files stored as binary data in MongoDB
- ✅ Support for images (JPEG, PNG, GIF) and PDFs
- ✅ File size limit: 5MB per file
- ✅ Automatic metadata tracking (filename, mimetype, size, upload date)
- ✅ User association and permission control
- ✅ File relationships to models (Location, Hotel, Transport, etc.)
- ✅ Base64 data URL generation
- ✅ RESTful API for file operations

## Database Schema

### File Model

```javascript
{
  filename: String,           // Unique generated filename
  originalName: String,       // Original uploaded filename
  mimetype: String,          // File MIME type
  size: Number,              // File size in bytes
  data: Buffer,              // Binary file data
  encoding: String,          // File encoding
  uploadedBy: ObjectId,      // Reference to User
  relatedTo: {
    model: String,           // Model name (Location, Hotel, etc.)
    id: ObjectId            // Related document ID
  },
  metadata: {
    caption: String,
    description: String,
    tags: [String]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Updated Models

All models now reference File documents instead of storing URLs:

**Location, Hotel, Transport, Review:**
```javascript
images: [{
  file: { type: ObjectId, ref: 'File' },
  caption: String
}]
```

**User (Guide Verification):**
```javascript
guideInfo: {
  verificationDocument: { type: ObjectId, ref: 'File' }
}
```

## API Endpoints

### Upload Files

**Upload Single File:**
```http
POST /api/files/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- file: (binary)
- caption: (optional)
- description: (optional)
- tags: (optional array)
```

**Response:**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "file": {
    "id": "507f1f77bcf86cd799439011",
    "filename": "1703012345678-photo.jpg",
    "originalName": "photo.jpg",
    "mimetype": "image/jpeg",
    "size": 245678,
    "url": "/api/files/507f1f77bcf86cd799439011"
  }
}
```

**Upload Multiple Files:**
```http
POST /api/files/upload-multiple
Authorization: Bearer <token>
Content-Type: multipart/form-data

Body:
- files[]: (binary array, max 10 files)
```

### Get File

**Serve File (returns actual image/PDF):**
```http
GET /api/files/:id
```

Returns the file with appropriate Content-Type headers for browser display.

**Get File Metadata:**
```http
GET /api/files/:id/metadata
Authorization: Bearer <token>
```

```json
{
  "success": true,
  "file": {
    "id": "507f1f77bcf86cd799439011",
    "filename": "1703012345678-photo.jpg",
    "originalName": "photo.jpg",
    "mimetype": "image/jpeg",
    "size": 245678,
    "uploadedBy": { "name": "John Doe", "email": "john@example.com" },
    "createdAt": "2025-12-19T10:00:00.000Z",
    "url": "/api/files/507f1f77bcf86cd799439011"
  }
}
```

### Update File Metadata

```http
PATCH /api/files/:id/metadata
Authorization: Bearer <token>
Content-Type: application/json

{
  "caption": "Beautiful sunset",
  "description": "Sunset at the beach",
  "tags": ["sunset", "beach", "nature"]
}
```

### Delete File

```http
DELETE /api/files/:id
Authorization: Bearer <token>
```

Only the file uploader or admin can delete files.

### Get User's Files

```http
GET /api/files/user/my-files
Authorization: Bearer <token>
```

## Usage Examples

### 1. Creating a Location with Images

```javascript
// Frontend code
const formData = new FormData();
formData.append('name', 'Eiffel Tower');
formData.append('description', 'Famous landmark in Paris');
formData.append('category', 'historical');

// Upload images first
const imageUploadResponse = await fetch('/api/files/upload-multiple', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: imageFormData // Contains multiple files
});

const { files } = await imageUploadResponse.json();

// Create location with file references
const locationData = {
  name: 'Eiffel Tower',
  description: 'Famous landmark in Paris',
  category: 'historical',
  images: files.map(file => ({
    file: file.id,
    caption: 'Eiffel Tower view'
  }))
};

await fetch('/api/locations', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(locationData)
});
```

### 2. Using Helper Functions in Controllers

```javascript
import { processImageUploads, processSingleFileUpload } from '../utils/fileHelpers.js';
import { upload, saveToMongoDB } from '../middleware/upload.js';

// Example controller
export const createLocationWithImages = async (req, res) => {
  try {
    // Images already uploaded via saveToMongoDB middleware
    const imageRefs = req.savedFiles.map(file => ({
      file: file._id,
      caption: req.body.caption || ''
    }));

    const location = new Location({
      ...req.body,
      images: imageRefs,
      createdBy: req.user._id
    });

    await location.save();

    res.status(201).json({
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

// Route
router.post(
  '/locations',
  authenticate,
  upload.array('images', 5),
  saveToMongoDB,
  createLocationWithImages
);
```

### 3. Retrieving Locations with Images

```javascript
// Backend: Populate file references
const location = await Location.findById(id)
  .populate('images.file');

// The populated file includes url virtual
// Frontend can directly use: <img src={image.file.url} />
```

### 4. Guide Verification Document Upload

```javascript
// Route
router.post(
  '/guides/verify',
  authenticate,
  upload.single('verificationDocument'),
  saveToMongoDB,
  async (req, res) => {
    const user = await User.findById(req.user._id);
    
    user.guideInfo.verificationDocument = req.savedFile._id;
    user.guideInfo.verificationStatus = 'pending';
    
    await user.save();
    
    res.json({ success: true, message: 'Document uploaded' });
  }
);
```

## Helper Functions Reference

Located in `/backend/src/utils/fileHelpers.js`:

```javascript
// Process multiple image uploads
const imageRefs = await processImageUploads(files, userId, {
  model: 'Location',
  id: locationId
});

// Process single file
const fileId = await processSingleFileUpload(file, userId, {
  model: 'User',
  id: userId
});

// Delete file
await deleteFileById(fileId);

// Delete multiple files
await deleteMultipleFiles([id1, id2, id3]);

// Get file URL
const url = getFileUrl(fileId); // Returns: /api/files/507f...

// Get file as base64 data URL
const dataURL = await getFileAsDataURL(fileId);
// Returns: data:image/jpeg;base64,/9j/4AAQ...

// Populate files in query
const location = await Location.findById(id);
await populateFiles(location, 'images.file');

// Validate file type
const isValid = validateFileType('image/jpeg'); // true

// Format file size
const size = formatFileSize(1048576); // "1 MB"
```

## Migration Guide

### Converting Existing Controllers

**Before (File System):**
```javascript
images: [{
  url: `/uploads/${filename}`,
  caption: 'Photo'
}]
```

**After (MongoDB):**
```javascript
// 1. Upload file via /api/files/upload
// 2. Store reference
images: [{
  file: fileId,  // ObjectId from File collection
  caption: 'Photo'
}]
```

### Frontend Changes

**Before:**
```javascript
<img src={`${API_URL}${image.url}`} />
```

**After:**
```javascript
// Option 1: Direct URL (populated)
<img src={image.file.url} />

// Option 2: Full API URL
<img src={`${API_URL}/api/files/${image.file}`} />

// Option 3: Base64 (if file.data included)
<img src={file.toDataURL()} />
```

## Best Practices

1. **Always use saveToMongoDB middleware** after multer upload:
   ```javascript
   upload.single('file'), saveToMongoDB, controller
   ```

2. **Populate file references** when querying:
   ```javascript
   .populate('images.file')
   .populate('verificationDocument')
   ```

3. **Clean up orphaned files** when deleting documents:
   ```javascript
   // Before deleting location
   const fileIds = location.images.map(img => img.file);
   await deleteMultipleFiles(fileIds);
   await Location.findByIdAndDelete(id);
   ```

4. **Set file relations** for better organization:
   ```javascript
   relatedTo: {
     model: 'Location',
     id: locationId
   }
   ```

5. **Handle errors gracefully**:
   ```javascript
   try {
     const file = await File.findById(id);
     if (!file) return res.status(404).json({ message: 'File not found' });
   } catch (error) {
     // Handle error
   }
   ```

## Performance Considerations

1. **File Size Limit**: 5MB per file (configurable in upload.js)
2. **Chunking**: For files >5MB, consider implementing GridFS
3. **Caching**: File URLs can be cached by browsers
4. **Indexes**: File model has indexes on filename, uploadedBy, and relatedTo
5. **Lazy Loading**: Only populate file references when needed

## Security

1. **Authentication Required**: All upload/delete operations require valid JWT
2. **File Type Validation**: Only allowed mimetypes (JPEG, PNG, GIF, PDF)
3. **Size Limits**: Maximum 5MB per file
4. **Permission Checks**: Users can only delete their own files (except admins)
5. **Binary Data Protection**: File data excluded from JSON responses by default

## Troubleshooting

### Issue: File not uploading
- Check Content-Type is `multipart/form-data`
- Verify file size < 5MB
- Confirm file type is allowed (JPEG, PNG, GIF, PDF)

### Issue: Cannot view image
- Ensure file reference is populated: `.populate('images.file')`
- Check file ID is valid ObjectId
- Verify file exists in database

### Issue: "File not found" error
- File may have been deleted
- Check file ID is correct
- Ensure proper population in query

## Future Enhancements

- [ ] GridFS integration for large files (>16MB)
- [ ] Image optimization/compression
- [ ] Thumbnail generation
- [ ] CDN integration
- [ ] File versioning
- [ ] Bulk operations
- [ ] Admin file management dashboard
