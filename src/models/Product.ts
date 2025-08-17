import mongoose, { Schema, model, models } from 'mongoose'

const OptionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    values: { type: [String], default: [] },
  },
  { _id: false }
)

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    category: { type: String, trim: true },
    description: { type: String },
    image: { type: String },
    images: { type: [String], default: [] },

    // ✅ สำคัญ: รองรับตัวเลือก
    options: { type: [OptionSchema], default: [] },

    // ฟิลด์อื่น ๆ ที่คุณใช้อยู่
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    deliveryInfo: { type: String },
    promotions: { type: [String], default: [] },
    stock: { type: Number, default: 999 },
  },
  { timestamps: true, minimize: false }
)

export default models.Product || model('Product', ProductSchema)
