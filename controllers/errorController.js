const AppError = require('../utils/AppError')

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

const handleDoublicateDB = (err) => {
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)[0]
  /* console.log(value) */
  const message = `Dublicate field value: ${value} please use another value!`
  return new AppError(message, 400)
}

const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message)
  const message = `Invalid input data. ${errors.join('. ')}`
  console.log(message)
  return new AppError(message, 400)
}

const handleJsonWebTokenError = () => {
  return new AppError('Invalid token please log in again', 401)
}

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired please log in again', 401)
}
const devError = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    })
  }

  // B) RENDERED WEBSITE
  console.error('ERROR 💥', err)
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  })
}

const prodError = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      })
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err)
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    })
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    console.log(err)
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    })
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR 💥', err)
  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  })
}

module.exports = (err, req, res, next) => {
  console.log(err.stack)
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if (process.env.NODE_ENV === 'development') {
    devError(err, req, res)
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err }
    error.message = err.message
    if (err.name === 'CastError') error = handleCastErrorDB(error)
    if (err.code === 11000) error = handleDoublicateDB(error)
    if (err.name === 'ValidationError') error = handleValidationError(error)
    if (err.name === 'JsonWebTokenError') error = handleJsonWebTokenError()
    if (err.name === 'JWTExpiredError') error = handleJWTExpiredError()

    prodError(error, req, res)
  }
}
