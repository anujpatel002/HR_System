const { error } = require('../utils/responseHandler');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Prisma errors
  if (err.code === 'P2002') {
    return error(res, 'A record with this information already exists', 400);
  }
  
  if (err.code === 'P2025') {
    return error(res, 'Record not found', 404);
  }

  if (err.code === 'P2003') {
    return error(res, 'Invalid reference to related record', 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return error(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return error(res, 'Token expired', 401);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return error(res, err.message, 400);
  }

  // Default error
  return error(res, 'Internal server error', 500);
};

module.exports = errorHandler;