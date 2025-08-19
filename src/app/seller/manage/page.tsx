'use client'

import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { Store, User, Edit, Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

// ---------- Types ----------
type SellerInfo = {
  username: string
  fullName: string
  email: string
  phone: string
  shopName: string
  birthDate: string
  province: string
  address: string
}

type Product = {
  _id: string
  name: string
  price: number | string
}

// ---------- Component ----------
export default function SellerManagePage() {
  const router = useRouter()

  const [sellerUser, setSellerUser] = useState<string | null>(null)
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<SellerInfo | null>(null)

  // Products management
  const [products, setProducts] = useState<Product[]>([])

  // --- New product template state ---
  const [showCreate, setShowCreate] = useState(true) // เปิดมาแล้วเห็นฟอร์ม
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    desc: '',
    image: ''
  })
  const [creating, setCreating] = useState(false)

  const handleNewChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewProduct(prev => ({ ...prev, [name]: value }))
  }

  const handleCreateProduct = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!sellerUser) {
      await Swal.fire({ icon: 'warning', title: 'กรุณาเข้าสู่ระบบผู้ขาย' })
      return
    }
    if (!newProduct.name.trim() || !newProduct.price.toString().trim()) {
      await Swal.fire({ icon: 'warning', title: 'กรุณากรอกชื่อและราคารสินค้า' })
      return
    }
    setCreating(true)
    try {
      const payload = {
        username: sellerUser,
        item: {
          name: newProduct.name.trim(),
          price: Number(newProduct.price) || newProduct.price,
          desc: newProduct.desc.trim(),
          image: newProduct.image || '/placeholder.png'
        }
      }
      const res = await fetch('/api/seller-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('create failed')
      await fetchSellerProducts(sellerUser)
      setNewProduct({ name: '', price: '', desc: '', image: '' })
      setShowCreate(false)
      Swal.fire({ icon: 'success', title: 'สร้างสินค้าสำเร็จ', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'ไม่สามารถสร้างสินค้าได้' })
    } finally {
      setCreating(false)
    }
  }

  const fetchSellerProducts = async (username?: string) => {
    if (!username) return
    try {
      const res = await fetch(`/api/seller-products?username=${encodeURIComponent(username)}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json().catch(() => [])
      setProducts(Array.isArray(data) ? (data as Product[]) : [])
    } catch {
      setProducts([])
    }
  }

  useEffect(() => {
    // อ่าน sellerUser จาก localStorage; หากไม่มีให้ลอง fallback เป็น 'user' (บัญชีที่ล็อกอิน)
    const storedSeller = localStorage.getItem('sellerUser')
    const fallbackUser = localStorage.getItem('user') // จากหน้า login ปกติ
    const user = storedSeller || fallbackUser

    if (!user) {
      window.location.href = '/seller/auth'
      return
    }

    setSellerUser(user)

    const fetchInfo = async () => {
      try {
        const res = await fetch(`/api/seller-info?username=${encodeURIComponent(user)}`)
        if (!res.ok) {
          // หาก 404 หรือไม่พบ ให้ถือว่าไม่มีข้อมูลร้านค้า (ไม่รีไดเรกต์)
          setSellerInfo(null)
          setForm(null)
          return
        }
        const data: SellerInfo = await res.json()
        setSellerInfo(data)
        setForm(data)
        await fetchSellerProducts(user)
      } catch {
        await Swal.fire({ icon: 'error', title: 'โหลดข้อมูลไม่สำเร็จ' })
      } finally {
        setLoading(false)
      }
    }

    fetchInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDeleteProduct = async (id: string) => {
    if (!sellerUser) return
    const ok = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันการลบสินค้า?',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
    })
    if (!ok.isConfirmed) return
    try {
      const res = await fetch(`/api/seller-products?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await fetchSellerProducts(sellerUser)
      Swal.fire({ icon: 'success', title: 'ลบแล้ว', timer: 900, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ' })
    }
  }

  const handleEdit = () => setEditMode(true)
  const handleCancel = () => {
    setEditMode(false)
    setForm(sellerInfo)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!form) return
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setLoading(true)
    try {
      const res = await fetch('/api/seller-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('update failed')
      setSellerInfo(form)
      setEditMode(false)
      Swal.fire({ icon: 'success', title: 'บันทึกข้อมูลสำเร็จ', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'บันทึกข้อมูลไม่สำเร็จ' })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!sellerUser) return
    const confirmRes = await Swal.fire({
      icon: 'warning',
      title: 'ลบร้านค้า',
      text: 'คุณแน่ใจว่าต้องการลบร้านค้าของคุณ? ข้อมูลทั้งหมดจะถูกลบถาวร!',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
    })
    if (!confirmRes.isConfirmed) return

    setLoading(true)
    try {
      const res = await fetch('/api/seller-info', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: sellerUser }),
      })
      if (!res.ok) throw new Error('delete failed')
      localStorage.removeItem('sellerUser')
      Swal.fire({ icon: 'success', title: 'ลบร้านค้าสำเร็จ', timer: 1200, showConfirmButton: false })
      window.location.href = '/seller/auth'
    } catch {
      Swal.fire({ icon: 'error', title: 'ลบร้านค้าไม่สำเร็จ' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <Loader2 className="animate-spin w-10 h-10 text-orange-600" />
      </div>
    )
  }

  if (!sellerInfo) {
    // ถ้ามาถึงจุดนี้ หมายความว่า sellerUser มีค่าแต่ยังไม่มีข้อมูลร้านค้า
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="bg-white rounded-xl shadow p-8 text-center max-w-lg w-full">
          <div className="text-xl text-orange-700 font-bold mb-2">ยังไม่มีร้านค้าสำหรับบัญชีนี้</div>
          <div className="text-sm text-slate-600 mb-4">บัญชี: <span className="font-medium text-orange-700">{sellerUser}</span></div>
          <p className="text-sm text-slate-500 mb-6">คุณยังไม่มีข้อมูลร้านค้า สามารถสร้างร้านค้าเพื่อเริ่มขายสินค้าได้</p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => router.push(`/seller/create?username=${encodeURIComponent(sellerUser || '')}`)}
              className="px-4 py-2 rounded bg-orange-600 text-white font-medium"
            >
              สร้างร้านค้าตอนนี้
            </button>
            <a href="/seller/auth" className="px-4 py-2 rounded border text-orange-600">กลับไปหน้าล็อกอิน</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-10">
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-orange-200 shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6 justify-between">
          <div className="flex items-center gap-3">
            <Store className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold text-orange-700">จัดการร้านค้าของคุณ</h1>
              <div className="text-sm text-slate-500">ล็อกอินเป็น: <span className="font-medium text-orange-700">{sellerUser}</span></div>
            </div>
          </div>
          <button onClick={() => router.push('/seller/products/create')} className="px-3 py-2 rounded-full bg-green-600 text-white text-sm">+ เพิ่มสินค้า</button>
        </div>

        {editMode ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อร้านค้า</label>
              <input name="shopName" value={form?.shopName || ''} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อ-นามสกุล</label>
              <input name="fullName" value={form?.fullName || ''} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">อีเมล</label>
              <input name="email" type="email" value={form?.email || ''} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">เบอร์โทร</label>
              <input name="phone" value={form?.phone || ''} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">วันเกิด</label>
              <input name="birthDate" type="date" value={form?.birthDate || ''} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">จังหวัด</label>
              <input name="province" value={form?.province || ''} onChange={handleChange} className="w-full p-3 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ที่อยู่</label>
              <textarea name="address" value={form?.address || ''} onChange={handleChange} className="w-full p-3 border rounded-lg" rows={2} required />
            </div>
            <div className="flex gap-2 mt-4">
              <button type="submit" className="px-6 py-2 rounded-full bg-orange-600 text-white font-semibold hover:bg-orange-700 flex items-center gap-2">
                <Edit className="w-4 h-4" /> บันทึก
              </button>
              <button type="button" className="px-6 py-2 rounded-full bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300" onClick={handleCancel}>
                ยกเลิก
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">{sellerInfo.fullName}</span>
            </div>
            <div>ชื่อร้านค้า: <span className="font-semibold">{sellerInfo.shopName}</span></div>
            <div>อีเมล: <span className="font-semibold">{sellerInfo.email}</span></div>
            <div>เบอร์โทร: <span className="font-semibold">{sellerInfo.phone}</span></div>
            <div>วันเกิด: <span className="font-semibold">{sellerInfo.birthDate}</span></div>
            <div>จังหวัด: <span className="font-semibold">{sellerInfo.province}</span></div>
            <div>ที่อยู่: <span className="font-semibold">{sellerInfo.address}</span></div>

            {/* Products list and new-product template */}
            <div className="mb-6">
              <div className="mb-4 p-4 border rounded bg-orange-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-orange-800">เทมเพลตเพิ่มสินค้า</div>
                  <button
                    type="button"
                    onClick={() => setShowCreate(s => !s)}
                    className="text-sm text-orange-600"
                  >
                    {showCreate ? 'ซ่อน' : 'เปิดฟอร์ม'}
                  </button>
                </div>
                {showCreate && (
                  <form onSubmit={handleCreateProduct} className="grid gap-2">
                    <input name="name" value={newProduct.name} onChange={handleNewChange} placeholder="ชื่อสินค้า" className="p-2 border rounded" />
                    <input name="price" value={newProduct.price} onChange={handleNewChange} placeholder="ราคา (ตัวอย่าง: 990)" className="p-2 border rounded" />
                    <textarea name="desc" value={newProduct.desc} onChange={handleNewChange} placeholder="คำอธิบายสั้นๆ" className="p-2 border rounded" rows={2} />
                    <input name="image" value={newProduct.image} onChange={handleNewChange} placeholder="URL รูปภาพ (หรือเว้นว่าง)" className="p-2 border rounded" />
                    <div className="flex gap-2">
                      <button disabled={creating} type="submit" className="px-4 py-2 rounded bg-orange-600 text-white">
                        {creating ? 'กำลังบันทึก...' : 'สร้างสินค้า'}
                      </button>
                      <button type="button" onClick={() => setNewProduct({ name: '', price: '', desc: '', image: '' })} className="px-4 py-2 rounded border">
                        ยกเลิก
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h2 className="font-semibold text-orange-800 mb-2">สินค้าของฉัน</h2>
              {products.length === 0 ? (
                <div className="text-sm text-slate-500">ยังไม่มีสินค้า — ใช้เทมเพลตด้านบนเพื่อเพิ่มสินค้าได้ทันที</div>
              ) : (
                <div className="space-y-3">
                  {products.map((p) => (
                    <div key={p._id} className="flex items-center justify-between gap-3 p-3 border rounded">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-slate-500">฿{Number(p.price).toLocaleString('th-TH')}</div>
                      </div>
                      <div className="flex gap-2">
                        <a href={`/seller/products/edit?id=${encodeURIComponent(p._id)}`} className="px-3 py-1 rounded bg-white border text-sm">แก้ไข</a>
                        <button onClick={() => handleDeleteProduct(p._id)} className="px-3 py-1 rounded bg-red-600 text-white text-sm">ลบ</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <button className="px-6 py-2 rounded-full bg-orange-600 text-white font-semibold hover:bg-orange-700 flex items-center gap-2" onClick={handleEdit}>
                <Edit className="w-4 h-4" /> แก้ไขข้อมูล
              </button>
              <button className="px-6 py-2 rounded-full bg-red-600 text-white font-semibold hover:bg-red-700 flex items-center gap-2" onClick={handleDelete}>
                <Trash2 className="w-4 h-4" /> ลบร้านค้า
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
