const mongoose = require('mongoose')
const { findOneAndUpdate } = require('../model/tourModel')
const Tour = require('../model/tourModel')

const reviewSchema = mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      required: [true, 'Review must has rating'],
    },
    createdAt: {
      type: Date,
      default: new Date(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  })
  next()
})

reviewSchema.statics.calcAverageRating = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: 'tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ])
  if(stats.length > 0){
  await Tour.findOneAndUpdate(tourId, {
    ratingsAverage: stats[0].avgRating,
    reatingsQuantity: stats[0].nRating,
  })
  }else{
  await Tour.findOneAndUpdate(tourId, {
    ratingsAverage: 0,
    reatingsQuantity:4.5
  })
}
}

reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.tour)
})

reviewSchema.pre(/^findByIdAnd/, async function (next) {
  this.rev = await this.find()
  next()
})

reviewSchema.post(/^findByIdAnd/, async function () {
  await this.rev.constructor.calcAverageRating(this.r.tour)
})

const Review = mongoose.model('Review', reviewSchema)

module.exports = Review
