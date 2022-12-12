const Tour = require('../model/tourModel')
const APIFeatures = require('../utils/apiFeatures')
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')

/* const tours = JSON.parse( */
/*   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`) */
/* ) */

/* exports.chechBody = (req, res, next) => { */
/*   if (!req.body.name || !req.body.price) { */
/*     return res.status(400).json({ */
/*       status: 'failed', */
/*       message: 'request should contain name and price', */
/*     }) */
/*   } */
/*   next() */
/* } */
/* exports.checkId = (req, res, next, val) => { */
/* if (val >= tours.length) { */
/*   return res.status(404).json({ */
/*     status: 'fail', */
/*     message: 'Invalid Id', */
/*   }) */
/* } */
/*   next() */
/* } */

exports.aliasTopTour = (req, res, next) => {
  req.query.limit = '5'
  req.query.sort = '-ratingAverag,price'
  req.query.feilds = 'name,price,ratingAverage,summary'
  next()
}

exports.getAllTours = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate()
  const tours = await features.query

  res.status(200).json({
    status: 'success',
    results: tours.length,
    requestedAt: req.requestedAt,
    data: {
      tours,
    },
  })
})

exports.getTour = catchAsync(async (req, res, next) => {
  // convert a string to a number
  /* const id = req.params.id * 1 */
  const tour = await Tour.findById(req.params.id).populate('reviews') // => Tour.findOne({_id: req.params.id})
  if (!tour) {
    return next(new AppError('no tour found with that id', 404))
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  })
  /* const tour = tours.find((el) => el.id === id) */
})

exports.createTour = catchAsync(async (req, res, next) => {
  /* const newTour = new Tour({}) */
  /* newTour.save().then() */
  const newTour = await Tour.create(req.body)

  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour,
    },
  })
  /* try { */
  /*   const newTour = await Tour.create(req.body) */
  /**/
  /*   res.status(201).json({ */
  /*     status: 'success', */
  /*     data: { */
  /*       tour: newTour, */
  /*     }, */
  /*   }) */
  /* } catch (err) { */
  /*   res.status(400).json({ */
  /*     status: 'failed', */
  /*     message: err, */
  /*   }) */
  /* } */
})

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  })
  if (!tour) {
    return next(new AppError('no tour found with that id', 404))
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  })
})

exports.deleteTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndDelete(req.params.id)
  if (!tour) {
    return next(new AppError('no tour found with that id', 404))
  }

  res.status(204).json({
    status: 'success',
  })
})

exports.getToursStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    /* { */
    /*   $match: { */
    /*     _id: { $ne: 'EASY' }, */
    /*   }, */
    /* }, */
  ])

  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  })
})

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTours: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: {
        month: '$_id',
      },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: {
        numTours: -1,
      },
    },
  ])

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  })
})
