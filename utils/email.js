const nodemailer = require('nodemailer')

const sendEmail = async (options) => {
  // 1) create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    // activate less secure app in gmail
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  })
  // 2) define mail options
  const mailOptions = {
    from: 'Moaaz Elsayed <me@moaaz.io',
    to: options.email,
    subject: options.subject,
    text: options.message,
  }

  // 3) send email
  await transporter.sendMail(mailOptions)
}

module.exports = sendEmail
