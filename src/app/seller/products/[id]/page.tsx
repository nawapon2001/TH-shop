'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Swal from 'sweetalert2'
import { Loader2, Upload, Trash2 } from 'lucide-react'

export default function SellerEditProductPage() {
  const params = useParams() as { id?: string }
  const id = params?.id
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [product, setProduct] = useState<any>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState<number|''>('')
  const [description, setDescription] = useState('')
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])

  useEffect(()=>{
    if (!id) return
    const fetchProduct = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/seller-products?id=${encodeURIComponent(id)}`)
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.json().catch(()=>null)
        setProduct(data)
        setName(data?.name || '')
        setPrice(data?.price ?? '')
        setDescription(data?.description || '')
        setExistingImages(Array.isArray(data?.images) ? data.images : (data?.image ? [data.image] : []))
      } catch {
        Swal.fire({ icon: 'error', title: 'โหลดสินค้าไม่สำเร็จ' })
      } finally { setLoading(false) }
    }
    fetchProduct()
  }, [id])

  const onNewFiles = (fList: FileList | null) => {
    if (!fList?.length) return
    const list = Array.from(fList)
    setNewFiles(prev => [...prev, ...list.filter(f => !prev.some(p => p.name===f.name && p.size===f.size))])
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('id', id)
      fd.append('name', name.trim())
      fd.append('price', String(price))
      fd.append('description', description.trim())
      // append new files if any
      newFiles.forEach(f => fd.append('images', f))
      const res = await fetch('/api/seller-products', { method: 'PUT', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(()=>({}))
        throw new Error(err?.message || 'อัปเดตไม่สำเร็จ')
      }
      Swal.fire({ icon: 'success', title: 'อัปเดตสินค้าแล้ว', timer: 1100, showConfirmButton: false })
      router.push('/seller/manage')
    } catch (err:any) {
      Swal.fire({ icon: 'error', title: 'อัปเดตไม่สำเร็จ', text: err?.message || '' })
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!id) return
    const ok = await Swal.fire({ icon:'warning', title:'ลบสินค้านี้?', showCancelButton:true, confirmButtonText:'ลบ' })
    if (!ok.isConfirmed) return
    try {
      const res = await fetch(`/api/seller-products?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      Swal.fire({ icon:'success', title:'ลบแล้ว', timer:900, showConfirmButton:false })
      router.push('/seller/manage')
    } catch {
      Swal.fire({ icon:'error', title:'ลบไม่สำเร็จ' })
    }
  }

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="w-10 h-10 animate-spin text-orange-600" /></div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 py-12">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 shadow">
        <h1 className="text-xl font-bold text-orange-700 mb-4">แก้ไขสินค้า</h1>
        <form onSubmit={handleSave} className="space-y-4">
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
            <label className="block text-sm mb-1">รูปภาพที่มีอยู่</label>
            <div className="flex gap-2 flex-wrap">
              {existingImages.length === 0 && <div className="text-sm text-slate-500">ยังไม่มีรูป</div>}
              {existingImages.map((url, idx) => (
                <div key={idx} className="relative border rounded overflow-hidden w-28 h-20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`img-${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">อัปโหลดรูปใหม่ (เพิ่ม)</label>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded bg-white border border-orange-200 cursor-pointer">
              <Upload className="w-4 h-4 text-orange-600" /> เลือกไฟล์
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e)=>onNewFiles(e.target.files)} />
            </label>
            <div className="mt-2 flex gap-2 flex-wrap">
              {newFiles.map((f,i)=>(<div key={i} className="text-xs bg-white border p-1 rounded flex items-center gap-1"><span>{f.name}</span></div>))}
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 rounded bg-orange-600 text-white">
              {saving ? <><Loader2 className="w-4 h-4 animate-spin inline-block mr-2" /> กำลังบันทึก...</> : 'บันทึกการเปลี่ยนแปลง'}
            </button>
            <button type="button" onClick={()=>router.back()} className="px-4 py-2 rounded bg-slate-200">ยกเลิก</button>
            <button type="button" onClick={handleDelete} className="ml-auto px-4 py-2 rounded bg-red-600 text-white">ลบสินค้า</button>
          </div>
        </form>
      </div>
    </div>
  )
}
