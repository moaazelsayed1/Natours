const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Tour = require('../model/tourModel')
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')
const factory = require('./handlerFactory')

const checkIfProductExists = async (tourName) => {
  const products = await stripe.products.list({ limit: 100 })
  const product = products.data.find((product) => product.name === tourName)
  return product || null
}

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // Find the tour by its ID
  const tour = await Tour.findById(req.params.tourID)

  let product = await checkIfProductExists(`${tour.name} Tour`)
  console.log(product)
  // If the product doesn't exist, create it
  if (!product) {
    console.log('found')
    product = await stripe.products.create({
      name: `${tour.name} Tour`,
      description: tour.summary,
      images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
    })
  }
  // Create the price for the tour if it doesn't exist
  let price = await stripe.prices.list({
    product: product.id,
    unit_amount: tour.price * 100,
    currency: 'usd',
  })
  price =
    price.data[0] ||
    (await stripe.prices.create({
      product: product.id,
      unit_amount: tour.price * 100,
      currency: 'usd',
      nickname: `${tour.name} Tour Price`,
    }))

  // Create the checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/`,
    cancel_url: `${req.protocol}://${req.get('host')}/tours/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourID,
    mode: 'payment',
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
  })

  // Return the checkout session to the client
  res.status(200).json({
    status: 'success',
    session,
  })
})
