import multer from 'multer';

export const errorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message: `Upload error: ${err.message}`,
      code: err.code, 
    });
  }

  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ message: err.message });
  }

  console.error('[Unhandled error]', err);
  return res.status(500).json({ message: 'Internal server error' });
};