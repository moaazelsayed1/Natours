const { query } = require('express')
const APIFeatures = require('../utils/apiFeatures')
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id)

    if (!doc) return next(new AppError('No document found with that ID', 404))

    res.status(204).json({
      status: 'success',
      data: null,
    })
  })

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!doc) {
      return next(new AppError('no document found with that id', 404))
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    })
  })

exports.createOne = (Model) =>
  catchAsync(async (req, res, nex) => {
    const doc = await Model.create(req.body)
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    })
  })

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id)
    if (popOptions) query = query.populate(popOptions)
    const doc = await query

    if (!doc) {
      return next(new AppError('no tour found with that id', 404))
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    })
  })

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // for nested GET reviews on tour
    let filter = {}
    if (!req.body.tour) req.body.tour = { tour: req.params.tourId }

    const features = new APIFeatures(Model.find(), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate()
    const doc = await features.query

    res.status(200).json({
      status: 'success',
      results: doc.length,
      requestedAt: req.requestedAt,
      data: {
        data: doc,
      },
    })
  })
