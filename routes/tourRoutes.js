const express = require('express')
const tourController = require('./../controllers/tourController')

const router = express.Router()

/* router.param('id', tourController.checkId) */

router
  .route('/get-5-cheap')
  .get(tourController.aliasTopTour, tourController.getAllTours)

router.route('/tours-stats').get(tourController.getToursStats)

router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan)

router
  .route('/')
  .get(tourController.getAllTours)
  .post(tourController.createTour)

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour)

module.exports = router
