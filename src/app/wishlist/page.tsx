'use client'

import React, { useEffect, useState } from 'react'
import Header from '../../components/Header'
import Link from 'next/link'
import { Heart, Loader2, Trash2 } from 'lucide-react'
import Swal from 'sweetalert2'

const THUMB_PLACEHOLDER = 'https://via.placeholder.com/80x80?text=No+Image'

function resolveImgSrc(raw?: string) {
  const fallback = THUMB_PLACEHOLDER
  if (!raw) return fallback
  const s = raw.trim()
  if (!s) return fallback
  if (s.startsWith('data:') || s.startsWith('blob:')) return s
  if (s.startsWith('http://') || s.startsWith('https://')) return s
  if (s.startsWith('/')) return s
  if (/^(uploads|products|images|banners)\//i.test(s)) return '/' + s.replace(/^\/+/, '')
  return '/uploads/' + s.replace(/^\/+/, '')
}

export default function WishlistPage() {
  const [user, setUser] = useState<string | null>(null)
  const [wishlist, setWishlist] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Update document title
  useEffect(() => {
    document.title = 'สินค้าที่ถูกใจ | TH-THAI SHOP'
  }, [])

  useEffect(() => {
    // อ่าน user จาก localStorage (เหมือนหน้า login)
    try {
      // canonical key is 'user' (customers). If not present, allow fallback from sellerUser
      const raw = localStorage.getItem('user') || localStorage.getItem('sellerUser')
      if (!raw) { setUser(null); return }
      let uname = raw
      try {
        let cur = raw
        for (let i = 0; i < 5; i++) {
          try { const next = decodeURIComponent(cur); if (next === cur) break; cur = next } catch { break }
        }
        uname = cur
      } catch {}
      setUser(uname)
    } catch {}
  }, [])

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    // ส่ง user ไปด้วย
    fetch(`/api/wishlist?user=${encodeURIComponent(user)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        setWishlist(data.wishlist || [])
        setLoading(false)
      })
      .catch(() => {
        setError('เกิดข้อผิดพลาดในการโหลดรายการที่ถูกใจ')
        setLoading(false)
      })
  }, [user])

  const handleDelete = async (id: string) => {
    try {
      const confirm = await Swal.fire({
        title: 'ลบสินค้าที่ถูกใจ?',
        text: 'คุณแน่ใจว่าต้องการลบสินค้าชิ้นนี้จากรายการที่ถูกใจหรือไม่?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก'
      })
      if (!confirm.isConfirmed) return
      const res = await fetch(`/api/wishlist?user=${encodeURIComponent(user || '')}&id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (res.ok) {
        setWishlist((prev) => prev.filter((i) => i.id !== id))
        Swal.fire({ icon: 'success', title: 'ลบเรียบร้อย', timer: 1000, showConfirmButton: false })
      } else {
        Swal.fire({ icon: 'error', title: 'ไม่สามารถลบได้' })
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('delete wishlist', err)
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด' })
    }
  }

  // wishlist handled by product like action; this page only reads from API

  return (
    <div className="min-h-screen bg-white">
      <Header user={user} />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-6">
          <Heart className="w-7 h-7 text-orange-600" />
          <h1 className="text-2xl font-bold text-orange-700">สินค้าที่ถูกใจของคุณ</h1>
        </div>
  {/* ปุ่มเพิ่มสินค้า (mock) ถูกย้ายไปที่ปุ่มหัวใจบนการ์ดสินค้า */}
        {!user ? (
          <div className="rounded-xl bg-white/80 border border-orange-200 p-6 text-center text-orange-700 font-semibold">
            กรุณาเข้าสู่ระบบเพื่อดูรายการสินค้าที่ถูกใจ
          </div>
        ) : loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-red-700 text-center">
            {error}
          </div>
        ) : wishlist.length === 0 ? (
          <div className="rounded-xl bg-white/80 border border-orange-200 p-6 text-center text-slate-600">
            คุณยังไม่มีสินค้าที่ถูกใจ
          </div>
        ) : (
          <ul className="grid gap-4">
            {wishlist.map((item: any) => (
              <li key={item.id} className="rounded-xl border border-orange-200 bg-white p-4 flex items-center gap-4 shadow-sm">
                <Link href={`/product/${encodeURIComponent(item.id)}`} className="flex-1 flex items-center gap-4 no-underline">
                  <img src={resolveImgSrc(item.image || (item.images && item.images[0]))} alt={item.name} className="w-16 h-16 object-cover rounded-lg border" onError={(e)=>{(e.currentTarget as HTMLImageElement).src = THUMB_PLACEHOLDER}} />
                  <div>
                    <div className="font-semibold text-orange-700">{item.name}</div>
                    <div className="text-sm text-slate-600">{item.desc}</div>
                  </div>
                </Link>
                <div className="font-bold text-orange-600">{item.price} บาท</div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  className="ml-2 rounded-md p-2 text-red-600 hover:bg-red-50"
                  aria-label="ลบจากรายการที่ชอบ"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
