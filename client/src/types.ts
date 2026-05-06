export interface Employee {
  _id: string
  name: string
  phone: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EmployeeForm {
  name: string
  phone: string
  isActive: boolean
}
