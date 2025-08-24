'use client'

import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { PackagePlus, Upload, Tag, Image as ImageIcon, Store } from 'lucide-react'

type SellerProduct = {
  _id?: string
  name: string
  price: number
  description?: string
  category?: string
  image?: string
  seller?: string
}
type SellerUser = { username: string; password: string }

const categories = [
  'มือถือ & แท็บเล็ต',
  'คอมพิวเตอร์ & เกมมิ่ง',
  'แฟชั่นผู้หญิง',
  'แฟชั่นผู้ชาย',
  'ความงาม & สุขภาพ',
  'บ้าน & ไลฟ์สไตล์',
  'ซูเปอร์มาร์เก็ต',
  'อิเล็กทรอนิกส์',
  'กีฬา & กลางแจ้ง',
]

export default function SellerPage() {
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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [products, setProducts] = useState<SellerProduct[]>([])

  // initialize sellerUser from localStorage so page doesn't redirect if already logged in
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
  const handleLogout = () => {
    setSellerUser(null)
    setSellerPass('')
    setProducts([])
  }

  // Upload product to server: upload file -> create product doc
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price || !category || !imageFile || !sellerUser) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
      return
    }
    setLoading(true)
    try {
      const form = new FormData()
      form.append('files', imageFile)
      const upRes = await fetch('/api/upload', { method: 'POST', body: form })
      if (!upRes.ok) throw new Error('upload failed')
      const upJson = await upRes.json().catch(()=>({}))
      const imageUrls: string[] = Array.isArray(upJson?.urls) ? upJson.urls : []
      const imageUrl = imageUrls[0] || ''

      const payload = { username: sellerUser, item: { name, price: Number(price), desc: description, image: imageUrl } }
      const res = await fetch('/api/seller-products', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const errJson = await res.json().catch(()=>null)
        console.error('seller-products POST failed', { status: res.status, body: errJson })
        throw new Error(errJson?.error || errJson?.message || `create product failed (status ${res.status})`)
      }

      // success
      setName('')
      setPrice('')
      setDescription('')
      setCategory('')
      setImageFile(null)
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header Section */}
      <div className="bg-white shadow-lg border-b border-orange-100">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
                <PackagePlus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  ศูนย์ผู้ขาย
                </h1>
                <p className="text-slate-600 mt-1">จัดการร้านค้าและสินค้าของคุณ</p>
              </div>
            </div>
            <button
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              onClick={handleLogout}
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-3xl p-8 mb-8 text-white shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">ยินดีต้อนรับ, {sellerUser}!</h2>
              <p className="text-orange-100">เริ่มต้นขายสินค้าและเติบโตไปกับเรา</p>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Store className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </div>
        {/* Add Product Form */}
        <div className="bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <PackagePlus className="w-6 h-6 text-white" />
              </div>
              เพิ่มสินค้าใหม่
            </h2>
            <p className="text-orange-100 mt-2">กรอกข้อมูลสินค้าที่ต้องการขาย</p>
          </div>
          
          <form onSubmit={handleUpload} className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">ชื่อสินค้า</label>
                <input
                  className="w-full border-2 border-orange-200 rounded-xl p-4 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200"
                  placeholder="ระบุชื่อสินค้าที่ต้องการขาย"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">ราคา (บาท)</label>
                <input
                  type="number"
                  className="w-full border-2 border-orange-200 rounded-xl p-4 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200"
                  placeholder="0"
                  value={price}
                  onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">หมวดหมู่</label>
                <select
                  className="w-full border-2 border-orange-200 rounded-xl p-4 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200 bg-white"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  required
                >
                  <option value="">เลือกหมวดหมู่สินค้า</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">รูปภาพสินค้า</label>
                <label className="block w-full h-24 rounded-xl border-2 border-dashed border-orange-300 bg-orange-50/50 hover:bg-orange-50 cursor-pointer transition-all duration-200 group">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => setImageFile(e.target.files?.[0] || null)}
                    required
                  />
                  <div className="flex items-center justify-center h-full">
                    {imageFile ? (
                      <div className="text-center">
                        <div className="text-sm font-semibold text-orange-700">✓ เลือกไฟล์แล้ว</div>
                        <div className="text-xs text-slate-600 mt-1">{imageFile.name}</div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-6 h-6 text-orange-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <div className="text-sm font-medium text-orange-700">คลิกเพื่อเลือกรูป</div>
                      </div>
                    )}
                  </div>
                </label>
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <label className="block text-sm font-semibold text-slate-700">รายละเอียดสินค้า</label>
              <textarea
                className="w-full border-2 border-orange-200 rounded-xl p-4 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-200 resize-none"
                placeholder="อธิบายรายละเอียดสินค้า คุณสมบัติ หรือข้อมูลที่ลูกค้าควรรู้"
                rows={4}
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 h-14 px-8 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    กำลังเพิ่มสินค้า...
                  </>
                ) : (
                  <>
                    <PackagePlus className="w-5 h-5" />
                    เพิ่มสินค้า
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        {/* Products Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
              สินค้าของคุณ
              <span className="ml-auto bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                {products.length} รายการ
              </span>
            </h2>
            <p className="text-slate-200 mt-2">จัดการและติดตามสินค้าทั้งหมดของคุณ</p>
          </div>
          
          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <div className="text-slate-500 font-medium">กำลังโหลดสินค้า...</div>
                </div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-12 h-12 text-slate-400" />
                </div>
                <div className="text-slate-500 font-medium mb-2">ยังไม่มีสินค้า</div>
                <div className="text-slate-400 text-sm">เริ่มเพิ่มสินค้าแรกของคุณเลย!</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((p, idx) => (
                  <div key={p._id || idx} className="group bg-white rounded-2xl border-2 border-slate-100 hover:border-orange-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="aspect-square bg-slate-50 overflow-hidden">
                      {p.image ? (
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-2 flex-1">
                          {p.name}
                        </h3>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-slate-600 bg-orange-50 px-2 py-1 rounded-lg">
                          {p.category || 'ไม่ระบุหมวดหมู่'}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          ฿{p.price.toLocaleString()}
                        </div>
                        {p.description && (
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {p.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button className="flex-1 py-2 px-4 bg-orange-50 text-orange-600 rounded-xl hover:bg-orange-100 transition-colors font-medium text-sm">
                          แก้ไข
                        </button>
                        <button className="flex-1 py-2 px-4 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors font-medium text-sm">
                          ดูรายละเอียด
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
          