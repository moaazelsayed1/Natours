const express = require('express')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

const app = express()

const AppError = require('./utils/AppError')
const globalErrorHandler = require('./controllers/errorController')
const tourRouter = require('./routes/tourRoutes')
const userRouter = require('./routes/userRoutes')

// middlewires
console.log(process.env.NODE_ENV)
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

app.use(express.json())
app.use(express.static(`${__dirname}/public/`))

app.use((req, res, next) => {
  req.requestedAt = new Date().toISOString()
  /* console.log(req.headers) */
  next()
})

/* console.log(3) */
// mounting the routers
app.use('/api/v1/tours', tourRouter)
app.use('/api/v1/users', userRouter)

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
