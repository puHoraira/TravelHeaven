# File Upload System Migration Summary

## What Changed?

Your TravelHeaven application now stores **ALL file uploads directly in MongoDB** instead of the file system.

## Files Modified

### 1. **Models Updated** (MongoDB File References)
- ✅ [User.js](backend/src/models/User.js) - Guide verification documents
- ✅ [Location.js](backend/src/models/Location.js) - Location images
- ✅ [Hotel.js](backend/src/models/Hotel.js) - Hotel images & room photos
- ✅ [Transport.js](backend/src/models/Transport.js) - Transport images
- ✅ [Review.js](backend/src/models/Review.js) - Review images

### 2. **New Files Created**
- ✅ [File.js](backend/src/models/File.js) - File storage model
- ✅ [file.controller.js](backend/src/controllers/file.controller.js) - File CRUD operations
- ✅ [file.routes.js](backend/src/routes/file.routes.js) - File API endpoints
- ✅ [fileHelpers.js](backend/src/utils/fileHelpers.js) - Helper functions
- ✅ [example-file-upload.controller.js](backend/src/controllers/example-file-upload.controller.js) - Usage examples

### 3. **Files Modified**
- ✅ [upload.js](backend/src/middleware/upload.js) - Changed to memory storage + MongoDB save
- ✅ [server.js](backend/src/server.js) - Added file routes, removed static uploads folder

## Key Features

### ✅ Binary Storage
Files are stored as `Buffer` data directly in MongoDB documents.

### ✅ File Model Schema
```javascript
{
  filename: "1703012345678-photo.jpg",
  originalName: "photo.jpg",
  mimetype: "image/jpeg",
  size: 245678,
  data: <Buffer>,
  uploadedBy: ObjectId("user_id"),
  relatedTo: {
    model: "Location",
    id: ObjectId("location_id")
  },
  metadata: {
    caption: "Beautiful view",
    tags: ["sunset", "beach"]
  }
}
```

### ✅ Updated Image References
All models now use:
```javascript
images: [{
  file: ObjectId,  // Reference to File document
  caption: String
}]
```

### ✅ RESTful API
- `POST /api/files/upload` - Single file
- `POST /api/files/upload-multiple` - Multiple files
- `GET /api/files/:id` - Serve file (returns image/PDF)
- `GET /api/files/:id/metadata` - Get file info
- `PATCH /api/files/:id/metadata` - Update caption/tags
- `DELETE /api/files/:id` - Delete file
- `GET /api/files/user/my-files` - Get user's files

## How to Use

### Frontend: Upload Image
```javascript
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('/api/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { file } = await response.json();
// Use file.id in your location/hotel/transport creation
```

### Frontend: Display Image
```html
<img src="/api/files/507f1f77bcf86cd799439011" alt="Location" />
```

### Backend: Create Location with Images
```javascript
router.post(
  '/locations',
  authenticate,
  upload.array('images', 5),
  saveToMongoDB,  // NEW: Saves files to MongoDB
  async (req, res) => {
    const imageRefs = req.savedFiles.map(file => ({
      file: file._id,
      caption: 'Photo'
    }));

    const location = new Location({
      ...req.body,
      images: imageRefs
    });

    await location.save();
    res.json({ success: true, location });
  }
);
```

### Backend: Query with Images
```javascript
const location = await Location.findById(id)
  .populate('images.file');  // Populates file documents

// Response includes:
// images: [{
//   file: {
//     _id: "507f...",
//     url: "/api/files/507f...",
//     originalName: "photo.jpg"
//   },
//   caption: "Beautiful view"
// }]
```

## Migration Steps

### For Existing Data
If you have existing file URLs in your database:

1. **No immediate action required** - Old URLs still work if files exist
2. **New uploads** automatically use MongoDB storage
3. **To migrate old files:**
   - Read file from disk
   - Create File document with buffer
   - Update references in Location/Hotel/Transport
   - Delete old file from disk

## Supported File Types
- ✅ **Images:** JPEG, JPG, PNG, GIF
- ✅ **Documents:** PDF
- ⚙️ **Size Limit:** 5MB per file

## Benefits

1. **Centralized Storage** - Everything in MongoDB
2. **Easy Backups** - `mongodump` includes all files
3. **Simplified Deployment** - No separate file storage needed
4. **Better Permissions** - Database-level access control
5. **Metadata Tracking** - Upload date, user, relations, tags
6. **Consistent Queries** - Use MongoDB queries for files

## Documentation

📖 **Complete Guide:** [MONGODB_FILE_STORAGE_GUIDE.md](MONGODB_FILE_STORAGE_GUIDE.md)
- API endpoints reference
- Helper functions
- Code examples
- Best practices
- Troubleshooting

🔧 **Example Controller:** [example-file-upload.controller.js](backend/src/controllers/example-file-upload.controller.js)
- 9 real-world examples
- Location images
- Hotel photos
- Guide verification
- File cleanup

## Testing

### Test File Upload
```bash
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@photo.jpg" \
  -F "caption=Test image"
```

### Test File Retrieval
```bash
curl http://localhost:5000/api/files/FILE_ID
```

## Important Notes

⚠️ **Middleware Order Matters:**
```javascript
upload.single('file'),    // 1. Parse multipart form
saveToMongoDB,            // 2. Save to MongoDB
yourController            // 3. Use req.savedFile
```

⚠️ **Always Populate in Queries:**
```javascript
.populate('images.file')  // To get file URLs
```

⚠️ **Clean Up on Delete:**
```javascript
// Delete associated files when deleting parent document
const fileIds = location.images.map(img => img.file);
await deleteMultipleFiles(fileIds);
await Location.findByIdAndDelete(id);
```

## Next Steps

1. ✅ System is ready to use
2. 📝 Update frontend upload components
3. 🔄 (Optional) Migrate existing files
4. 🧪 Test file uploads/downloads
5. 📊 Monitor file storage size

## Questions?

Refer to [MONGODB_FILE_STORAGE_GUIDE.md](MONGODB_FILE_STORAGE_GUIDE.md) for detailed documentation.
