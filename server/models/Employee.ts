import mongoose, { Document, Schema } from 'mongoose'

export interface IEmployee extends Document {
  name: string
  phone: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const employeeSchema = new Schema<IEmployee>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
      match: [/^\d{8}$/, 'Phone must be exactly 8 digits'],
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
)

export default mongoose.model<IEmployee>('Employee', employeeSchema)
