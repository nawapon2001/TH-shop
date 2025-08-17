import { Schema, model, models } from 'mongoose'

const ItemSchema = new Schema({
  name: String,
  price: Number,
  image: String,
  qty: { type: Number, default: 1, min: 1 },
}, { _id: false })

const MessageSchema = new Schema({
  role: { type: String, enum: ['shop', 'customer'], required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: false })

const OrderSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true },
  items: { type: [ItemSchema], default: [] },
  status: { type: String, enum: ['pending','processing','paid','shipped','completed','cancelled'], default: 'pending' },
  shippingNumber: String,
  amounts: {
    subtotal: Number,
    shipCost: Number,
    codFee: Number,
    total: Number,
  },
  delivery: { type: String, enum: ['standard','express'] },
  payment: { type: String, enum: ['cod','transfer','card'] },
  messages: { type: [MessageSchema], default: [] },
}, { timestamps: true })

export default models.Order || model('Order', OrderSchema)
