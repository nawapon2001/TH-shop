import mongoose from 'mongoose'

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'ชื่อหมวดหมู่เป็นข้อมูลที่จำเป็น'],
    unique: true,
    trim: true,
    minlength: [2, 'ชื่อหมวดหมู่ต้องมีอย่างน้อย 2 ตัวอักษร'],
    maxlength: [50, 'ชื่อหมวดหมู่ต้องไม่เกิน 50 ตัวอักษร']
  },
  icon: {
    type: String,
    default: null
  },
  description: {
    type: String,
    maxlength: [200, 'คำอธิบายต้องไม่เกิน 200 ตัวอักษร'],
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  productCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// Create index for better performance
CategorySchema.index({ name: 1 })
CategorySchema.index({ isActive: 1 })

// Update updatedAt on save
CategorySchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

export default mongoose.models.Category || mongoose.model('Category', CategorySchema)
