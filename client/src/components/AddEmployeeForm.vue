<template>
  <div class="card">
    <h2>Add Employee</h2>
    <div class="form-row">
      <input v-model="form.name" placeholder="Full Name" maxlength="100" />
      <input
        v-model="form.phone"
        placeholder="Phone Number (8 digits)"
        maxlength="8"
        pattern="\d{8}"
        inputmode="numeric"
      />
      <label class="checkbox-label">
        <input type="checkbox" v-model="form.isActive" />
        Active
      </label>
      <button
        @click="submit"
        class="btn btn-primary"
        :disabled="!form.name.trim() || !/^\d{8}$/.test(form.phone)"
      >
        Add Employee
      </button>
    </div>
    <p v-if="formError" class="error">{{ formError }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useEmployees } from '../composables/useEmployees'
import type { EmployeeForm } from '../types'

const emit = defineEmits<{ submitted: [] }>()

const { formError, addEmployee } = useEmployees()

const form = ref<EmployeeForm>({ name: '', phone: '', isActive: true })

async function submit(): Promise<void> {
  const ok = await addEmployee(form.value)
  if (ok) {
    form.value = { name: '', phone: '', isActive: true }
    emit('submitted')
  }
}
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

.form-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.form-row input[type='text'],
.form-row input:not([type='checkbox']) {
  flex: 1;
  min-width: 140px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d0d7de;
  border-radius: 6px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-row input:not([type='checkbox']):focus {
  border-color: #4a90e2;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.95rem;
  cursor: pointer;
  white-space: nowrap;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: opacity 0.15s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:not(:disabled):hover {
  opacity: 0.85;
}

.btn-primary {
  background: #4a90e2;
  color: #fff;
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
