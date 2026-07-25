/**
 * Centralized error handling middleware.
 */

// 404 handler
function notFound(req, res, _next) {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

// Global error handler
function errorHandler(err, req, res, _next) {
  console.error(`[ERROR] ${err.message}`, err.stack);

  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({
      success: false,
      error: err.name || 'Error',
      message: err.message,
    });
  }

  // MySQL unique constraint violation
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate Entry',
      message: 'A record with this information already exists',
    });
  }

  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
}

module.exports = { notFound, errorHandler };
