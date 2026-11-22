import express from 'express';
import multer from 'multer';

const router = express.Router();

// 2MB limit in bytes
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2,097,152 bytes

// Memory storage for PDF uploads (files kept in memory, not written to disk)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: (_req, file, cb) => {
    // Accept only PDF files
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF files are allowed.'));
    }
  },
});

// POST /api/upload - PDF upload with size validation
router.post('/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    res.status(400).json({
      status: 'error',
      message: 'No PDF file provided',
    });
    return;
  }

  // File successfully uploaded and within size limit
  res.status(200).json({
    status: 'success',
    message: 'PDF uploaded successfully',
    fileName: req.file.originalname,
    fileSize: req.file.size,
    sizeInMB: (req.file.size / (1024 * 1024)).toFixed(2),
  });
});

// Multer error handler - catches file size exceeded and other multer errors
router.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        status: 'error',
        message: 'file too large',
        maxSizeInMB: MAX_FILE_SIZE / (1024 * 1024),
      });
      return;
    }
    res.status(400).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  if (err.message === 'Invalid file type. Only PDF files are allowed.') {
    res.status(400).json({
      status: 'error',
      message: err.message,
    });
    return;
  }

  // Fall through to Express default error handler
  _next(err);
});

export default router;
