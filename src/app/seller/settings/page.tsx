'use client'

import React, { useState, useEffect } from 'react'
import SellerSidebar from '@/components/SellerSidebar'
import { 
  Store, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  Eye, 
  EyeOff,
  Edit3,
  Upload,
  X,
  Check,
  AlertCircle
} from 'lucide-react'
import Swal from 'sweetalert2'

interface SellerProfile {
  username: string
  email: string
  phone: string
  shopName: string
  description: string
  address: string
  province: string
  shopImage?: string
  bankAccount?: string
  bankName?: string
  accountHolderName?: string
}

export default function SellerSettingsPage() {
  const [seller, setSeller] = useState<string | null>(null)
  const [profile, setProfile] = useState<SellerProfile>({
    username: '',
    email: '',
    phone: '',
    shopName: '',
    description: '',
    address: '',
    province: '',
    shopImage: '',
    bankAccount: '',
    bankName: '',
    accountHolderName: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')

  useEffect(() => {
    const sellerData = localStorage.getItem('seller') || localStorage.getItem('sellerUser')
    if (sellerData) {
      try {
        let sellerUsername = sellerData
        try {
          const parsed = JSON.parse(sellerData)
          sellerUsername = parsed.username || parsed.name || sellerData
        } catch {
          // Use as plain string
        }
        setSeller(sellerUsername)
        fetchProfile(sellerUsername)
      } catch (error) {
        console.error('Error parsing seller data:', error)
        setSeller(null)
        setLoading(false)
      }
    } else {
      setSeller(null)
      setLoading(false)
    }
  }, [])

  const fetchProfile = async (username: string) => {
    try {
      const response = await fetch(`/api/seller-info?username=${encodeURIComponent(username)}`)
      if (response.ok) {
        const data = await response.json()
        setProfile({
          username: data.username || username,
          email: data.email || '',
          phone: data.phone || '',
          shopName: data.shopName || '',
          description: data.description || '',
          address: data.address || '',
          province: data.province || '',
          shopImage: data.shopImage || '',
          bankAccount: data.bankAccount || '',
          bankName: data.bankName || '',
          accountHolderName: data.accountHolderName || ''
        })
        if (data.shopImage) {
          setImagePreview(data.shopImage)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        Swal.fire({
          icon: 'warning',
          title: 'ไฟล์ใหญ่เกินไป',
          text: 'กรุณาเลือกไฟล์ที่มีขนาดไม่เกิน 5MB'
        })
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
    setProfile(prev => ({ ...prev, shopImage: '' }))
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!seller) return

    setSaving(true)
    try {
      let imageUrl = profile.shopImage

      // Upload new image if selected
      if (imageFile) {
        const formData = new FormData()
        formData.append('files', imageFile)
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          imageUrl = uploadData.urls?.[0] || imageUrl
        }
      }

      // Update profile
      const updateData = {
        username: seller,
        ...profile,
        shopImage: imageUrl
      }

      const response = await fetch('/api/seller-info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        setProfile(prev => ({ ...prev, shopImage: imageUrl }))
        setImageFile(null)
        
        Swal.fire({
          icon: 'success',
          title: 'บันทึกข้อมูลสำเร็จ',
          text: 'ข้อมูลร้านค้าของคุณได้รับการอัพเดทแล้ว',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง'
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!seller) return
    
    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'รหัสผ่านไม่ตรงกัน',
        text: 'กรุณาตรวจสอบรหัสผ่านใหม่และยืนยันรหัสผ่าน'
      })
      return
    }

    if (newPassword.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'รหัสผ่านสั้นเกินไป',
        text: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร'
      })
      return
    }

    try {
      const response = await fetch('/api/seller-change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: seller,
          currentPassword,
          newPassword
        })
      })

      if (response.ok) {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        
        Swal.fire({
          icon: 'success',
          title: 'เปลี่ยนรหัสผ่านสำเร็จ',
          text: 'รหัสผ่านของคุณได้รับการอัพเดทแล้ว',
          timer: 2000,
          showConfirmButton: false
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to change password')
      }
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: error.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้'
      })
    }
  }

  if (!seller) {
    return (
      <div className="flex min-h-screen">
        <SellerSidebar />
        <div className="flex-1 lg:ml-72 p-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                กรุณาเข้าสู่ระบบ
              </h3>
              <p className="text-gray-600 mb-4">
                คุณต้องเข้าสู่ระบบในฐานะผู้ขายเพื่อจัดการตั้งค่า
              </p>
              <button
                onClick={() => window.location.href = '/seller/auth'}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl transition-colors font-medium"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      <SellerSidebar />
      <div className="flex-1 lg:ml-72">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-pink-500 text-white p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Store className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">ตั้งค่าร้านค้า</h1>
                <p className="text-orange-100">
                  จัดการข้อมูลร้านค้าและรูปภาพของคุณ
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-8">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Shop Image Section */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                  <Camera className="w-6 h-6 text-orange-600" />
                  รูปภาพร้านค้า
                </h3>
                
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1">
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-orange-400 transition-colors">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Shop preview"
                            className="w-full max-w-xs mx-auto h-48 object-cover rounded-xl shadow-lg"
                          />
                          <button
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-lg font-medium mb-2">อัพโหลดรูปภาพร้านค้า</p>
                          <p className="text-sm">JPG, PNG หรือ GIF (ไม่เกิน 5MB)</p>
                        </div>
                      )}
                    </div>
                    
                    <input
                      type="file"
                      id="shopImage"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    
                    <div className="mt-4 flex gap-3">
                      <label
                        htmlFor="shopImage"
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl transition-colors font-medium cursor-pointer text-center flex items-center justify-center gap-2"
                      >
                        <Upload className="w-5 h-5" />
                        เลือกรูปภาพ
                      </label>
                      {imagePreview && (
                        <button
                          onClick={removeImage}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                        >
                          ลบรูป
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shop Information */}
              <form onSubmit={handleProfileUpdate} className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                  <Edit3 className="w-6 h-6 text-orange-600" />
                  ข้อมูลร้านค้า
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อผู้ใช้
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={profile.username}
                        disabled
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อร้านค้า
                    </label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={profile.shopName}
                        onChange={(e) => setProfile(prev => ({ ...prev, shopName: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="ชื่อร้านค้าของคุณ"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      อีเมล
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="อีเมลของคุณ"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เบอร์โทรศัพท์
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="เบอร์โทรศัพท์"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      คำอธิบายร้านค้า
                    </label>
                    <textarea
                      value={profile.description}
                      onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                      placeholder="บอกเล่าเกี่ยวกับร้านค้าของคุณ..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ที่อยู่
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                      <textarea
                        value={profile.address}
                        onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                        rows={3}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                        placeholder="ที่อยู่ร้านค้า"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      จังหวัด
                    </label>
                    <input
                      type="text"
                      value={profile.province}
                      onChange={(e) => setProfile(prev => ({ ...prev, province: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="จังหวัด"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">ข้อมูลธนาคาร</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ธนาคาร
                      </label>
                      <input
                        type="text"
                        value={profile.bankName}
                        onChange={(e) => setProfile(prev => ({ ...prev, bankName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="ชื่อธนาคาร"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        เลขที่บัญชี
                      </label>
                      <input
                        type="text"
                        value={profile.bankAccount}
                        onChange={(e) => setProfile(prev => ({ ...prev, bankAccount: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="เลขที่บัญชีธนาคาร"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ชื่อผู้ถือบัญชี
                      </label>
                      <input
                        type="text"
                        value={profile.accountHolderName}
                        onChange={(e) => setProfile(prev => ({ ...prev, accountHolderName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="ชื่อผู้ถือบัญชีธนาคาร"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-8 py-3 rounded-xl transition-colors font-medium"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        กำลังบันทึก...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        บันทึกข้อมูล
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Password Change Section */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                  เปลี่ยนรหัสผ่าน
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      รหัสผ่านปัจจุบัน
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="รหัสผ่านปัจจุบัน"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      รหัสผ่านใหม่
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="รหัสผ่านใหม่"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ยืนยันรหัสผ่านใหม่
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="ยืนยันรหัสผ่านใหม่"
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handlePasswordChange}
                    disabled={!currentPassword || !newPassword || !confirmPassword}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-3 rounded-xl transition-colors font-medium"
                  >
                    <Check className="w-5 h-5" />
                    เปลี่ยนรหัสผ่าน
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
