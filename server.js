const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config({ path: './config.env' })

/* process.on('uncaughtException', (err) => { */
/*   console.log(err.name, err.message) */
/*   console.log('uncaughtException! shuting down...') */
/*   process.exit(1) */
/* }) */

const app = require('./app')

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
)

mongoose
  .connect(DB, {
    useNewUrlParser: true,
  })
  .then(() => console.log('BD connection successful'))
  .catch((err) => {
    if (err.code === 8000) {
      console.log('Can not log in to database: Wrong password')
      server.close(() => {
        process.exit(1)
      })
    }
  })

/* console.log(process.env) */

const port = process.env.PORT || 3000
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`App running on port ${port}`)
})

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message)
  console.log('unhandledRejection! shuting down...')
  server.close(() => {
    process.exit(1)
  })
})
