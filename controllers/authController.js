const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const User = require('../model/userModel')
const AppError = require('../utils/AppError')
const catchAsync = require('../utils/catchAsync')

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })
}
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    changedPasswordAt: req.body.changedPasswordAt,
  })
  const token = signToken(newUser._id)
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser,
    },
  })
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
  const token = signToken(user._id)
  res.status(200).json({
    status: 'success',
    token,
  })
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
