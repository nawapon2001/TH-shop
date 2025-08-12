'use client'
import React, { useEffect, useState } from 'react'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/orders')
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingId(orderId)
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus })
      })
      
      if (res.ok) {
        // Refresh orders after update
        fetchOrders()
      } else {
        console.error('Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  const updateShippingNumber = async (orderId: string, shippingNumber: string) => {
    try {
      setUpdatingId(orderId)
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, shippingNumber })
      })
      
      if (res.ok) {
        fetchOrders()
      } else {
        console.error('Failed to update shipping number')
      }
    } catch (error) {
      console.error('Error updating shipping:', error)
    } finally {
      setUpdatingId(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      case 'paid': return 'bg-amber-100 text-amber-800'
      case 'shipped': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-emerald-100 text-emerald-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'รอดำเนินการ'
      case 'processing': return 'ดำเนินการอยู่'
      case 'paid': return 'ชำระเงินแล้ว'
      case 'shipped': return 'จัดส่งแล้ว'
      case 'completed': return 'สำเร็จ'
      case 'cancelled': return 'ยกเลิก'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-orange-700">คำสั่งซื้อทั้งหมด (Admin)</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-orange-700">คำสั่งซื้อทั้งหมด (Admin)</h1>
      {orders.length === 0 ? (
        <div className="text-gray-500">ยังไม่มีคำสั่งซื้อ</div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, idx) => (
            <div key={order._id ?? idx} className="bg-white rounded-xl shadow border border-orange-100 p-5">
              <div className="font-semibold text-orange-700 mb-2">ชื่อผู้รับ: {order.name}</div>
              <div className="mb-1">ที่อยู่: {order.address}</div>
              <div className="mb-1">เบอร์โทร: {order.phone}</div>
              <div className="mb-2">วันที่สั่งซื้อ: {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</div>
              
              {/* Status Update Section */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">สถานะ:</label>
                <select 
                  value={order.status || 'pending'}
                  onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                  disabled={updatingId === order._id}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="pending">รอดำเนินการ</option>
                  <option value="processing">ดำเนินการอยู่</option>
                  <option value="paid">ชำระเงินแล้ว</option>
                  <option value="shipped">จัดส่งแล้ว</option>
                  <option value="completed">สำเร็จ</option>
                  <option value="cancelled">ยกเลิก</option>
                </select>
              </div>

              {/* Shipping Number Update */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">เลขขนส่ง:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    defaultValue={order.shippingNumber || ''}
                    placeholder="กรอกเลขขนส่ง"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateShippingNumber(order._id, e.currentTarget.value)
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement
                      updateShippingNumber(order._id, input.value)
                    }}
                    disabled={updatingId === order._id}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                  >
                    บันทึก
                  </button>
                </div>
              </div>

              {/* Current Status Display */}
              <div className="mb-2 flex items-center gap-2">
                <span className="font-semibold">สถานะปัจจุบัน:</span>
                <span className={`px-3 py-1 rounded-full font-bold ${getStatusColor(order.status || 'pending')}`}>
                  {getStatusLabel(order.status || 'pending')}
                </span>
              </div>

              {order.shippingNumber && (
                <div className="mb-2 flex items-center gap-2 text-green-700 font-bold">
                  <span>เลขขนส่งล่าสุด:</span>
                  <span className="bg-green-100 px-3 py-1 rounded-full">{order.shippingNumber}</span>
                </div>
              )}

              <div className="font-semibold mb-1">รายการสินค้า:</div>
              <ul className="bg-orange-50 rounded p-3">
                {order.items.map((item: any, i: number) => (
                  <li key={i} className="flex justify-between py-1">
                    <span>{item.name}</span>
                    <span>{item.price.toLocaleString()} บาท</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
