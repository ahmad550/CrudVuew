import mongoose from 'mongoose'

export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/crudvuew_test'
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri)
  }
}

export async function clearDB() {
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}

export async function disconnectDB() {
  await mongoose.connection.dropDatabase()
  await mongoose.connection.close()
}
