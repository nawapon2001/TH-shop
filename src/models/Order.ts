import mongoose from 'mongoose'

const OrderSchema = new mongoose.Schema({
  name: String,
  address: String,
  phone: String,
  items: [{ name: String, price: Number, _id: String }],
  createdAt: Date,
  shippingNumber: String, // เพิ่มฟิลด์เลขขนส่ง
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'shipped', 'completed', 'cancelled'],
    default: 'pending'
  }
})

export default mongoose.models.Order || mongoose.model('Order', OrderSchema)
