'use client'

import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { PackagePlus, Upload, Tag, Image as ImageIcon } from 'lucide-react'

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

  // Load products for seller
  useEffect(() => {
    if (!sellerUser) return
    setLoading(true)
    fetch(`/api/seller-products?seller=${encodeURIComponent(sellerUser)}`)
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

  // Upload product to mongoDB
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price || !category || !imageFile || !sellerUser) {
      Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
      return
    }
    setLoading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      const img = reader.result as string
      const res = await fetch('/api/seller-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, price: Number(price), description, category, image: img, seller: sellerUser
        })
      })
      setLoading(false)
      if (res.ok) {
        setName('')
        setPrice('')
        setDescription('')
        setCategory('')
        setImageFile(null)
        await fetch(`/api/seller-products?seller=${encodeURIComponent(sellerUser)}`)
          .then(r => r.json())
          .then(d => setProducts(Array.isArray(d) ? d : []))
        Swal.fire({ icon: 'success', title: 'เพิ่มสินค้าสำเร็จ', timer: 1200, showConfirmButton: false })
      } else {
        Swal.fire({ icon: 'error', title: 'เพิ่มสินค้าไม่สำเร็จ' })
      }
    }
    reader.readAsDataURL(imageFile)
  }

  // UI
  if (!sellerUser) {
    // Redirect to /seller/auth if not logged in
    if (typeof window !== 'undefined') {
      window.location.href = '/seller/auth'
      return null
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="max-w-2xl mx-auto py-10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-orange-700 flex items-center gap-2">
            <PackagePlus className="w-7 h-7" /> ศูนย์ผู้ขาย
          </h1>
          <button
            className="px-4 h-10 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700"
            onClick={handleLogout}
          >ออกจากระบบ</button>
        </div>
        <p className="text-slate-600 mb-6">สำหรับร้านค้าร้านอื่นที่ต้องการลงขายสินค้าในระบบ</p>
        <form onSubmit={handleUpload} className="grid gap-5 bg-white rounded-2xl border border-orange-200 shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              className="border border-orange-200 rounded-xl p-3"
              placeholder="ชื่อสินค้า"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <input
              type="number"
              className="border border-orange-200 rounded-xl p-3"
              placeholder="ราคา"
              value={price}
              onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
              required
            />
            <textarea
              className="md:col-span-2 border border-orange-200 rounded-xl p-3"
              placeholder="รายละเอียดสินค้า"
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <select
              className="border border-orange-200 rounded-xl p-3"
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <label className="grid place-items-center h-32 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 text-orange-700 cursor-pointer hover:bg-orange-50 transition">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => setImageFile(e.target.files?.[0] || null)}
              required
            />
            {imageFile ? (
              <div className="text-center">
                <div className="text-sm font-semibold">เลือกไฟล์แล้ว</div>
                <div className="text-xs text-slate-600">{imageFile.name}</div>
              </div>
            ) : (
              <div className="text-center text-sm">
                <div className="font-semibold flex items-center justify-center gap-2">
                  <Upload className="w-4 h-4" /> ลากรูปมาวาง หรือคลิกเพื่อเลือก
                </div>
                <div className="text-slate-600 mt-1">ขนาดไฟล์ไม่ควรใหญ่เกินไปเพื่อความเร็ว</div>
              </div>
            )}
          </label>
          <button
            type="submit"
            className="h-12 px-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold shadow-lg hover:from-orange-600 hover:to-amber-500 transition-all"
            disabled={loading}
          >
            เพิ่มสินค้า
          </button>
        </form>
        <div>
          <h2 className="text-xl font-bold text-orange-700 mb-3 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" /> สินค้าของคุณ
          </h2>
          {loading ? (
            <div className="text-slate-500">กำลังโหลด...</div>
          ) : products.length === 0 ? (
            <div className="text-slate-500">ยังไม่มีสินค้า</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {products.map((p, idx) => (
                <div key={p._id || idx} className="rounded-2xl border border-orange-200 bg-white shadow-sm p-5">
                  <div className="flex items-center gap-4">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="h-20 w-20 object-contain rounded border bg-white shadow-sm" />
                    ) : (
                      <div className="h-20 w-20 grid place-items-center text-slate-400 text-sm border rounded">ไม่มีรูป</div>
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-orange-700">{p.name}</h3>
                      <div className="text-green-700 font-semibold">{p.price.toLocaleString()} บาท</div>
                      <div className="text-xs text-slate-500 mt-1">หมวดหมู่: {p.category || '-'}</div>
                      {p.description && <p className="mt-2 text-sm text-slate-700">{p.description}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
          