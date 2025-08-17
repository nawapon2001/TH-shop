'use client'

import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { Store, User, Edit, Trash2, Loader2 } from 'lucide-react'

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

export default function SellerManagePage() {
  const [sellerUser, setSellerUser] = useState<string | null>(null)
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState<SellerInfo | null>(null)

  useEffect(() => {
    // ดึง username จาก localStorage
    const user = localStorage.getItem('sellerUser')
    if (!user) {
      window.location.href = '/seller/auth'
      return
    }
    setSellerUser(user)
    fetch(`/api/seller-info?username=${encodeURIComponent(user)}`)
      .then(res => res.json())
      .then(data => {
        setSellerInfo(data)
        setForm(data)
      })
      .catch(() => Swal.fire({ icon: 'error', title: 'โหลดข้อมูลไม่สำเร็จ' }))
      .finally(() => setLoading(false))
  }, [])

  const handleEdit = () => setEditMode(true)
  const handleCancel = () => {
    setEditMode(false)
    setForm(sellerInfo)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!form) return
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) return
    setLoading(true)
    const res = await fetch('/api/seller-info', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    setLoading(false)
    if (res.ok) {
      setSellerInfo(form)
      setEditMode(false)
      Swal.fire({ icon: 'success', title: 'บันทึกข้อมูลสำเร็จ', timer: 1200, showConfirmButton: false })
    } else {
      Swal.fire({ icon: 'error', title: 'บันทึกข้อมูลไม่สำเร็จ' })
    }
  }

  const handleDelete = async () => {
    if (!sellerUser) return
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'ลบร้านค้า',
      text: 'คุณแน่ใจว่าต้องการลบร้านค้าของคุณ? ข้อมูลทั้งหมดจะถูกลบถาวร!',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    })
    if (confirm.isConfirmed) {
      setLoading(true)
      const res = await fetch('/api/seller-info', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: sellerUser })
      })
      setLoading(false)
      if (res.ok) {
        localStorage.removeItem('sellerUser')
        Swal.fire({ icon: 'success', title: 'ลบร้านค้าสำเร็จ', timer: 1200, showConfirmButton: false })
        window.location.href = '/seller/auth'
      } else {
        Swal.fire({ icon: 'error', title: 'ลบร้านค้าไม่สำเร็จ' })
      }
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <div className="text-xl text-orange-700 font-bold mb-2">ไม่พบข้อมูลร้านค้า</div>
          <a href="/seller/auth" className="underline text-orange-600">กลับไปหน้าล็อกอิน</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-10">
      <div className="max-w-xl mx-auto bg-white rounded-2xl border border-orange-200 shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Store className="w-8 h-8 text-orange-600" />
          <h1 className="text-2xl font-bold text-orange-700">จัดการร้านค้าของคุณ</h1>
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
