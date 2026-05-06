<template>
  <tr>
    <!-- View Mode -->
    <template v-if="editingId !== emp._id">
      <td>{{ emp.name }}</td>
      <td>{{ emp.phone }}</td>
      <td>
        <span :class="['badge', emp.isActive ? 'badge-active' : 'badge-inactive']">
          {{ emp.isActive ? 'Active' : 'Inactive' }}
        </span>
      </td>
      <td class="actions">
        <button @click="emit('edit', emp)" class="btn btn-sm btn-edit">Edit</button>
        <button @click="emit('toggle-active', emp)" class="btn btn-sm btn-toggle">
          {{ emp.isActive ? 'Deactivate' : 'Activate' }}
        </button>
        <button @click="emit('delete', emp._id)" class="btn btn-sm btn-danger">Delete</button>
      </td>
    </template>

    <!-- Edit Mode -->
    <template v-else>
      <td><input v-model="editForm.name" class="inline-input" maxlength="100" /></td>
      <td>
        <input
          v-model="editForm.phone"
          class="inline-input"
          maxlength="8"
          pattern="\d{8}"
          inputmode="numeric"
        />
      </td>
      <td>
        <label class="checkbox-label">
          <input type="checkbox" v-model="editForm.isActive" />
          Active
        </label>
      </td>
      <td class="actions">
        <button
          @click="emit('save-edit', emp._id, editForm)"
          class="btn btn-sm btn-primary"
          :disabled="!editForm.name.trim() || !/^\d{8}$/.test(editForm.phone)"
        >
          Save
        </button>
        <button @click="emit('cancel-edit')" class="btn btn-sm btn-cancel">Cancel</button>
      </td>
    </template>
  </tr>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Employee, EmployeeForm } from '../types'

const props = defineProps<{
  emp: Employee
  editingId: string | null
}>()

const emit = defineEmits<{
  edit: [emp: Employee]
  'cancel-edit': []
  'save-edit': [id: string, form: EmployeeForm]
  delete: [id: string]
  'toggle-active': [emp: Employee]
}>()

const editForm = ref<EmployeeForm>({
  name: props.emp.name,
  phone: props.emp.phone,
  isActive: props.emp.isActive,
})

watch(
  () => props.editingId,
  (id) => {
    if (id === props.emp._id) {
      editForm.value = { name: props.emp.name, phone: props.emp.phone, isActive: props.emp.isActive }
    }
  }
)
</script>

<style scoped>
.inline-input {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 1px solid #4a90e2;
  border-radius: 4px;
  font-size: 0.9rem;
  outline: none;
}

.badge {
  display: inline-block;
  padding: 0.2rem 0.65rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.badge-active {
  background: #e6f4ea;
  color: #1a7f37;
}

.badge-inactive {
  background: #fde8e8;
  color: #c0392b;
}

.actions {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
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

.btn-sm {
  padding: 0.3rem 0.65rem;
  font-size: 0.82rem;
}

.btn-primary {
  background: #4a90e2;
  color: #fff;
}

.btn-edit {
  background: #f0ad4e;
  color: #fff;
}

.btn-toggle {
  background: #5bc0de;
  color: #fff;
}

.btn-danger {
  background: #e74c3c;
  color: #fff;
}

.btn-cancel {
  background: #adb5bd;
  color: #fff;
}
</style>
