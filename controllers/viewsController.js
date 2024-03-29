const catchAsync = require('../utils/catchAsync')
const Tour = require('../model/tourModel')
const AppError = require('../utils/AppError')
const Booking = require('../model/bookingModel')
const User = require('../model/userModel')

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

exports.getSignupForm = (req, res) => {
  res.status(200).render('signup', {
    title: 'create your account!',
  })
}

exports.getLoginForm = (req, res, next) => {
  res.status(200).render('login', {
    title: 'Log into your account',
  })
}

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  })
}

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    }
  )

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  })
})

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id })

  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map((el) => el.tour)
  const tours = await Tour.find({ _id: { $in: tourIDs } })

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  })
})
