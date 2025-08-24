'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Swal from 'sweetalert2'
import { ShoppingCart, Store } from 'lucide-react'

export default function SellerStorefront() {
  const params = useParams() as { username?: string }
  const router = useRouter()
  const username = params.username
  const [seller, setSeller] = useState<any | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!username) return
    const fetchData = async () => {
      try {
        setLoading(true)
        const sRes = await fetch(`/api/seller-info?username=${encodeURIComponent(username)}`)
        if (sRes.status === 404) {
          // seller not found — guide user to open a shop
          await Swal.fire({ icon: 'info', title: 'ไม่พบร้านค้า', text: 'ร้านค้าที่คุณค้นหาไม่พบ ระบบจะพาไปหน้าสมัครเปิดร้าน' })
          router.push('/seller/create')
          return
        }
        if (!sRes.ok) throw new Error('ไม่สามารถโหลดข้อมูลร้านค้า')
        const s = await sRes.json().catch(() => null)
        setSeller(s)
        const pRes = await fetch(`/api/seller-products?username=${encodeURIComponent(username)}`)
        const p = pRes.ok ? (await pRes.json()).slice(0, 50) : []
        setProducts(Array.isArray(p) ? p : [])
      } catch (err: any) {
        console.error(err)
        Swal.fire({ icon: 'error', title: 'โหลดข้อมูลไม่สำเร็จ', text: err?.message || '' })
        router.push('/')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [username, router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-orange-700 font-medium">กำลังโหลดร้านค้า...</p>
      </div>
    </div>
  )

  if (!seller) return null

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center overflow-hidden">
              {seller.image ? <img src={seller.image} alt={seller.shopName} className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-orange-500" />}
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-800">{seller.shopName}</div>
              <div className="text-sm text-slate-500">ผู้ขาย: {seller.fullName || seller.username}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/checkout" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-medium">
              <ShoppingCart className="w-4 h-4" /> ตะกร้า
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto p-4 py-8">
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">สินค้าจากร้านนี้</h2>
          {products.length === 0 ? (
            <div className="text-slate-500">ร้านนี้ยังไม่มีสินค้า</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((p: any) => (
                <Link key={p._id} href={`/product/${p._id}`} className="bg-white rounded-xl border border-slate-200 p-3 hover:shadow-lg transition">
                  <div className="aspect-square bg-slate-50 mb-3 overflow-hidden rounded">
                    {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-slate-400">ไม่มีรูป</div>}
                  </div>
                  <div className="text-sm font-semibold text-slate-800">{p.name}</div>
                  <div className="text-sm text-green-700 font-bold mt-1">{Number(p.price).toLocaleString()} บาท</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
