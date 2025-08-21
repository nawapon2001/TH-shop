'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'

type Order = {
  _id: string
  buyerName?: string
  phone?: string
  address?: string
  items?: { name: string; price?: number }[]
  status?: string
  createdAt?: string
}

export default function SellerOrdersPage() {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = typeof window !== 'undefined' ? localStorage.getItem('sellerUser') : null
    if (!u) {
      router.push('/seller/auth'); return
    }
    setUsername(u)
    ;(async () => {
      try {
        const res = await fetch(`/api/orders?seller=${encodeURIComponent(u)}`)
        if (!res.ok) throw new Error('ไม่สามารถโหลดคำสั่งซื้อได้')
        const data = await res.json().catch(()=>[])
        setOrders(Array.isArray(data) ? data : [])
      } catch (err:any) {
        Swal.fire({ icon: 'error', title: 'โหลดคำสั่งซื้อไม่สำเร็จ', text: err?.message || '' })
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  if (loading) return <div className="min-h-screen grid place-items-center">กำลังโหลดคำสั่งซื้อ...</div>

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-xl font-bold text-orange-700 mb-4">คำสั่งซื้อของร้าน</h1>
        {orders.length === 0 ? (
          <div className="text-sm text-slate-500">ยังไม่มีคำสั่งซื้อ</div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => (
              <div key={o._id} className="p-3 border rounded flex justify-between items-start">
                <div>
                  <div className="font-semibold">#{o._id.slice(-6)} — {o.buyerName || 'ลูกค้าไม่ระบุ'}</div>
                  <div className="text-sm text-slate-600">{o.items?.map(it=>it.name).join(', ')}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-medium">{o.status || '-'}</div>
                  <div className="text-slate-500">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4">
          <button onClick={()=>router.push('/seller/adminSeller')} className="px-3 py-2 rounded bg-slate-200">กลับ</button>
        </div>
      </div>
    </div>
  )
}
