import { ref } from 'vue'
import axios from 'axios'
import type { Employee, EmployeeForm } from '../types'

const API: string = import.meta.env.VITE_API_URL + '/employees'

// Shared state — all callers of useEmployees() see the same refs
const employees = ref<Employee[]>([])
const loading = ref<boolean>(false)
const fetchError = ref<string>('')
const formError = ref<string>('')

export function useEmployees() {
  async function fetchEmployees(): Promise<void> {
    loading.value = true
    fetchError.value = ''
    try {
      const { data } = await axios.get<Employee[]>(API)
      employees.value = data
    } catch {
      fetchError.value = 'Failed to load employees. Is the server running?'
    } finally {
      loading.value = false
    }
  }

  async function addEmployee(form: EmployeeForm): Promise<boolean> {
    formError.value = ''
    try {
      await axios.post<Employee>(API, form)
      await fetchEmployees()
      return true
    } catch (e: any) {
      formError.value = e.response?.data?.message || 'Failed to add employee.'
      return false
    }
  }

  async function saveEdit(id: string, form: EmployeeForm): Promise<boolean> {
    try {
      await axios.put<Employee>(`${API}/${id}`, form)
      await fetchEmployees()
      return true
    } catch (e: any) {
      fetchError.value = e.response?.data?.message || 'Failed to update employee.'
      return false
    }
  }

  async function deleteEmployee(id: string): Promise<boolean> {
    try {
      await axios.delete(`${API}/${id}`)
      await fetchEmployees()
      return true
    } catch (e: any) {
      fetchError.value = e.response?.data?.message || 'Failed to delete employee.'
      return false
    }
  }

  async function toggleActive(emp: Employee): Promise<void> {
    try {
      await axios.put<Employee>(`${API}/${emp._id}`, {
        name: emp.name,
        phone: emp.phone,
        isActive: !emp.isActive,
      })
      await fetchEmployees()
    } catch (e: any) {
      fetchError.value = e.response?.data?.message || 'Failed to update status.'
    }
  }

  return {
    employees,
    loading,
    fetchError,
    formError,
    fetchEmployees,
    addEmployee,
    saveEdit,
    deleteEmployee,
    toggleActive,
  }
}
