import 'dotenv/config'
import mongoose from 'mongoose'
import app from './app'
import { logger } from './logger'

const PORT: number = parseInt(process.env.PORT || '5000', 10)
const MONGO_URI: string = process.env.MONGO_URI || 'mongodb://localhost:27017/crudvuew'

mongoose
  .connect(MONGO_URI)
  .then(() => {
    logger.info('Connected to MongoDB')
    app.listen(PORT, () => logger.info('Server started', { port: PORT }))
  })
  .catch((err: Error) => {
    logger.error('MongoDB connection failed', { message: err.message, stack: err.stack })
    process.exit(1)
  })
