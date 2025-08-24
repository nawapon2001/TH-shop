"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSellerUsername, logoutSeller } from '@/lib/seller-auth'
import Swal from 'sweetalert2'
import { Store, LogOut, Printer } from 'lucide-react'

export default function SellerOrdersPage() {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusMap, setStatusMap] = useState<Record<string,string>>({})
  const [shipMap, setShipMap] = useState<Record<string,string>>({})

  useEffect(() => {
    const u = getSellerUsername()
    if (!u) {
      router.push('/seller/auth')
      return
    }
    setUsername(u)
    fetchOrders(u)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchOrders(u: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders?seller=${encodeURIComponent(u)}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('ไม่สามารถโหลดคำสั่งซื้อได้')
      const d = await res.json().catch(() => [])
      const arr = Array.isArray(d) ? d : []
      setOrders(arr)
      const sMap: Record<string,string> = {}
      const shMap: Record<string,string> = {}
      arr.forEach((o:any) => { sMap[o._id] = o.status || 'pending'; shMap[o._id] = o.shippingNumber || '' })
      setStatusMap(sMap)
      setShipMap(shMap)
    } catch (err:any) {
      console.error('fetch orders', err)
      Swal.fire({ icon: 'error', title: 'โหลดคำสั่งซื้อไม่สำเร็จ', text: err?.message || '' })
    } finally { setLoading(false) }
  }

  const handleLogout = () => {
    logoutSeller()
    router.push('/seller/auth')
  }

  const handleUpdateOrder = async (orderId: string) => {
    try {
      const payload: any = { id: orderId }
      if (statusMap[orderId]) payload.status = statusMap[orderId]
      if (shipMap[orderId] !== undefined) payload.shippingNumber = shipMap[orderId]
      const res = await fetch('/api/orders', { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const err = await res.json().catch(()=>({})); throw new Error(err?.error || err?.message || 'update failed')
      }
      Swal.fire({ icon: 'success', title: 'อัปเดตสถานะแล้ว', timer: 900, showConfirmButton: false })
      await fetchOrders(username as string)
    } catch (err:any) {
      console.error('update order', err)
      Swal.fire({ icon: 'error', title: 'อัปเดตไม่สำเร็จ', text: err?.message || '' })
    }
  }

  const handlePrintShippingLabel = (order: any) => {
    // สร้าง URL สำหรับหน้าพิมพ์ใบจัดส่ง
    const printUrl = `/seller/print-shipping/${order._id}`
    window.open(printUrl, '_blank')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-orange-700 font-medium">กำลังโหลดคำสั่งซื้อ...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <header className="bg-white border-b border-orange-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-lg">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-orange-800">คำสั่งซื้อร้านของฉัน</h1>
              <p className="text-slate-600">{username}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/seller/manage')} className="px-3 py-2 rounded bg-white border">กลับ</button>
            <button onClick={handleLogout} className="px-3 py-2 rounded border">ออกจากระบบ</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {orders.length === 0 ? (
          <div className="text-slate-500">ยังไม่มีคำสั่งซื้อสำหรับร้านนี้</div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">คำสั่งซื้อ: #{(order._id||'').toString().slice(-8)}</div>
                    <div className="text-sm text-slate-600">ลูกค้า: {order.name} • {order.phone}</div>
                    <div className="text-sm text-slate-500 mt-2">ที่อยู่: {order.address}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-600 font-bold">฿{(order.amounts?.total||0).toLocaleString()}</div>
                    <div className="text-sm text-slate-600">{new Date(order.createdAt||'').toLocaleString()}</div>
                  </div>
                </div>

                {Array.isArray(order.items) && order.items.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    {order.items.map((it:any, i:number) => (
                      <div key={i} className="flex items-center gap-3 rounded-md p-2 bg-slate-50 border border-slate-100">
                        {it.image ? <img src={it.image} alt={it.name} className="w-12 h-12 object-cover rounded-md" /> : <div className="w-12 h-12 bg-slate-100 rounded-md" />}
                        <div className="flex-1">
                          <div className="font-medium">{it.name}</div>
                          <div className="text-sm text-slate-600">จำนวน: {it.qty || it.quantity || 1} • ฿{(it.price||0).toLocaleString()}</div>
                        </div>
                        <div className="text-right text-sm text-slate-600">รวม: ฿{(((it.price||0)*(it.qty||it.quantity||1))||0).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex items-center gap-3">
                  <select value={statusMap[order._id]||'pending'} onChange={e=>setStatusMap(prev=>({...prev,[order._id]:e.target.value}))} className="px-3 py-2 border rounded">
                    <option value="pending">รอดำเนินการ</option>
                    <option value="processing">กำลังจัดการ</option>
                    <option value="paid">ชำระเงินแล้ว</option>
                    <option value="shipped">จัดส่งแล้ว</option>
                    <option value="completed">สำเร็จ</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>

                  <input value={shipMap[order._id]||''} onChange={e=>setShipMap(prev=>({...prev,[order._id]:e.target.value}))} placeholder="เลขขนส่ง" className="px-3 py-2 border rounded" />

                  <button 
                    onClick={() => handlePrintShippingLabel(order)}
                    className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                    title="พิมพ์ใบจัดส่ง"
                  >
                    <Printer className="w-4 h-4" />
                    พิมพ์ใบจัดส่ง
                  </button>

                  <button onClick={()=>handleUpdateOrder(order._id)} className="ml-auto px-4 py-2 rounded bg-orange-600 text-white">บันทึก</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
