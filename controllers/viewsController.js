const catchAsync = require('../utils/catchAsync')
const Tour = require('../model/tourModel')
const AppError = require('../utils/AppError')

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find()
  console.log(tours[0].slug)
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  })
})

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user',
  })

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404))
  }

  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  })
})

exports.getLoginForm = (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  })
}
