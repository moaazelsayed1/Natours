const path = require('path')
const express = require('express')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

const app = express()

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))
// serving static files
app.use(express.static(path.join(__dirname, 'public')))

const AppError = require('./utils/AppError')
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoutes')

// set security http headers
app.use(helmet())
console.log(process.env.NODE_ENV)
// dev logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}
// limit 100 req per an hour
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 100,
  message: 'Too many requests from this IP, try agian later',
})
app.use('/api', limiter)

// Body parser
app.use(express.json({ limit: '10Kb' }))

// data sanitization against NoSQL query attacks
app.use(mongoSanitize())

// data sanitization against XSS
app.use(xss())

// prevent parameter pullution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
)

// TESTING :D
app.use((req, res, next) => {
  req.requestedAt = new Date().toISOString()
  /* console.log(req.headers) */
  next()
})

app.get('/', (req, res, next) => {
  res.status(200).render('base', {
    tour: 'The Forest Hiker',
    user: 'moaaz',
  })
  next()
})
/* console.log(3) */
// mounting the routers
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)

app.all('*', (req, res, next) => {
  /* res.status(404).json({ */
  /*   status: 'fail', */
  /*   message: `Can not find ${req.originalUrl} on this server`, */
  /* }) */

  next(new AppError(`Can not find ${req.originalUrl} on this server`, 404))
})

app.use(globalErrorHandler)
// start the sever
module.exports = app
