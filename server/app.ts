import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import employeeRoutes from './routes/employees'
import { logger, httpLogger } from './logger'

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json({ limit: '10kb' }))
app.use(httpLogger)

app.use('/api/employees', employeeRoutes)

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error('Unhandled route error', { message: err.message, stack: err.stack })
  res.status(500).json({ message: 'Internal server error' })
})

export default app
