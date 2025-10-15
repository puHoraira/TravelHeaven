import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import { UserRepository } from '../patterns/Repository.js';

const userRepo = new UserRepository();

const buildUserResponse = (user) => {
  if (!user) return null;
  const doc = user.toObject ? user.toObject() : user;

  const profile = doc.profile || {};
  const guideInfo = doc.guideInfo || null;

  if (guideInfo?.verificationDocument) {
    const sanitizedDocument = { ...guideInfo.verificationDocument };
    delete sanitizedDocument.diskPath;
    guideInfo.verificationDocument = sanitizedDocument;
  }

  return {
    id: doc._id,
    username: doc.username,
    email: doc.email,
    role: doc.role,
    profile,
    guideInfo: guideInfo || undefined,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

/**
 * Register new user
 */
export const register = async (req, res) => {
  try {
    const { username, email, password, role, profile } = req.body;

    // Check if user exists
    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const existingUsername = await userRepo.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await userRepo.create({
      username,
      email,
      password: hashedPassword,
      role: role || 'user',
      profile: profile || {},
    });

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: buildUserResponse(user),
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

/**
 * Login user
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password
    const user = await userRepo.findByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: buildUserResponse(user),
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

/**
 * Get current user
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await userRepo.findById(req.user._id);

    res.json({
      success: true,
      data: buildUserResponse(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message,
    });
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const user = await userRepo.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let hasChanges = false;

    let profilePayload = req.body.profile;
    if (typeof profilePayload === 'string') {
      try {
        profilePayload = JSON.parse(profilePayload);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid profile payload',
        });
      }
    }

    if (profilePayload && typeof profilePayload === 'object') {
      user.profile = {
        ...(user.profile || {}),
        ...profilePayload,
      };
      hasChanges = true;
    }

    let guideInfoPayload = req.body.guideInfo;
    if (typeof guideInfoPayload === 'string') {
      try {
        guideInfoPayload = JSON.parse(guideInfoPayload);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid guide information payload',
        });
      }
    }

    if (guideInfoPayload && typeof guideInfoPayload === 'object') {
      user.guideInfo = {
        ...(user.guideInfo || {}),
        ...guideInfoPayload,
      };
      hasChanges = true;
    }

    if (req.file) {
      const relativeUploadPath = path.posix.join('uploads', req.file.filename);
      const fileUrl = `/${relativeUploadPath}`.replace(/\\/g, '/');
      user.profile = user.profile || {};
      user.profile.avatar = fileUrl;
      hasChanges = true;
    }

    if (!hasChanges) {
      return res.status(400).json({
        success: false,
        message: 'No profile changes detected',
      });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: buildUserResponse(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

/**
 * Register new guide with verification document
 */
export const registerGuide = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone, experience } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Verification document (NID/Passport) is required',
      });
    }

    // Check if user exists
    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    const existingUsername = await userRepo.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: 'Username already taken',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create guide user with verification document
    const relativeUploadPath = path.posix.join('uploads', req.file.filename);
    const fileUrl = `/${relativeUploadPath}`;

    const user = await userRepo.create({
      username,
      email,
      password: hashedPassword,
      role: 'guide',
      profile: {
        firstName,
        lastName,
        phone,
      },
      guideInfo: {
        experience,
        verificationDocument: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          path: relativeUploadPath,
          url: fileUrl,
          diskPath: req.file.path,
          uploadedAt: new Date(),
        },
        verificationStatus: 'pending',
      },
    });

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      message: 'Guide registration submitted successfully. Awaiting admin verification.',
      data: {
        user: buildUserResponse(user),
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Guide registration failed',
      error: error.message,
    });
  }
};
