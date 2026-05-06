import winston from 'winston'
import morgan from 'morgan'
import path from 'path'
import fs from 'fs'

const logsDir = path.join(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true })

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const extras = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''
    return `[${timestamp}] ${level}: ${message}${extras}`
  })
)

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
)

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console({ format: consoleFormat }),
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error', format: fileFormat }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log'), format: fileFormat }),
  ],
})

export const httpLogger = morgan(
  ':method :url :status :res[content-length] bytes - :response-time ms',
  { stream: { write: (msg: string) => logger.info(msg.trim()) } }
)
