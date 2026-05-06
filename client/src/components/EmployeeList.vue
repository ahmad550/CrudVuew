<template>
  <div>
    <AddEmployeeForm />

    <div class="card">
      <h2>
        Employees
        <span class="count">{{ employees.length }}</span>
      </h2>

      <p v-if="fetchError" class="error">{{ fetchError }}</p>

      <div v-if="loading" class="empty">Loading...</div>

      <table v-else-if="employees.length" class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <EmployeeRow
            v-for="emp in employees"
            :key="emp._id"
            :emp="emp"
            :editingId="editingId"
            @edit="startEdit"
            @cancel-edit="cancelEdit"
            @save-edit="handleSaveEdit"
            @delete="handleDelete"
            @toggle-active="toggleActive"
          />
        </tbody>
      </table>

      <p v-else-if="!loading" class="empty">No employees yet. Add one above.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useEmployees } from '../composables/useEmployees'
import AddEmployeeForm from './AddEmployeeForm.vue'
import EmployeeRow from './EmployeeRow.vue'
import type { Employee, EmployeeForm } from '../types'

const { employees, loading, fetchError, fetchEmployees, saveEdit, deleteEmployee, toggleActive } =
  useEmployees()

const editingId = ref<string | null>(null)

function startEdit(emp: Employee): void {
  editingId.value = emp._id
}

function cancelEdit(): void {
  editingId.value = null
}

async function handleSaveEdit(id: string, form: EmployeeForm): Promise<void> {
  const ok = await saveEdit(id, form)
  if (ok) editingId.value = null
}

async function handleDelete(id: string): Promise<void> {
  if (!confirm('Are you sure you want to delete this employee?')) return
  await deleteEmployee(id)
}

onMounted(fetchEmployees)
</script>

<style scoped>
.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.card h2 {
  font-size: 1.2rem;
  color: #2c3e50;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.count {
  background: #4a90e2;
  color: #fff;
  border-radius: 12px;
  padding: 0.1rem 0.55rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.table th,
.table td {
  text-align: left;
  padding: 0.7rem 0.9rem;
  border-bottom: 1px solid #f0f2f5;
}

.table thead th {
  background: #f8f9fa;
  font-weight: 600;
  color: #555;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.table tbody tr:hover {
  background: #f8fbff;
}

.empty {
  color: #888;
  text-align: center;
  padding: 2rem 0;
  font-size: 0.95rem;
}

.error {
  color: #c0392b;
  font-size: 0.88rem;
  margin-top: 0.5rem;
  background: #fde8e8;
  padding: 0.4rem 0.75rem;
  border-radius: 4px;
}
</style>
