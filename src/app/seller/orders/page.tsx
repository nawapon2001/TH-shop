"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSellerUsername } from '@/lib/seller-auth'
import Swal from 'sweetalert2'
import { Printer } from 'lucide-react'

export default function SellerOrdersPage() {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusMap, setStatusMap] = useState<Record<string,string>>({})
  const [shipMap, setShipMap] = useState<Record<string,string>>({})

  // Update document title
  useEffect(() => {
    document.title = 'ออเดอร์ขาย | TH-THAI SHOP'
  }, [])

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-6">
              <div className="w-12 h-12 text-slate-400">
                📦
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">ยังไม่มีคำสั่งซื้อ</h2>
            <p className="text-slate-500 max-w-md">เมื่อมีลูกค้าสั่งซื้อสินค้าจากร้านของคุณ คำสั่งซื้อจะแสดงที่นี่</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                คำสั่งซื้อทั้งหมด
              </h1>
              <p className="text-slate-600">จัดการคำสั่งซื้อและสถานะการจัดส่ง</p>
              <div className="mt-4 flex items-center gap-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {orders.length} คำสั่งซื้อ
                </span>
                <span className="text-slate-500 text-sm">ร้าน: {username}</span>
              </div>
            </div>

            <div className="grid gap-6">
              {orders.map((order) => (
                <div key={order._id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
                  {/* Order Header */}
                  <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="text-white">
                        <h3 className="text-xl font-bold mb-1">
                          คำสั่งซื้อ #{(order._id||'').toString().slice(-8)}
                        </h3>
                        <p className="text-blue-100">
                          ลูกค้า: {order.name} • {order.phone}
                        </p>
                        <p className="text-blue-100 text-sm mt-1">
                          📅 {new Date(order.createdAt||'').toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="text-right text-white">
                        <div className="text-3xl font-bold mb-1">
                          ฿{(order.amounts?.total||0).toLocaleString()}
                        </div>
                        <div className="text-blue-100 text-sm">ยอดรวม</div>
                      </div>
                    </div>
                  </div>

                  {/* Order Content */}
                  <div className="p-6">
                    {/* Shipping Address */}
                    <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        📍 ที่อยู่จัดส่ง
                      </h4>
                      <p className="text-slate-600">{order.address}</p>
                    </div>

                    {/* Order Items */}
                    {Array.isArray(order.items) && order.items.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                          🛍️ รายการสินค้า
                        </h4>
                        <div className="space-y-3">
                          {order.items.map((it:any, i:number) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-slate-200 flex-shrink-0">
                                {it.image ? (
                                  <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                                    📦
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-slate-800 truncate">{it.name}</h5>
                                <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                                  <span>จำนวน: {it.qty || it.quantity || 1}</span>
                                  <span>ราคาต่อชิ้น: ฿{(it.price||0).toLocaleString()}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-lg text-blue-600">
                                  ฿{(((it.price||0)*(it.qty||it.quantity||1))||0).toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500">รวม</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order Management */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                      <h4 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        ⚙️ จัดการคำสั่งซื้อ
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            สถานะคำสั่งซื้อ
                          </label>
                          <select 
                            value={statusMap[order._id]||'pending'} 
                            onChange={e=>setStatusMap(prev=>({...prev,[order._id]:e.target.value}))} 
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          >
                            <option value="pending">🕐 รอดำเนินการ</option>
                            <option value="processing">⚡ กำลังจัดการ</option>
                            <option value="paid">💳 ชำระเงินแล้ว</option>
                            <option value="shipped">🚚 จัดส่งแล้ว</option>
                            <option value="completed">✅ สำเร็จ</option>
                            <option value="cancelled">❌ ยกเลิก</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            เลขติดตามพัสดุ
                          </label>
                          <input 
                            value={shipMap[order._id]||''} 
                            onChange={e=>setShipMap(prev=>({...prev,[order._id]:e.target.value}))} 
                            placeholder="ใส่เลขติดตามพัสดุ" 
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          />
                        </div>

                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => handlePrintShippingLabel(order)}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                            title="พิมพ์ใบจัดส่ง"
                          >
                            <Printer className="w-5 h-5" />
                            พิมพ์ใบจัดส่ง
                          </button>
                          
                          <button 
                            onClick={()=>handleUpdateOrder(order._id)} 
                            className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                          >
                            💾 บันทึกการเปลี่ยนแปลง
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
