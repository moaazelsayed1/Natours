const crypto = require('crypto')
const mongoose = require('mongoose')
const slugify = require('slugify')
const validator = require('validator')
const bcrypt = require('bcryptjs')

const userSchema = mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, 'User must have a name'],
  },
  email: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid Email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a psssword'],
    minLegth: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your psssword'],
    select: false,
    validate: {
      // ***** only works in SAVE!! =>>> update must be saved not findByIdAndUpdate
      validator: function (el) {
        return el === this.password
      },
      message: 'Passwords are not the same',
    },
  },
  changedPasswordAt: Date,
  passwordResetToken: String,
  passwordResetExpires: String,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
})

/* userSchema.pre('save', async function (next) { */
/*   // Only run this function if password was actually modified */
/*   if (!this.isModified('password')) return next() */
/**/
/*   // Hash the password with cost of 12 */
/*   this.password = await bcrypt.hash(this.password, 12) */
/**/
/*   // Delete passwordConfirm field */
/*   this.passwordConfirm = undefined */
/*   next() */
/* }) */
/**/
/* userSchema.pre('save', function (next) { */
/*   if (!this.isModified('password') || this.isNew) return next() */
/**/
/*   this.passwordChangedAt = Date.now() - 1000 */
/*   next() */
/* }) */

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } })
  next()
})

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.changedPasswordAt) {
    const passwordTimeStamp = parseInt(
      this.changedPasswordAt.getTime() / 1000,
      10
    )
    console.log(passwordTimeStamp, JWTTimeStamp)
    return JWTTimeStamp < passwordTimeStamp
  }
  return false
}
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex')

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')
  console.log(this.passwordResetToken, { resetToken })
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000
  return resetToken
}

const User = mongoose.model('User', userSchema)

module.exports = User
