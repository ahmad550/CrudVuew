import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import axios from 'axios'
import EmployeeList from '../components/EmployeeList.vue'
import type { Employee } from '../types'

vi.mock('axios')
const mockedAxios = vi.mocked(axios, true)

beforeEach(() => {
  vi.clearAllMocks()
})

const makeEmployee = (overrides: Partial<Employee> = {}): Employee => ({
  _id: '64a1b2c3d4e5f6a7b8c9d0e1',
  name: 'Jane Doe',
  phone: '12345678',
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides
})

function mountComponent() {
  return mount(EmployeeList, { attachTo: document.body })
}

// ─── Initial render / fetch ──────────────────────────────────────────────────

describe('initial render', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: [] })
  })

  it('shows the Add Employee form', async () => {
    const wrapper = mountComponent()
    await flushPromises()
    expect(wrapper.find('h2').text()).toContain('Add Employee')
  })

  it('calls GET /api/employees on mount', async () => {
    mountComponent()
    await flushPromises()
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/employees')
  })

  it('shows "No employees yet" when list is empty', async () => {
    const wrapper = mountComponent()
    await flushPromises()
    expect(wrapper.text()).toContain('No employees yet')
  })

  it('renders employee rows when data is returned', async () => {
    mockedAxios.get.mockResolvedValue({ data: [makeEmployee(), makeEmployee({ _id: 'abc', name: 'John' })] })
    const wrapper = mountComponent()
    await flushPromises()
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
  })

  it('displays employee name, phone, and status badge', async () => {
    mockedAxios.get.mockResolvedValue({ data: [makeEmployee()] })
    const wrapper = mountComponent()
    await flushPromises()
    expect(wrapper.text()).toContain('Jane Doe')
    expect(wrapper.text()).toContain('12345678')
    expect(wrapper.text()).toContain('Active')
  })

  it('shows employee count', async () => {
    mockedAxios.get.mockResolvedValue({ data: [makeEmployee(), makeEmployee({ _id: 'id2', name: 'Bob' })] })
    const wrapper = mountComponent()
    await flushPromises()
    expect(wrapper.find('.count').text()).toBe('2')
  })

  it('shows error message when fetch fails', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Network error'))
    const wrapper = mountComponent()
    await flushPromises()
    expect(wrapper.text()).toContain('Failed to load employees')
  })
})

// ─── Add Employee ────────────────────────────────────────────────────────────

describe('addEmployee', () => {
  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: [] })
  })

  it('Add Employee button is disabled when fields are empty', async () => {
    const wrapper = mountComponent()
    await flushPromises()
    const btn = wrapper.find('button.btn-primary')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('Add Employee button is enabled when both fields are filled', async () => {
    const wrapper = mountComponent()
    await flushPromises()
    await wrapper.find('input[placeholder="Full Name"]').setValue('Alice')
    await wrapper.find('input[placeholder="Phone Number (8 digits)"]').setValue('55500011')
    const btn = wrapper.find('button.btn-primary')
    expect((btn.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('posts to /api/employees and re-fetches on success', async () => {
    const newEmp = makeEmployee({ name: 'Alice', phone: '55500011' })
    mockedAxios.post.mockResolvedValue({ data: newEmp })
    mockedAxios.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [newEmp] })

    const wrapper = mountComponent()
    await flushPromises()

    await wrapper.find('input[placeholder="Full Name"]').setValue('Alice')
    await wrapper.find('input[placeholder="Phone Number (8 digits)"]').setValue('55500011')
    await wrapper.find('button.btn-primary').trigger('click')
    await flushPromises()

    expect(mockedAxios.post).toHaveBeenCalledWith('/api/employees', expect.objectContaining({
      name: 'Alice',
      phone: '55500011'
    }))
    expect(mockedAxios.get).toHaveBeenCalledTimes(2)
  })

  it('clears the form after successful add', async () => {
    mockedAxios.post.mockResolvedValue({ data: makeEmployee() })
    mockedAxios.get
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [makeEmployee()] })

    const wrapper = mountComponent()
    await flushPromises()

    const nameInput = wrapper.find<HTMLInputElement>('input[placeholder="Full Name"]')
    await nameInput.setValue('Temp Name')
    await wrapper.find('input[placeholder="Phone Number (8 digits)"]').setValue('11111111')
    await wrapper.find('button.btn-primary').trigger('click')
    await flushPromises()

    expect(nameInput.element.value).toBe('')
  })

  it('shows formError when POST fails', async () => {
    mockedAxios.post.mockRejectedValue({ response: { data: { message: 'Phone is required' } } })
    const wrapper = mountComponent()
    await flushPromises()

    await wrapper.find('input[placeholder="Full Name"]').setValue('Name Only')
    await wrapper.find('input[placeholder="Phone Number (8 digits)"]').setValue('12345678')
    await wrapper.find('button.btn-primary').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Phone is required')
  })
})

// ─── Edit employee ───────────────────────────────────────────────────────────

describe('edit employee', () => {
  const emp = makeEmployee()

  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: [emp] })
  })

  it('clicking Edit shows inline inputs pre-filled with current values', async () => {
    const wrapper = mountComponent()
    await flushPromises()
    await wrapper.find('button.btn-edit').trigger('click')

    const inputs = wrapper.findAll('input.inline-input')
    expect((inputs[0].element as HTMLInputElement).value).toBe(emp.name)
    expect((inputs[1].element as HTMLInputElement).value).toBe(emp.phone)
  })

  it('clicking Cancel restores view mode', async () => {
    const wrapper = mountComponent()
    await flushPromises()
    await wrapper.find('button.btn-edit').trigger('click')
    await wrapper.find('button.btn-cancel').trigger('click')

    expect(wrapper.find('button.btn-edit').exists()).toBe(true)
    expect(wrapper.find('input.inline-input').exists()).toBe(false)
  })

  it('Save calls PUT and re-fetches', async () => {
    const updated = makeEmployee({ name: 'Updated Name' })
    mockedAxios.put.mockResolvedValue({ data: updated })
    mockedAxios.get
      .mockResolvedValueOnce({ data: [emp] })
      .mockResolvedValueOnce({ data: [updated] })

    const wrapper = mountComponent()
    await flushPromises()

    await wrapper.find('button.btn-edit').trigger('click')
    const nameInput = wrapper.find('input.inline-input')
    await nameInput.setValue('Updated Name')
    await wrapper.find('button.btn-sm.btn-primary').trigger('click')
    await flushPromises()

    expect(mockedAxios.put).toHaveBeenCalledWith(
      `/api/employees/${emp._id}`,
      expect.objectContaining({ name: 'Updated Name' })
    )
    expect(mockedAxios.get).toHaveBeenCalledTimes(2)
  })

  it('shows fetchError when Save fails', async () => {
    mockedAxios.put.mockRejectedValue({ response: { data: { message: 'Name too long' } } })
    const wrapper = mountComponent()
    await flushPromises()

    await wrapper.find('button.btn-edit').trigger('click')
    await wrapper.find('button.btn-sm.btn-primary').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Name too long')
  })
})

// ─── Delete employee ─────────────────────────────────────────────────────────

describe('deleteEmployee', () => {
  const emp = makeEmployee()

  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: [emp] })
    window.confirm = vi.fn(() => true)
  })

  it('calls DELETE /api/employees/:id and re-fetches on confirm', async () => {
    mockedAxios.delete.mockResolvedValue({ data: { message: 'Employee deleted' } })
    mockedAxios.get
      .mockResolvedValueOnce({ data: [emp] })
      .mockResolvedValueOnce({ data: [] })

    const wrapper = mountComponent()
    await flushPromises()

    await wrapper.find('button.btn-danger').trigger('click')
    await flushPromises()

    expect(mockedAxios.delete).toHaveBeenCalledWith(`/api/employees/${emp._id}`)
    expect(mockedAxios.get).toHaveBeenCalledTimes(2)
  })

  it('does not call DELETE when user cancels confirm', async () => {
    window.confirm = vi.fn(() => false)

    const wrapper = mountComponent()
    await flushPromises()

    await wrapper.find('button.btn-danger').trigger('click')
    await flushPromises()

    expect(mockedAxios.delete).not.toHaveBeenCalled()
  })

  it('shows fetchError when DELETE fails', async () => {
    mockedAxios.delete.mockRejectedValue({ response: { data: { message: 'Server error' } } })
    const wrapper = mountComponent()
    await flushPromises()

    await wrapper.find('button.btn-danger').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Server error')
  })
})

// ─── Toggle active ───────────────────────────────────────────────────────────

describe('toggleActive', () => {
  const activeEmp = makeEmployee({ isActive: true })

  beforeEach(() => {
    mockedAxios.get.mockResolvedValue({ data: [activeEmp] })
  })

  it('calls PUT with inverted isActive', async () => {
    mockedAxios.put.mockResolvedValue({ data: makeEmployee({ isActive: false }) })
    mockedAxios.get
      .mockResolvedValueOnce({ data: [activeEmp] })
      .mockResolvedValueOnce({ data: [makeEmployee({ isActive: false })] })

    const wrapper = mountComponent()
    await flushPromises()

    await wrapper.find('button.btn-toggle').trigger('click')
    await flushPromises()

    expect(mockedAxios.put).toHaveBeenCalledWith(
      `/api/employees/${activeEmp._id}`,
      expect.objectContaining({ isActive: false })
    )
  })

  it('button label is "Deactivate" when employee is active', async () => {
    const wrapper = mountComponent()
    await flushPromises()
    expect(wrapper.find('button.btn-toggle').text()).toBe('Deactivate')
  })

  it('button label is "Activate" when employee is inactive', async () => {
    mockedAxios.get.mockResolvedValue({ data: [makeEmployee({ isActive: false })] })
    const wrapper = mountComponent()
    await flushPromises()
    expect(wrapper.find('button.btn-toggle').text()).toBe('Activate')
  })
})
