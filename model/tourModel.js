const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')
/* const User = require('./userModel') */

const tourSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a name'],
      unique: true,
      maxLength: [20, 'Name must have less than 20 characters'],
      minLength: [10, 'Name must have more than 10 characters'],
      /* validate: [validator.isAlpha, 'Name must only contain characters'], */
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'difficulty must be easy, meduim, or difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    reatingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        // only works on create not update
        validator: function (val) {
          return val < this.price
        },
        message: 'Discount price ({VALUEh}) must be less than price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    discription: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: new Date(),
      select: false,
    },
    startDates: [Date],
    secretTour: Boolean,
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordination: [Number],
      address: String,
      description: String,
    },
    location: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordination: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

tourSchema.index({ price: 1, ratingsAverage: -1 })
tourSchema.index({ slug: 1 })
tourSchema.index({ startLocation: '$2dsphere' })
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7
})

tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
})
// DOCUMENT MIDDLEWARE function: runs before .save and .create only
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true })
  next()
})

// logic for embeding
/* tourSchema.pre('save', async function (next) { */
/*   const guidesPromises = this.guides.map(async (id) => User.findById(id)) */
/*   this.guides = await Promise.all(guidesPromises) */
/*   next() */
/* }) */

/* tourSchema.pre('save', function (next) { */
/*   console.log('we will save this document...') */
/*   next() */
/* }) */
/**/
/* tourSchema.post('save', function (next, doc) { */
/*   console.log(doc) */
/*   next() */
/* }) */

// QUERY MIDDLEWARE function
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } })
  this.start = new Date()
  next()
})

tourSchema.post(/^find/, function (docs, next) {
  console.log(Date() - this.start)
  next()
})
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -changedPasswordAt',
  })
  next()
})

// AGGERAGATION MIDDLEWARE
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } })
  next()
})
const Tour = mongoose.model('Tour', tourSchema)

module.exports = Tour
