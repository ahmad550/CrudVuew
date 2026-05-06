<template src="./EmployeeList.html"></template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import type { Employee, EmployeeForm } from '../types'

const API: string = import.meta.env.VITE_API_URL + '/employees'

const employees = ref<Employee[]>([])
const loading = ref<boolean>(false)
const fetchError = ref<string>('')
const formError = ref<string>('')

const form = ref<EmployeeForm>({ name: '', phone: '', isActive: true })
const editForm = ref<EmployeeForm>({ name: '', phone: '', isActive: true })
const editingId = ref<string | null>(null)

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

async function addEmployee(): Promise<void> {
  formError.value = ''
  try {
    await axios.post<Employee>(API, form.value)
    form.value = { name: '', phone: '', isActive: true }
    await fetchEmployees()
  } catch (e: any) {
    formError.value = e.response?.data?.message || 'Failed to add employee.'
  }
}

function startEdit(emp: Employee): void {
  editingId.value = emp._id
  editForm.value = { name: emp.name, phone: emp.phone, isActive: emp.isActive }
}

function cancelEdit(): void {
  editingId.value = null
}

async function saveEdit(id: string): Promise<void> {
  try {
    await axios.put<Employee>(`${API}/${id}`, editForm.value)
    editingId.value = null
    await fetchEmployees()
  } catch (e: any) {
    fetchError.value = e.response?.data?.message || 'Failed to update employee.'
  }
}

async function deleteEmployee(id: string): Promise<void> {
  if (!confirm('Are you sure you want to delete this employee?')) return
  try {
    await axios.delete(`${API}/${id}`)
    await fetchEmployees()
  } catch (e: any) {
    fetchError.value = e.response?.data?.message || 'Failed to delete employee.'
  }
}

async function toggleActive(emp: Employee): Promise<void> {
  try {
    await axios.put<Employee>(`${API}/${emp._id}`, {
      name: emp.name,
      phone: emp.phone,
      isActive: !emp.isActive
    })
    await fetchEmployees()
  } catch (e: any) {
    fetchError.value = e.response?.data?.message || 'Failed to update status.'
  }
}

onMounted(fetchEmployees)
</script>

<style scoped src="./EmployeeList.css"></style>
