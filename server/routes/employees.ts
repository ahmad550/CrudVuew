import { Router, Request, Response } from 'express'
import mongoose from 'mongoose'
import Employee from '../models/Employee'
import { logger } from '../logger'

interface IdParams {
  id: string
}

const router = Router()

function isValidId(id: string): boolean {
  return mongoose.isValidObjectId(id)
}

// GET all employees
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 })
    res.json(employees)
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('GET /employees failed', { message: error.message, stack: error.stack })
    res.status(500).json({ message: 'Server error' })
  }
})

// POST create employee
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, phone, isActive } = req.body
    const employee = new Employee({ name, phone, isActive })
    const saved = await employee.save()
    res.status(201).json(saved)
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.warn('POST /employees validation failed', { message: error.message })
    res.status(400).json({ message: error.message })
  }
})

// PUT update employee
router.put('/:id', async (req: Request<IdParams>, res: Response): Promise<void> => {
  if (!isValidId(req.params.id)) {
    res.status(400).json({ message: 'Invalid employee ID' })
    return
  }
  try {
    const { name, phone, isActive } = req.body
    const updated = await Employee.findByIdAndUpdate(
      req.params.id,
      { name, phone, isActive },
      { new: true, runValidators: true }
    )
    if (!updated) {
      res.status(404).json({ message: 'Employee not found' })
      return
    }
    res.json(updated)
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.warn('PUT /employees/:id validation failed', { id: req.params.id, message: error.message })
    res.status(400).json({ message: error.message })
  }
})

// DELETE employee
router.delete('/:id', async (req: Request<IdParams>, res: Response): Promise<void> => {
  if (!isValidId(req.params.id)) {
    res.status(400).json({ message: 'Invalid employee ID' })
    return
  }
  try {
    const deleted = await Employee.findByIdAndDelete(req.params.id)
    if (!deleted) {
      res.status(404).json({ message: 'Employee not found' })
      return
    }
    res.json({ message: 'Employee deleted' })
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.error('DELETE /employees/:id failed', { id: req.params.id, message: error.message, stack: error.stack })
    res.status(500).json({ message: 'Server error' })
  }
})

export default router
