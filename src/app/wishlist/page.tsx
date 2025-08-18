'use client'

import React, { useEffect, useState } from 'react'
import Header from '../../components/Header'
import { Heart, Loader2, PlusCircle } from 'lucide-react'

export default function WishlistPage() {
  const [user, setUser] = useState<string | null>(null)
  const [wishlist, setWishlist] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // อ่าน user จาก localStorage (เหมือนหน้า login)
    try {
      const u = localStorage.getItem('user')
      setUser(u)
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

  // mock สินค้าใหม่สำหรับเพิ่มเข้ารายการที่ถูกใจ
  const mockProduct = {
    id: Date.now(),
    name: 'เกมใหม่สุดฮิต',
    desc: 'เกมยอดนิยมสำหรับทุกวัย',
    image: '/game-demo.png',
    price: 990
  }

  // เพิ่มสินค้าที่ถูกใจ
  const handleAddWishlist = async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      // ส่ง user ไปด้วย
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, item: mockProduct })
      })
      if (!res.ok) throw new Error()
      // โหลดรายการใหม่หลังเพิ่ม (ส่ง user ไปด้วย)
      const getRes = await fetch(`/api/wishlist?user=${encodeURIComponent(user)}`)
      const data = await getRes.json()
      setWishlist(data.wishlist || [])
    } catch {
      setError('ไม่สามารถบันทึกสินค้าที่ถูกใจได้')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-orange-50/30">
      <Header user={user} />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-6">
          <Heart className="w-7 h-7 text-orange-600" />
          <h1 className="text-2xl font-bold text-orange-700">สินค้าที่ถูกใจของคุณ</h1>
        </div>
        {/* ปุ่มเพิ่มสินค้า (mock) */}
        {user && (
          <button
            onClick={handleAddWishlist}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2 text-white font-semibold shadow hover:from-orange-600 hover:to-amber-500"
            disabled={loading}
          >
            <PlusCircle className="w-5 h-5" />
            เพิ่มเกมใหม่สุดฮิตเข้ารายการที่ถูกใจ
          </button>
        )}
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
                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg border" />
                <div className="flex-1">
                  <div className="font-semibold text-orange-700">{item.name}</div>
                  <div className="text-sm text-slate-600">{item.desc}</div>
                </div>
                <div className="font-bold text-orange-600">{item.price} บาท</div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
