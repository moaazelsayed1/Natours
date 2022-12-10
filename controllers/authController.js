const crypto = require('crypto')
const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const User = require('../model/userModel')
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')
const sendEmail = require('../utils/email')

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })
}

const createAndSendToken = (user, userStatus, res) => {
  const token = signToken(user._id)
  res.status(userStatus).json({
    status: 'success',
    token,
    data: {
      user,
    },
  })
}
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    changedPasswordAt: req.body.changedPasswordAt,
  })

  createAndSendToken(newUser, 201, res)
})

exports.login = catchAsync(async (req, res, next) => {
  // extract sent e-mail and password
  const { email, password } = req.body

  // 1) check if the user provides email and password
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400))
  }
  // 2) check if the email exists and password matches
  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401))
  }

  // 3) send token to the client
  createAndSendToken(user, 200, res)
})

exports.protect = catchAsync(async (req, res, next) => {
  // 1) get token and check if exists
  let token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }
  if (!token) {
    return next(
      new AppError('You are not logged in, Please log in to get access', 401)
    )
  }
  // 2) verify the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  // 3) if user is deleted this token must expire
  const user = await User.findById(decoded.id)
  if (!user) {
    return next(new AppError('this user has been deleted', 401))
  }
  // 4) if user changedPassword token must expire
  if (user.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('this user password has been changed'))
  }
  // grant access to protected route
  req.user = user
  next()
})

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      next(new AppError('You are not authorized to perform this', 403))
    }
    next()
  }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) check if user inputs valid email
  const user = await User.findOne({ email: req.body.email })
  if (!user) {
    next(new AppError('Invalid email', 404))
  }

  // 2) create random token
  const resetToken = user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })

  // 3) send the email
  const resetUrl = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/resetPassword/${resetToken}`

  const message = `Forgot password? submit a patch request with your new password and passwordConfirm to ${resetUrl}\n If you did not forget it ignore this email`

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for only 10mins)',
      message,
    })
    res.status(200).json({
      status: 'success',
      message: 'Token sent to mail',
    })
  } catch (err) {
    user.passwordResetToken = undefined
    user.passwordResetExpire = undefined
    await user.save({ validateBeforeSave: false })

    return next(
      new AppError('there was an error sending email, try agin later', 500)
    )
  }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  })

  // 2) If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400))
  }
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()

  // 3) Update changedPasswordAt property for the user
  // 4) Log the user in, send JWT
  createAndSendToken(user, 200, res)
})

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from the collection
  const user = await User.findById(req.user.id).select('+password')
  if (!user) {
    return next(new AppError('user is not found', 401))
  }
  // 2) check if the POSTed password is correct
  if (!(await user.correctPassword(req.body.curruntPassword, user.password))) {
    return next(new AppError('Entered password is not correct', 401))
  }

  // 3) update the password
  user.password = req.body.password
  user.passwordConfirm = req.body.passwordConfirm
  await user.save()

  // 4) log the user in
  createAndSendToken(user, 200, res)
})
