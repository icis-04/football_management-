import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';
import { logger } from '../config/logger';
import type { Express } from 'express';

// Ensure upload directory exists
const ensureUploadDir = async () => {
  try {
    await fs.access(config.UPLOAD_PATH);
  } catch {
    await fs.mkdir(config.UPLOAD_PATH, { recursive: true });
    logger.info(`Created upload directory: ${config.UPLOAD_PATH}`);
  }
};

// Initialize upload directory
ensureUploadDir().catch(err => {
  logger.error('Failed to create upload directory:', err);
});

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG and PNG images are allowed'));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE, // 5MB default
    files: 1
  }
});

// Image processing middleware
export const processImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return next();
    }

    // Generate unique filename
    const filename = `avatar_${uuidv4()}.jpg`;
    const filepath = path.join(config.UPLOAD_PATH, filename);

    // Process image with Sharp
    await sharp(req.file.buffer)
      .resize(500, 500, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toFile(filepath);

    // Add processed file info to request
    req.processedFile = {
      filename,
      filepath,
      url: `/uploads/${filename}`,
      size: (await fs.stat(filepath)).size
    };

    logger.info(`Image processed successfully: ${filename}`);
    next();
  } catch (error) {
    logger.error('Image processing failed:', error);
    next(new Error('Failed to process image'));
  }
};

// Cleanup old avatar middleware
export const cleanupOldAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // For now, we'll skip the cleanup since we don't have the full user object
    // This would need to be fetched from the database using req.user.id
    next();
  } catch (error) {
    logger.error('Avatar cleanup failed:', error);
    next();
  }
};

// Delete file utility
export const deleteFile = async (filepath: string): Promise<void> => {
  try {
    await fs.unlink(filepath);
    logger.info(`File deleted: ${filepath}`);
  } catch (error) {
    logger.warn(`Could not delete file: ${filepath}`, error);
  }
};

// Serve static files middleware
export const serveUploads = (req: Request, res: Response): void => {
  const filename = req.params['filename'];
  if (!filename) {
    res.status(400).json({
      error: {
        code: 'BAD_REQUEST',
        message: 'Filename is required',
        timestamp: new Date().toISOString()
      }
    });
    return;
  }
  
  const filepath = path.join(config.UPLOAD_PATH, filename);
  
  // Security check - prevent directory traversal
  if (!filepath.startsWith(path.resolve(config.UPLOAD_PATH))) {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied',
        timestamp: new Date().toISOString()
      }
    });
    return;
  }

  res.sendFile(path.resolve(filepath), (err) => {
    if (err) {
      logger.warn(`File not found: ${filename}`);
      res.status(404).json({
        error: {
          code: 'FILE_NOT_FOUND',
          message: 'File not found',
          timestamp: new Date().toISOString()
        }
      });
    }
  });
};

// Types for processed file
declare global {
  namespace Express {
    interface Request {
      processedFile?: {
        filename: string;
        filepath: string;
        url: string;
        size: number;
      };
    }
  }
} 