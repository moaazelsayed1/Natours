const fs = require('fs')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const Tour = require('../../model/tourModel')

dotenv.config({ path: './config.env' })

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
)

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    /* useCreateIndex: true, */
    /* useFindAndModify: false, */
  })
  .then(() => console.log('BD connection successful'))

const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf8')
)

// import all tours-simple into DATABASE
const importData = async () => {
  try {
    await Tour.create(tours)
    console.log('data loaded successfully')
  } catch (err) {
    console.log(err)
  }
    process.exit()
}

// Delete all data in DB
const deleteData = async () => {
  try {
    await Tour.deleteMany()
    console.log('All data deleted')
  } catch (err) {
    console.log(err)
  }
    process.exit()
}

if (process.argv[2] === '--import') {
  importData()
} else if (process.argv[2] === '--delete') {
  deleteData()
}

console.log(process.argv)
