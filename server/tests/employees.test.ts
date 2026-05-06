import request from 'supertest'
import mongoose from 'mongoose'
import app from '../app'
import Employee from '../models/Employee'
import { connectDB, clearDB, disconnectDB } from './setup/dbHelper'

beforeAll(async () => { await connectDB() })
afterEach(async () => { await clearDB() })
afterAll(async () => { await disconnectDB() })

// ─── helpers ────────────────────────────────────────────────────────────────

async function createEmployee(overrides: Partial<{ name: string; phone: string; isActive: boolean }> = {}) {
  return Employee.create({ name: 'Jane Doe', phone: '12345678', isActive: true, ...overrides })
}

const INVALID_ID = 'not-an-object-id'

// ─── GET /api/employees ──────────────────────────────────────────────────────

describe('GET /api/employees', () => {
  it('returns an empty array when there are no employees', async () => {
    const res = await request(app).get('/api/employees')
    expect(res.status).toBe(200)
    expect(res.body).toEqual([])
  })

  it('returns all employees sorted by createdAt descending', async () => {
    await createEmployee({ name: 'Alice' })
    await createEmployee({ name: 'Bob' })

    const res = await request(app).get('/api/employees')
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(2)
    // newest first
    expect(new Date(res.body[0].createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(res.body[1].createdAt).getTime()
    )
  })

  it('returns employees with all expected fields', async () => {
    await createEmployee()
    const res = await request(app).get('/api/employees')
    const emp = res.body[0]
    expect(emp).toHaveProperty('_id')
    expect(emp).toHaveProperty('name', 'Jane Doe')
    expect(emp).toHaveProperty('phone', '12345678')
    expect(emp).toHaveProperty('isActive', true)
    expect(emp).toHaveProperty('createdAt')
    expect(emp).toHaveProperty('updatedAt')
  })
})

// ─── POST /api/employees ─────────────────────────────────────────────────────

describe('POST /api/employees', () => {
  it('creates a new employee and returns 201', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ name: 'John Smith', phone: '98765432', isActive: true })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ name: 'John Smith', phone: '98765432', isActive: true })
    expect(res.body._id).toBeDefined()
  })

  it('defaults isActive to true when not provided', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ name: 'No Active Field', phone: '11122233' })

    expect(res.status).toBe(201)
    expect(res.body.isActive).toBe(true)
  })

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ phone: '12345678' })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/name/i)
  })

  it('returns 400 when phone is missing', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ name: 'No Phone' })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/phone/i)
  })

  it('returns 400 when name exceeds 100 characters', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ name: 'A'.repeat(101), phone: '12345678' })

    expect(res.status).toBe(400)
    expect(res.body.message).toBeDefined()
  })

  it('returns 400 when phone is not exactly 8 digits', async () => {
    for (const phone of ['123', '123456789', '1234abcd', '']) {
      const res = await request(app)
        .post('/api/employees')
        .send({ name: 'Valid Name', phone })

      expect(res.status).toBe(400)
      expect(res.body.message).toBeDefined()
    }
  })

  it('trims whitespace from name and phone', async () => {
    const res = await request(app)
      .post('/api/employees')
      .send({ name: '  Trimmed Name  ', phone: '  12345678  ' })

    expect(res.status).toBe(201)
    expect(res.body.name).toBe('Trimmed Name')
    expect(res.body.phone).toBe('12345678')
  })

  it('persists the employee to the database', async () => {
    await request(app).post('/api/employees').send({ name: 'Persistent', phone: '00000000' })
    const count = await Employee.countDocuments()
    expect(count).toBe(1)
  })
})

// ─── PUT /api/employees/:id ──────────────────────────────────────────────────

describe('PUT /api/employees/:id', () => {
  it('updates an existing employee and returns the updated document', async () => {
    const emp = await createEmployee()

    const res = await request(app)
      .put(`/api/employees/${emp._id}`)
      .send({ name: 'Updated Name', phone: '99999999', isActive: false })

    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ name: 'Updated Name', phone: '99999999', isActive: false })
  })

  it('returns 400 for an invalid (non-ObjectId) id', async () => {
    const res = await request(app)
      .put(`/api/employees/${INVALID_ID}`)
      .send({ name: 'X', phone: '12345678' })

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/invalid/i)
  })

  it('returns 404 when the employee does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const res = await request(app)
      .put(`/api/employees/${fakeId}`)
      .send({ name: 'Ghost', phone: '00000000', isActive: true })

    expect(res.status).toBe(404)
    expect(res.body.message).toMatch(/not found/i)
  })

  it('returns 400 when update violates validation (name too long)', async () => {
    const emp = await createEmployee()
    const res = await request(app)
      .put(`/api/employees/${emp._id}`)
      .send({ name: 'A'.repeat(101), phone: '12345678', isActive: true })

    expect(res.status).toBe(400)
  })

  it('can toggle isActive from true to false', async () => {
    const emp = await createEmployee({ isActive: true })
    const res = await request(app)
      .put(`/api/employees/${emp._id}`)
      .send({ name: emp.name, phone: emp.phone, isActive: false })

    expect(res.status).toBe(200)
    expect(res.body.isActive).toBe(false)
  })
})

// ─── DELETE /api/employees/:id ───────────────────────────────────────────────

describe('DELETE /api/employees/:id', () => {
  it('deletes an existing employee and returns a success message', async () => {
    const emp = await createEmployee()

    const res = await request(app).delete(`/api/employees/${emp._id}`)
    expect(res.status).toBe(200)
    expect(res.body.message).toMatch(/deleted/i)
  })

  it('actually removes the document from the database', async () => {
    const emp = await createEmployee()
    await request(app).delete(`/api/employees/${emp._id}`)

    const found = await Employee.findById(emp._id)
    expect(found).toBeNull()
  })

  it('returns 400 for an invalid (non-ObjectId) id', async () => {
    const res = await request(app).delete(`/api/employees/${INVALID_ID}`)
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/invalid/i)
  })

  it('returns 404 when the employee does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const res = await request(app).delete(`/api/employees/${fakeId}`)
    expect(res.status).toBe(404)
    expect(res.body.message).toMatch(/not found/i)
  })
})

// ─── Employee model ──────────────────────────────────────────────────────────

describe('Employee model', () => {
  it('sets isActive default to true', async () => {
    const emp = new Employee({ name: 'Default Active', phone: '12345678' })
    expect(emp.isActive).toBe(true)
  })

  it('fails validation without name', async () => {
    const emp = new Employee({ phone: '12345678' })
    await expect(emp.validate()).rejects.toThrow(/name/i)
  })

  it('fails validation without phone', async () => {
    const emp = new Employee({ name: 'No Phone' })
    await expect(emp.validate()).rejects.toThrow(/phone/i)
  })

  it('fails validation with name over 100 chars', async () => {
    const emp = new Employee({ name: 'A'.repeat(101), phone: '12345678' })
    await expect(emp.validate()).rejects.toThrow()
  })

  it('fails validation when phone is not exactly 8 digits', async () => {
    const emp = new Employee({ name: 'Valid', phone: '123' })
    await expect(emp.validate()).rejects.toThrow()
  })
})
