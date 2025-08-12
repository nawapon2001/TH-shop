import mongoose, { Schema } from 'mongoose'

const UserSchema = new Schema({
  fullName: String,
  birthDate: String,
  memberType: String,
  email: { type: String, unique: true },
  password: String
})

export default mongoose.models.User || mongoose.model('User', UserSchema)
