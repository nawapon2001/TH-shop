'use client'
import React, { useEffect, useState } from 'react'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  useEffect(() => {
    async function fetchOrders() {
      const res = await fetch('/api/orders')
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    }
    fetchOrders()
  }, [])

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
              <div className="mb-2 flex items-center gap-2">
                <span className="font-semibold">สถานะ:</span>
                {order.status === 'pending' && <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-bold">รอดำเนินการ</span>}
                {order.status === 'processing' && <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-bold">ดำเนินการอยู่</span>}
                {order.status === 'shipped' && <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold">จัดส่งแล้ว</span>}
                {order.status === 'paid' && <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">ชำระเงินแล้ว</span>}
                {order.status === 'completed' && <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">สำเร็จ</span>}
                {order.status === 'cancelled' && <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-bold">ยกเลิก</span>}
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
