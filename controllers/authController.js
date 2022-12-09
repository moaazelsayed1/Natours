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
    token 
  })
})
