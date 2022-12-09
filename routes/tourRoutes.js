const express = require('express')
const tourController = require('./../controllers/tourController')
const authController = require('../controllers/authController')

const router = express.Router()

/* router.param('id', tourController.checkId) */

router
  .route('/get-5-cheap')
  .get(tourController.aliasTopTour, tourController.getAllTours)

router.route('/tours-stats').get(tourController.getToursStats)

router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan)

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour)

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(authController.protect, authController.restrictTo('admin'), tourController.deleteTour)

module.exports = router
