const catchAsync = require('../utils/catchAsync')
const Tour = require('../model/tourModel')

exports.getOverview = catchAsync(async (req, res, next) => {
  const tours = await Tour.find()
  console.log(tours[0].slug)
  res.status(200).render('overview', {
    title: 'All Tours',
    tours,
  })
})

exports.getTour = (req, res, next) => {
  res.status(200).render('tour', {
    title: 'All tours',
  })
}
