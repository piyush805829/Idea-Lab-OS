export const errorHandler = (err, req, res, next) => {
  console.error('[SERVER ERROR]', err.message || err);

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'registration number';
    return res.status(400).json({
      success: false,
      message: `Registration number is already registered.`
    });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
  }

  // JWT error
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    });
  }

  // Known validation errors
  if (
    err.message && (
      err.message.includes('already registered') ||
      err.message.includes('Invalid credentials') ||
      err.message.includes('required') ||
      err.message.includes('not found')
    )
  ) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Default server error
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};
