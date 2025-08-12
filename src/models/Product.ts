import mongoose from 'mongoose'

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String }, // base64 หรือ URL (ภาพหลัก)
  images: [{ type: String }], // เพิ่ม field สำหรับเก็บรูปหลายรูป
  description: { type: String },
  category: { type: String }, // เพิ่มหมวดหมู่
}, { timestamps: true })

export default mongoose.models.Product || mongoose.model('Product', ProductSchema)
