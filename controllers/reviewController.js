const Review = require('../model/reviewModel')
const catchAsync = require('../utils/catchAsync')

exports.getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find()

  res.status(200).json({
    status: 'sucess',
    result: reviews.length,
    data: {
      reviews,
    },
  })
})

exports.createReview = catchAsync(async (req, res, next) => {
  const review = await Review.create(req.body)

  res.status(201).json({
    status: 'sucess',
    data: {
      review,
    },
  })
})
