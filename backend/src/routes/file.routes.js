import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload, saveToMongoDB } from '../middleware/upload.js';
import {
  uploadFile,
  getFile,
  getFileMetadata,
  deleteFile,
  getUserFiles,
  updateFileMetadata,
} from '../controllers/file.controller.js';

const router = express.Router();

// Upload single file
router.post('/upload', authenticate, upload.single('file'), saveToMongoDB, uploadFile);

// Upload multiple files
router.post('/upload-multiple', authenticate, upload.array('files', 10), saveToMongoDB, uploadFile);

// Get all files uploaded by current user
router.get('/user/my-files', authenticate, getUserFiles);

// Get file by ID (serves the actual file)
router.get('/:id', getFile);

// Get file metadata
router.get('/:id/metadata', authenticate, getFileMetadata);

// Update file metadata
router.patch('/:id/metadata', authenticate, updateFileMetadata);

// Delete file
router.delete('/:id', authenticate, deleteFile);

export default router;
