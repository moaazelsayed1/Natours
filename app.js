const path = require('path')
const express = require('express')
const morgan = require('morgan')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')
const cookieParser = require('cookie-parser')

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
const viewRouter = require('./routes/viewRoutes')
const bookingRouter = require('./routes/bookingRoutes')

// set security http headers
app.use(helmet())
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", 'https:', 'data:'],
      scriptSrc: [
        "'self'",
        'https://cdnjs.cloudflare.com/ajax/libs/axios/1.2.1/axios.min.js',
        'https://js.stripe.com/v3/',
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
)
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
app.use(cookieParser())

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
  /* console.log(req.cookies) */
  next()
})

app.use(compression())
/* console.log(3) */
// mounting the routers
app.use('/', viewRouter)
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/reviews', reviewRouter)
app.use('/api/v1/bookings', bookingRouter)

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
