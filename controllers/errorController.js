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
const devError = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  })
}

const prodError = (err, res) => {
  // operational errors, send them to user => trusted
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    })
    // programming errors or other unkown errors: dont leak them to uesr
  } else {
    // log the error
    console.error('ERORR 🤯', err)

    // send a generic message
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    })
  }
}

module.exports = (err, req, res, next) => {
  console.log(err.stack)
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if (process.env.NODE_ENV === 'development') {
    devError(err, res)
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err }
    if (err.name === 'CastError') error = handleCastErrorDB(error)
    if (err.code === 11000) error = handleDoublicateDB(error)
    if (err.name === 'ValidationError') error = handleValidationError(error)
    prodError(error, res)
  }
}
