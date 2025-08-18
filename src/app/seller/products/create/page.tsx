'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { Upload, Loader2 } from 'lucide-react'

export default function SellerCreateProductPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [price, setPrice] = useState<number|''>('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)

  const onFiles = (fList: FileList | null) => {
    if (!fList?.length) return
    const list = Array.from(fList)
    setFiles(prev => [...prev, ...list.filter(f => !prev.some(p => p.name === f.name && p.size === f.size))])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const sellerUser = localStorage.getItem('sellerUser')
    if (!sellerUser) return Swal.fire({ icon: 'error', title: 'ต้องล็อกอินก่อน' })
    if (!name.trim() || !price) return Swal.fire({ icon: 'warning', title: 'กรุณากรอกชื่อและราคา' })
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('username', sellerUser)
      fd.append('name', name.trim())
      fd.append('price', String(price))
      fd.append('description', description.trim())
      files.forEach(f => fd.append('images', f))
      const res = await fetch('/api/seller-products', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(()=>({}))
        throw new Error(err?.message || 'เพิ่มสินค้าไม่สำเร็จ')
      }
      Swal.fire({ icon: 'success', title: 'เพิ่มสินค้าสำเร็จ', timer: 1200, showConfirmButton: false })
      router.push('/seller/manage')
    } catch (err: any) {
      Swal.fire({ icon: 'error', title: 'เพิ่มสินค้าไม่สำเร็จ', text: err?.message || '' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 shadow">
        <h1 className="text-xl font-bold text-orange-700 mb-4">เพิ่มสินค้าใหม่</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">ชื่อสินค้า</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full p-3 border rounded" />
          </div>
          <div>
            <label className="block text-sm mb-1">ราคา</label>
            <input type="number" value={price === '' ? '' : String(price)} onChange={(e)=>setPrice(e.target.value===''? '': Number(e.target.value))} className="w-full p-3 border rounded" />
          </div>
          <div>
            <label className="block text-sm mb-1">คำอธิบาย</label>
            <textarea value={description} onChange={(e)=>setDescription(e.target.value)} rows={4} className="w-full p-3 border rounded" />
          </div>
          <div>
            <label className="block text-sm mb-1">รูปภาพ</label>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded bg-white border border-orange-200 cursor-pointer">
              <Upload className="w-4 h-4 text-orange-600" /> เลือกไฟล์
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e)=>onFiles(e.target.files)} />
            </label>
            <div className="mt-2 flex gap-2 flex-wrap">
              {files.map((f,i)=>(<div key={i} className="text-xs bg-white border p-1 rounded">{f.name}</div>))}
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-orange-600 text-white">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> กำลังบันทึก...</> : 'บันทึกสินค้า'}
            </button>
            <button type="button" onClick={()=>router.back()} className="px-4 py-2 rounded bg-slate-200">ยกเลิก</button>
          </div>
        </form>
      </div>
    </div>
  )
}
