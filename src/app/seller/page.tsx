'use client'

import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { PackagePlus, Upload, Tag, Image as ImageIcon } from 'lucide-react'
import ProductOptionsManager from '@/components/ProductOptionsManager'

type ProductOptionValue = {
  value: string
  price: number
  priceType: 'add' | 'replace'
}

type ProductOption = {
  name: string
  values: ProductOptionValue[]
}

type SellerProduct = {
  _id?: string
  name: string
  price: number
  description?: string
  category?: string
  image?: string
  images?: string[] // Support multiple images
  seller?: string
  options?: ProductOption[]
}
type SellerUser = { username: string; password: string }

export default function SellerPage() {
  // Update document title
  useEffect(() => {
    document.title = 'ร้านค้า | TH-THAI SHOP'
  }, [])
  // Auth state
  const [sellerUser, setSellerUser] = useState<string | null>(null)
  const [sellerPass, setSellerPass] = useState('')
  const [authMode, setAuthMode] = useState<'login'|'register'>('login')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  // Product state
  const [name, setName] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [products, setProducts] = useState<SellerProduct[]>([])
  const [options, setOptions] = useState<ProductOption[]>([]) // Product options
  const [categories, setCategories] = useState<string[]>([]) // Categories from database
  useEffect(() => {
    try {
      const u = typeof window !== 'undefined' ? localStorage.getItem('sellerUser') : null
      if (u) {
        let uname = u
        try {
          let cur = u
          for (let i = 0; i < 5; i++) {
            try { const next = decodeURIComponent(cur); if (next === cur) break; cur = next } catch { break }
          }
          uname = cur
        } catch {}
        setSellerUser(uname)
      }
    } catch (err) {
      // ignore
    }
  }, [])

  // prevent redirect race by marking when we've checked localStorage
  const [checkedAuth, setCheckedAuth] = useState(false)
  useEffect(() => {
    try {
      const u = typeof window !== 'undefined' ? localStorage.getItem('sellerUser') : null
      if (u) {
        let uname = u
        try {
          let cur = u
          for (let i = 0; i < 5; i++) {
            try { const next = decodeURIComponent(cur); if (next === cur) break; cur = next } catch { break }
          }
          uname = cur
        } catch {}
        setSellerUser(uname)
      }
    } catch {}
    setCheckedAuth(true)
  }, [])

  // Load products for seller
  useEffect(() => {
    if (!sellerUser) return
    setLoading(true)
    fetch(`/api/seller-products?username=${encodeURIComponent(sellerUser)}`)
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))
  }, [sellerUser])

  // Load categories from database
  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d) && d.length > 0) {
          // Handle both old format (array of strings) and new format (array of objects)
          if (typeof d[0] === 'string') {
            setCategories(d)
          } else {
            // New format with objects - extract names
            setCategories(d.map((cat: any) => cat.name))
          }
        } else {
          // Fallback categories if API returns empty or fails
          setCategories([
            'ป้าย',
            'สติกเกอร์',
            'บัตร',
            'โบรชัวร์',
            'มือถือ & แท็บเล็ต',
            'คอมพิวเตอร์ & เกมมิ่ง',
            'แฟชั่นผู้หญิง',
            'แฟชั่นผู้ชาย',
            'ความงาม & สุขภาพ',
            'บ้าน & ไลฟ์สไตล์',
            'ซูเปอร์มาร์เก็ต',
            'อิเล็กทรอนิกส์',
            'กีฬา & กลางแจ้ง',
            'อื่นๆ'
          ])
        }
      })
      .catch((error) => {
        console.log('Failed to load categories from database, using fallback:', error)
        // Fallback categories if fetch fails
        setCategories([
          'ป้าย',
          'สติกเกอร์',
          'บัตร',
          'โบรชัวร์',
          'มือถือ & แท็บเล็ต',
          'คอมพิวเตอร์ & เกมมิ่ง',
          'แฟชั่นผู้หญิง',
          'แฟชั่นผู้ชาย',
          'ความงาม & สุขภาพ',
          'บ้าน & ไลฟ์สไตล์',
          'ซูเปอร์มาร์เก็ต',
          'อิเล็กทรอนิกส์',
          'กีฬา & กลางแจ้ง',
          'อื่นๆ'
        ])
      })
  }, [])

  // Update document title
  useEffect(() => {
    if (sellerUser) {
      document.title = `${sellerUser} - หน้าผู้ขาย | TH-THAI SHOP`
    } else {
      document.title = 'เข้าสู่ระบบผู้ขาย | TH-THAI SHOP'
    }
  }, [sellerUser])

  // Auth handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setLoading(true)
    const res = await fetch('/api/seller-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: sellerUser, password: sellerPass, mode: 'login' })
    })
    setLoading(false)
    if (res.ok) {
  // persist login
  try { if (sellerUser) localStorage.setItem('sellerUser', sellerUser) } catch {}
  setSellerUser(sellerUser)
      setSellerPass('')
      Swal.fire({ icon: 'success', title: 'เข้าสู่ระบบสำเร็จ', timer: 1200, showConfirmButton: false })
    } else {
      setAuthError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
    }
  }
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setLoading(true)
    const res = await fetch('/api/seller-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: sellerUser, password: sellerPass, mode: 'register' })
    })
    setLoading(false)
    if (res.ok) {
  try { if (sellerUser) localStorage.setItem('sellerUser', sellerUser) } catch {}
  setSellerUser(sellerUser)
      setSellerPass('')
      Swal.fire({ icon: 'success', title: 'สมัครสำเร็จ', timer: 1200, showConfirmButton: false })
    } else {
      const err = await res.json().catch(()=>({}))
      setAuthError(err?.message || 'สมัครไม่สำเร็จ')
    }
  }

  // Upload product to server: upload files -> create product doc
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price || !category || imageFiles.length === 0 || !sellerUser) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบถ้วนและเลือกรูปภาพอย่างน้อย 1 รูป' })
      return
    }
    setLoading(true)
    try {
      const form = new FormData()
      imageFiles.forEach(file => {
        form.append('files', file)
      })
      const upRes = await fetch('/api/upload', { method: 'POST', body: form })
      if (!upRes.ok) throw new Error('upload failed')
      const upJson = await upRes.json().catch(()=>({}))
      const imageUrls: string[] = Array.isArray(upJson?.urls) ? upJson.urls : []
      const imageUrl = imageUrls[0] || '' // Use first image as main image

      const payload = { 
        username: sellerUser, 
        item: { 
          name, 
          price: Number(price), 
          desc: description, 
          image: imageUrl,
          images: imageUrls, // Store all images
          category,
          options: options.length > 0 ? options : undefined
        } 
      }
      const res = await fetch('/api/seller-products', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const errJson = await res.json().catch(()=>null)
        console.error('seller-products POST failed', { status: res.status, body: errJson })
        throw new Error(errJson?.error || errJson?.message || `create product failed (status ${res.status})`)
      }

      // success - reset all fields
      setName('')
      setPrice('')
      setDescription('')
      setCategory('')
      setImageFiles([])
      setOptions([]) // Reset options
      await fetch(`/api/seller-products?username=${encodeURIComponent(sellerUser)}`)
        .then(r => r.json())
        .then(d => setProducts(Array.isArray(d) ? d : []))
      Swal.fire({ icon: 'success', title: 'เพิ่มสินค้าสำเร็จ', timer: 1200, showConfirmButton: false })
    } catch (err:any) {
      console.error('product upload/create error', err)
      Swal.fire({ icon: 'error', title: 'เพิ่มสินค้าไม่สำเร็จ', text: err?.message || '' })
    } finally {
      setLoading(false)
    }
  }

  // UI
  // wait until auth check is complete to avoid redirect race on mount
  if (!checkedAuth) return null
  if (!sellerUser) {
    if (typeof window !== 'undefined') {
      window.location.href = '/seller/auth'
      return null
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Add Product Form */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-8 hover:shadow-3xl transition-all duration-300">
          <div className="bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <PackagePlus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  เพิ่มสินค้าใหม่
                </h2>
                <p className="text-blue-100 mt-1">สร้างรายการสินค้าที่น่าสนใจสำหรับลูกค้า</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleUpload} className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="group">
                  <label className="flex items-center gap-2 text-lg font-bold text-slate-700 mb-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    ชื่อสินค้า
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="w-full border-2 border-slate-200 rounded-2xl p-5 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl text-lg placeholder-slate-400 group-focus-within:scale-[1.02]"
                    placeholder="ระบุชื่อสินค้าที่น่าสนใจ..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="group">
                  <label className="flex items-center gap-2 text-lg font-bold text-slate-700 mb-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    ราคา (บาท)
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 transform -translate-y-1/2 text-blue-600 font-bold text-xl">฿</span>
                    <input
                      type="number"
                      className="w-full border-2 border-slate-200 rounded-2xl pl-12 pr-5 py-5 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl text-lg placeholder-slate-400"
                      placeholder="0.00"
                      value={price}
                      onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                
                <div className="group">
                  <label className="flex items-center gap-2 text-lg font-bold text-slate-700 mb-3">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    หมวดหมู่
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border-2 border-slate-200 rounded-2xl p-5 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl text-lg appearance-none cursor-pointer"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    required
                  >
                    <option value="">🏷️ เลือกหมวดหมู่สินค้า</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="group">
                  <label className="flex items-center gap-2 text-lg font-bold text-slate-700 mb-3">
                    <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                    รูปภาพสินค้า
                    <span className="text-red-500">*</span>
                    <span className="text-xs bg-pink-100 text-pink-600 px-2 py-1 rounded-full font-medium">เลือกได้หลายรูป</span>
                  </label>
                  <label className="block w-full min-h-48 rounded-2xl border-3 border-dashed border-pink-300 bg-gradient-to-br from-pink-50/60 to-rose-50/60 hover:from-pink-100/80 hover:to-rose-100/80 cursor-pointer transition-all duration-300 group hover:border-pink-400 shadow-lg hover:shadow-xl backdrop-blur-sm">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => {
                        const files = Array.from(e.target.files || [])
                        setImageFiles(files)
                      }}
                      required
                    />
                    <div className="p-6">
                      {imageFiles.length > 0 ? (
                        <div className="space-y-4">
                          {/* Image Previews Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            {imageFiles.slice(0, 4).map((file, index) => (
                              <div key={index} className="relative group/img">
                                <div className="aspect-square rounded-xl overflow-hidden bg-white shadow-lg border-2 border-emerald-200">
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                                  />
                                </div>
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                                  {index + 1}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setImageFiles(prev => prev.filter((_, i) => i !== index))
                                  }}
                                  className="absolute -top-2 -left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover/img:opacity-100"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          
                          {/* Summary */}
                          <div className="text-center">
                            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full">
                              <span className="text-lg">✅</span>
                              <span className="font-bold">{imageFiles.length} รูปภาพถูกเลือก</span>
                            </div>
                            {imageFiles.length > 4 && (
                              <div className="text-sm text-slate-500 mt-2">
                                แสดง 4 รูปแรก (+{imageFiles.length - 4} รูปเพิ่มเติม)
                              </div>
                            )}
                            <div className="text-sm text-pink-600 mt-2 font-medium">
                              คลิกเพื่อเลือกรูปภาพเพิ่มเติม
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center space-y-4 py-8">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-200 to-rose-200 flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                            <Upload className="w-10 h-10 text-pink-600" />
                          </div>
                          <div>
                            <div className="text-lg font-bold text-pink-700 mb-1">อัปโหลดรูปภาพสินค้า</div>
                            <div className="text-pink-500 text-sm">คลิกเพื่อเลือกไฟล์หลายรูป</div>
                            <div className="text-pink-400 text-xs mt-2">รองรับ JPG, PNG, GIF (ขนาดไม่เกิน 10MB ต่อไฟล์)</div>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-xs text-pink-500 bg-white/60 backdrop-blur-sm px-3 py-2 rounded-full">
                            <span>💡</span>
                            <span>สามารถเลือกหลายรูปพร้อมกันได้</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                <div className="group">
                  <label className="flex items-center gap-2 text-lg font-bold text-slate-700 mb-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                    รายละเอียดสินค้า
                  </label>
                  <textarea
                    className="w-full border-2 border-slate-200 rounded-2xl p-5 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300 resize-none bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl text-lg placeholder-slate-400"
                    placeholder="อธิบายรายละเอียดสินค้า คุณสมบัติพิเศษ วัสดุ การใช้งาน หรือข้อมูลที่สำคัญ..."
                    rows={6}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Product Options */}
            <div className="space-y-4 mb-8">
              <label className="flex items-center gap-2 text-lg font-bold text-slate-700">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                ตัวเลือกสินค้า 
                <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-medium">ไม่บังคับ</span>
              </label>
              <div className="border-2 border-slate-200 rounded-2xl p-8 bg-gradient-to-br from-orange-50/60 to-amber-50/60 shadow-lg backdrop-blur-sm">
                <ProductOptionsManager 
                  options={options} 
                  basePrice={Number(price) || 0}
                  onChange={setOptions} 
                />
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-3 rounded-xl border border-slate-200">
                <span className="text-lg">💡</span>
                <span>เพิ่มตัวเลือกเช่น สี, ขนาด, รุ่น เพื่อให้ลูกค้าเลือกได้ตามต้องการ</span>
              </p>
            </div>
            
            <div className="flex justify-center pt-6">
              <button
                type="submit"
                className="group relative px-12 py-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-600 text-white font-bold text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-4 min-w-[280px]"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>กำลังเพิ่มสินค้า...</span>
                  </>
                ) : (
                  <>
                    <PackagePlus className="w-7 h-7 group-hover:scale-110 transition-transform duration-200" />
                    <span>เพิ่มสินค้าลงร้าน</span>
                    <span className="text-2xl">✨</span>
                  </>
                )}
                
                {/* Animated background effect */}
                {!loading && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                )}
              </button>
            </div>
          </form>
        </div>
        {/* Products Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden hover:shadow-3xl transition-all duration-300">
          <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <ImageIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    คลังสินค้าของคุณ
                  </h2>
                  <p className="text-purple-100 mt-1">จัดการและติดตามสินค้าทั้งหมด</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <span className="text-white font-bold text-lg">{products.length}</span>
                  <span className="text-purple-100 text-sm ml-1">รายการ</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 sm:p-8">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <div className="text-slate-600 font-medium text-lg">กำลังโหลดสินค้า</div>
                  <div className="text-slate-400 text-sm mt-1">โปรดรอสักครู่...</div>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <ImageIcon className="w-16 h-16 text-purple-400" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-bold text-slate-700 mb-3">ยังไม่มีสินค้าในร้าน</h3>
                  <p className="text-slate-500 leading-relaxed">เริ่มเพิ่มสินค้าแรกของคุณเพื่อเริ่มต้นการขายออนไลน์</p>
                  <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
                    <span>💡</span>
                    <span>ใช้แบบฟอร์มด้านบนเพื่อเพิ่มสินค้า</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {/* Stats Bar */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl border border-emerald-200">
                    <div className="text-2xl font-bold text-emerald-600">{products.length}</div>
                    <div className="text-sm text-emerald-700">สินค้าทั้งหมด</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600">
                      {products.filter(p => p.options && p.options.length > 0).length}
                    </div>
                    <div className="text-sm text-blue-700">มีตัวเลือก</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600">
                      {new Set(products.map(p => p.category)).size}
                    </div>
                    <div className="text-sm text-purple-700">หมวดหมู่</div>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
                    <div className="text-2xl font-bold text-amber-600">
                      ฿{products.reduce((sum, p) => sum + p.price, 0).toLocaleString()}
                    </div>
                    <div className="text-sm text-amber-700">มูลค่ารวม</div>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((p, idx) => (
                    <div key={p._id || idx} className="group bg-white rounded-2xl border-2 border-slate-100 hover:border-purple-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                      {/* Product Image */}
                      <div className="aspect-square bg-gradient-to-br from-slate-50 to-purple-50 overflow-hidden relative">
                        {p.image ? (
                          <div className="relative w-full h-full">
                            <img 
                              src={p.image} 
                              alt={p.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                            {/* Multiple Images Indicator */}
                            {p.images && p.images.length > 1 && (
                              <div className="absolute bottom-3 right-3">
                                <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                                  <ImageIcon className="w-3 h-3" />
                                  {p.images.length}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-slate-300" />
                            </div>
                          </div>
                        )}
                        {/* Category Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="bg-white/90 backdrop-blur-sm text-slate-700 px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                            {p.category || 'ไม่ระบุ'}
                          </span>
                        </div>
                        {/* Options Indicator */}
                        {p.options && p.options.length > 0 && (
                          <div className="absolute top-3 right-3">
                            <div className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                              {p.options.length}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="p-6">
                        <div className="mb-4">
                          <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-2 group-hover:text-purple-700 transition-colors">
                            {p.name}
                          </h3>
                          
                          <div className="flex items-center justify-between mb-3">
                            <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                              ฿{p.price.toLocaleString()}
                            </div>
                            <Tag className="w-5 h-5 text-purple-400" />
                          </div>
                          
                          {p.description && (
                            <p className="text-sm text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                              {p.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Product Options Preview */}
                        {p.options && p.options.length > 0 && (
                          <div className="mb-4 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                            <div className="text-xs font-bold text-purple-700 mb-2 flex items-center gap-1">
                              <span>⚙️</span>
                              ตัวเลือกสินค้า
                            </div>
                            <div className="space-y-2">
                              {p.options.slice(0, 2).map((opt, optIdx) => (
                                <div key={optIdx}>
                                  <div className="text-xs font-medium text-slate-600 mb-1">{opt.name}:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {opt.values.slice(0, 3).map((val, valIdx) => (
                                      <span key={valIdx} className="text-xs bg-white text-purple-700 px-2 py-1 rounded-full border border-purple-200 shadow-sm">
                                        {val.value}
                                        {val.price !== 0 && (
                                          <span className="ml-1 text-xs text-purple-600 font-medium">
                                            {val.priceType === 'replace' 
                                              ? `฿${val.price.toLocaleString()}` 
                                              : `+฿${val.price.toLocaleString()}`
                                            }
                                          </span>
                                        )}
                                      </span>
                                    ))}
                                    {opt.values.length > 3 && (
                                      <span className="text-xs text-slate-400 px-2 py-1">
                                        +{opt.values.length - 3} อื่นๆ
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {p.options.length > 2 && (
                                <div className="text-xs text-slate-400 text-center pt-1">
                                  และอีก {p.options.length - 2} ตัวเลือก
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Additional Images Preview */}
                        {p.images && p.images.length > 1 && (
                          <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                            <div className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              รูปภาพเพิ่มเติม ({p.images.length - 1})
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                              {p.images.slice(1, 5).map((imgUrl, imgIdx) => (
                                <div key={imgIdx} className="aspect-square rounded-md overflow-hidden bg-white border border-blue-200">
                                  <img
                                    src={imgUrl}
                                    alt={`${p.name} ${imgIdx + 2}`}
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                                  />
                                </div>
                              ))}
                              {p.images.length > 5 && (
                                <div className="aspect-square rounded-md bg-blue-100 border border-blue-200 flex items-center justify-center">
                                  <span className="text-xs text-blue-600 font-bold">+{p.images.length - 5}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            ✏️ แก้ไข
                          </button>
                          <button className="flex-1 py-3 px-4 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                            👁️ ดูรายละเอียด
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
          