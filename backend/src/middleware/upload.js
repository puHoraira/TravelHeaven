import multer from 'multer';
import File from '../models/File.js';

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and PDF are allowed.'), false);
  }
};

// Multer configuration with memory storage
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter,
});

// Middleware to save files to MongoDB
export const saveToMongoDB = async (req, res, next) => {
  try {
    console.log('[saveToMongoDB] Called - file:', !!req.file, ', files:', !!req.files);
    
    if (!req.file && !req.files) {
      console.log('[saveToMongoDB] No file provided, skipping...');
      return next();
    }

    // Handle single file upload
    if (req.file) {
      console.log('[saveToMongoDB] Processing single file:', req.file.originalname);
      const fileDoc = new File({
        filename: `${Date.now()}-${req.file.originalname}`,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer,
        encoding: req.file.encoding,
        uploadedBy: req.user?._id || null, // Can be null if not authenticated
        metadata: {
          caption: req.body.caption,
          description: req.body.description,
          tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags]) : [],
        },
      });

      await fileDoc.save();
      console.log('[saveToMongoDB] File saved with ID:', fileDoc._id);
      
      // Replace file buffer with file document info
      req.file.mongoId = fileDoc._id;
      req.file.url = fileDoc.url;
      req.savedFile = fileDoc;
    }

    // Handle multiple files upload
    if (req.files) {
      const savedFiles = [];
      
      // Handle array of files
      if (Array.isArray(req.files)) {
        for (const file of req.files) {
          const fileDoc = new File({
            filename: `${Date.now()}-${file.originalname}`,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            data: file.buffer,
            encoding: file.encoding,
            uploadedBy: req.user?._id,
          });

          await fileDoc.save();
          file.mongoId = fileDoc._id;
          file.url = fileDoc.url;
          savedFiles.push(fileDoc);
        }
      } 
      // Handle named fields (multer.fields())
      else {
        for (const fieldName in req.files) {
          for (const file of req.files[fieldName]) {
            const fileDoc = new File({
              filename: `${Date.now()}-${file.originalname}`,
              originalName: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              data: file.buffer,
              encoding: file.encoding,
              uploadedBy: req.user?._id,
            });

            await fileDoc.save();
            file.mongoId = fileDoc._id;
            file.url = fileDoc.url;
            savedFiles.push(fileDoc);
          }
        }
      }

      req.savedFiles = savedFiles;
    }

    next();
  } catch (error) {
    console.error('[saveToMongoDB] Error:', error.message);
    next(error);
  }
};
