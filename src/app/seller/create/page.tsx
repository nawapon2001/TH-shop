'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Swal from 'sweetalert2'
import { Store, User, Phone, Upload, X, Image } from 'lucide-react'

export default function SellerCreatePage() {
  const router = useRouter()
  const search = useSearchParams()
  const usernameFromQuery = search?.get('username') || ''

  const [username, setUsername] = useState(usernameFromQuery)
  const [shopName, setShopName] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [province, setProvince] = useState('')
  const [address, setAddress] = useState('')
  const [profileImage, setProfileImage] = useState('') // URL fallback
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null) // actual file
  const [imagePreview, setImagePreview] = useState<string>('') // preview URL
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Handle file selection and preview
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImageFile(file)
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
  }

  const removeImage = () => {
    setProfileImageFile(null)
    setImagePreview('')
    setProfileImage('')
  }

  // prefill from MongoDB via API (fallback to localStorage)
  useEffect(()=> {
    if (usernameFromQuery) setUsername(usernameFromQuery)

    const tryFillFromApi = async (uname?: string) => {
      if (!uname) return
      try {
        const res = await fetch(`/api/seller-info?username=${encodeURIComponent(uname)}`)
        if (!res.ok) return
        const p = await res.json().catch(()=>null)
        if (!p) return
        setUsername(prev => prev || p.username || '')
        setShopName(p.shopName || '')
        setFullName(p.fullName || '')
        setPhone(p.phone || '')
        setEmail(p.email || '')
        setProvince(p.province || '')
        setProfileImage(p.image || '')
        if (p.image) setImagePreview(p.image)
        setAddress(p.address || '')
      } catch {
        // ignore API errors here; fallback to localStorage below
      }
    }

    // try API first
    (async () => {
      if (usernameFromQuery) {
        await tryFillFromApi(usernameFromQuery)
      } else {
        // try to read username from localStorage and attempt API fetch
        const stored = typeof window !== 'undefined' ? localStorage.getItem('sellerUser') : null
        if (stored) {
          setUsername(stored)
          await tryFillFromApi(stored)
        }
      }

      // fallback: if API didn't populate fields, use any saved registration profile
      try {
        const raw = typeof window !== 'undefined' ? localStorage.getItem('sellerProfile') : null
        if (raw) {
          const p = JSON.parse(raw)
          setUsername(prev => prev || p.username || '')
          setShopName(prev => prev || p.shopName || '')
          setFullName(prev => prev || p.fullName || '')
          setPhone(prev => prev || p.phone || '')
          setEmail(prev => prev || p.email || '')
          setProvince(prev => prev || p.province || '')
          setProfileImage(prev => prev || p.image || '')
          setAddress(prev => prev || p.address || '')
        }
      } catch { /* ignore */ }
    })()
  }, [usernameFromQuery])

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!username?.trim() || !shopName.trim() || !fullName.trim() || !phone.trim()) {
      return Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลที่จำเป็น: username, ชื่อร้าน, ชื่อ-นามสกุล, เบอร์โทร' })
    }
    setLoading(true)
    try {
      // If user selected a file, upload it first and use returned URL
      let imageUrl: string | undefined = profileImage?.trim() || undefined
      if (profileImageFile) {
        setUploadingImage(true)
        const fd = new FormData()
        fd.append('file', profileImageFile)
        const up = await fetch('/api/upload', { method: 'POST', body: fd })
        if (!up.ok) throw new Error('upload failed')
        const upj = await up.json().catch(()=>({}))
        imageUrl = Array.isArray(upj?.urls) && upj.urls[0] ? upj.urls[0] : imageUrl
        setUploadingImage(false)
      }
      
      const payload = {
        username: username.trim(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        shopName: shopName.trim(),
        image: imageUrl,
        email: email.trim() || undefined,
        province: province.trim() || undefined,
        address: address.trim() || undefined,
      }
      const res = await fetch('/api/seller-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const err = await res.json().catch(()=>({}))
        throw new Error(err?.message || 'สร้างร้านค้าไม่สำเร็จ')
      }
      const created = await res.json().catch(()=>({}))
      // persist sellerUser so admin pages work
      localStorage.setItem('sellerUser', username.trim())
      try { localStorage.removeItem('sellerProfile') } catch {}
      Swal.fire({ icon: 'success', title: 'สร้างร้านค้าสำเร็จ', timer: 1200, showConfirmButton: false })
      router.push('/seller/adminSeller')
    } catch (err:any) {
      Swal.fire({ icon: 'error', title: 'ไม่สามารถสร้างร้านค้าได้', text: err?.message || '' })
    } finally {
      setLoading(false)
      setUploadingImage(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-lg">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-orange-800">สร้างร้านค้าใหม่</h1>
              <p className="text-slate-600">เริ่มต้นการขายออนไลน์ของคุณ</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleCreate} className="bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden">
          {/* Progress bar */}
          <div className="h-2 bg-gradient-to-r from-orange-500 to-amber-400"></div>
          
          <div className="p-8">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left: Profile Image Upload */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <h3 className="text-lg font-semibold text-orange-800 mb-4">รูปโปรไฟล์ร้าน</h3>
                  
                  <div className="relative">
                    {/* Image Preview */}
                    <div className="w-full aspect-square rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/50 overflow-hidden mb-4">
                      {imagePreview ? (
                        <div className="relative w-full h-full">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-orange-100/50 transition">
                          <Upload className="w-12 h-12 text-orange-400 mb-2" />
                          <span className="text-orange-700 font-medium">อัปโหลดรูปร้าน</span>
                          <span className="text-xs text-slate-500 mt-1">PNG, JPG (แนะนำ 1:1)</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {/* URL Input Alternative */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">หรือใส่ URL รูปภาพ</label>
                      <input
                        value={profileImage}
                        onChange={(e) => {
                          setProfileImage(e.target.value)
                          if (e.target.value && !profileImageFile) {
                            setImagePreview(e.target.value)
                          }
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-300 outline-none"
                      />
                    </div>

                    {uploadingImage && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                        <div className="text-center">
                          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <span className="text-sm text-orange-700">กำลังอัปโหลด...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Form Fields */}
              <div className="lg:col-span-2 space-y-6">
                {/* Required Fields */}
                <div>
                  <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-gradient-to-b from-orange-500 to-amber-400 rounded-full"></span>
                    ข้อมูลพื้นฐาน
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อบัญชี *</label>
                      <input
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-300 outline-none"
                        placeholder="username"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อร้านค้า *</label>
                      <input
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-300 outline-none"
                        placeholder="เช่น TH-THAI Shop"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">ชื่อ-นามสกุล *</label>
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-300 outline-none"
                        placeholder="ชื่อ-นามสกุลจริง"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">เบอร์โทร *</label>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-300 outline-none"
                        placeholder="08xxxxxxxx"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Fields */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <span className="w-2 h-6 bg-gradient-to-b from-slate-400 to-slate-300 rounded-full"></span>
                    ข้อมูลเพิ่มเติม
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">อีเมล</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-300 outline-none"
                        placeholder="you@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">จังหวัด</label>
                      <input
                        value={province}
                        onChange={(e) => setProvince(e.target.value)}
                        className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-300 outline-none"
                        placeholder="เช่น กรุงเทพมหานคร"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">ที่อยู่</label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={3}
                      className="w-full p-3 border border-orange-200 rounded-xl focus:ring-2 focus:ring-orange-300 focus:border-orange-300 outline-none resize-none"
                      placeholder="ที่อยู่ร้านค้า"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t border-orange-100">
                  <button
                    type="submit"
                    disabled={loading || uploadingImage}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold shadow-lg hover:from-orange-700 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        กำลังสร้างร้าน...
                      </>
                    ) : (
                      <>
                        <Store className="w-5 h-5" />
                        สร้างร้านค้า
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-8 h-12 rounded-xl border border-orange-200 text-orange-700 font-semibold hover:bg-orange-50 transition-all"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            หลังจากสร้างร้านแล้ว คุณสามารถเข้าไปจัดการสินค้าและคำสั่งซื้อได้ทันที
          </p>
        </div>
      </div>
    </div>
  )
}
