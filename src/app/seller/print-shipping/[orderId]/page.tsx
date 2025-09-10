"use client"

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSellerUsername } from '@/lib/seller-auth'

interface Order {
  _id: string
  name: string
  phone: string
  address: string
  items: any[]
  amounts?: { total: number; shipping?: number }
  createdAt: string
  status: string
  shippingNumber?: string
  sellers?: any
}

interface SellerInfo {
  username: string
  displayName?: string
  phone?: string
  address?: string
  email?: string
}

export default function PrintShippingPage() {
  const params = useParams()
  const router = useRouter()

  // Update document title
  useEffect(() => {
    document.title = 'พิมพ์ใบปะหน้า | TH-THAI SHOP'
  }, [])
  const orderId = params.orderId as string
  const [order, setOrder] = useState<Order | null>(null)
  const [sellerInfo, setSellerInfo] = useState<SellerInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const username = getSellerUsername()
    if (!username) {
      router.push('/seller/auth')
      return
    }
    
    fetchOrderAndSellerInfo(username)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  useEffect(() => {
    // Auto print when data is loaded
    if (order && sellerInfo && !loading) {
      setTimeout(() => {
        window.print()
      }, 500)
    }
  }, [order, sellerInfo, loading])

  async function fetchOrderAndSellerInfo(username: string) {
    try {
      setLoading(true)
      
      // Fetch order details
      const orderRes = await fetch(`/api/orders?seller=${encodeURIComponent(username)}`, { 
        cache: 'no-store' 
      })
      if (!orderRes.ok) throw new Error('ไม่สามารถโหลดคำสั่งซื้อได้')
      
      const orders = await orderRes.json()
      const targetOrder = Array.isArray(orders) 
        ? orders.find((o: any) => o._id === orderId) 
        : null
      
      if (!targetOrder) {
        throw new Error('ไม่พบคำสั่งซื้อที่ระบุ')
      }
      
      setOrder(targetOrder)

      // Fetch seller info
      const sellerRes = await fetch(`/api/seller-info?username=${encodeURIComponent(username)}`)
      if (sellerRes.ok) {
        const sellerData = await sellerRes.json()
        setSellerInfo(sellerData)
      } else {
        // Fallback seller info
        setSellerInfo({ username })
      }
      
    } catch (error) {
      console.error('Error fetching data:', error)
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล')
      window.close()
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-700 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (!order || !sellerInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">ไม่พบข้อมูลคำสั่งซื้อ</p>
          <button 
            onClick={() => window.close()} 
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Print styles */}
      <style jsx>{`
        @media print {
          body { margin: 0; }
          .no-print { display: none !important; }
          .print-container { 
            padding: 20px;
            font-family: 'Sarabun', sans-serif;
            color: black;
            background: white;
          }
        }
        
        @page {
          size: A4;
          margin: 1cm;
        }
      `}</style>

      <div className="print-container min-h-screen bg-white p-8">
        {/* Header with no-print controls */}
        <div className="no-print mb-6 flex gap-4">
          <button 
            onClick={() => window.print()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            พิมพ์
          </button>
          <button 
            onClick={() => window.close()} 
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            ปิด
          </button>
        </div>

        {/* Shipping Label Content */}
        <div className="max-w-4xl mx-auto">
          {/* Document Title + Barcode */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">ใบจัดส่งสินค้า</h1>
            <p className="text-lg text-gray-600 mt-2">Shipping Label</p>
          </div>

          {/* Barcode */}
          <div className="text-center mb-6">
            {/* Using external barcode generator image (Code128) */}
            <img
              src={
                `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(order._id)}&code=Code128&translate-esc=false&unit=Fit&dpi=96`
              }
              alt={`Barcode ${order._id}`}
              className="mx-auto"
              style={{ maxWidth: 360, width: '100%', height: 'auto' }}
            />
            <div className="mt-2 text-sm break-words">{order._id}</div>
          </div>

          {/* Sender & Receiver (compact) */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="border border-gray-300 p-6 rounded-lg">
              <h2 className="text-lg font-bold text-gray-800 mb-3">ผู้ส่ง</h2>
              <div className="text-sm">
                <p className="font-semibold">{sellerInfo.displayName || sellerInfo.username}</p>
                {sellerInfo.phone && <p>โทร: {sellerInfo.phone}</p>}
                {sellerInfo.address && <p>ที่อยู่: {sellerInfo.address}</p>}
              </div>
            </div>

            <div className="border border-gray-300 p-6 rounded-lg">
              <h2 className="text-lg font-bold text-gray-800 mb-3">ผู้รับ</h2>
              <div className="text-sm">
                <p className="font-semibold">{order.name}</p>
                <p>โทร: {order.phone}</p>
                <p>ที่อยู่: {order.address}</p>
              </div>
            </div>
          </div>

          {/* Items (compact) */}
          {Array.isArray(order.items) && order.items.length > 0 && (
            <div className="border border-gray-300 p-6 rounded-lg mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">รายการสินค้า</h2>
              <ul className="space-y-3">
                {order.items.map((it: any, i: number) => (
                  <li key={i} className="flex items-center gap-3">
                    {it.image ? (
                      <img src={it.image} alt={it.name} className="w-12 h-12 object-cover rounded border" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded border" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{it.name}</div>
                      <div className="text-xs text-gray-600">จำนวน: {it.qty || it.quantity || 1}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Shipping Instructions */}
          <div className="border border-gray-300 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
              คำแนะนำการจัดส่ง (Shipping Instructions)
            </h2>
            <div className="space-y-2 text-sm">
              <p>• กรุณาระมัดระวังในการขนส่ง</p>
              <p>• ตรวจสอบความครบถ้วนของสินค้าก่อนจัดส่ง</p>
              <p>• แจ้งเลขขนส่งให้ลูกค้าทราบ</p>
              <p>• หากมีปัญหาการจัดส่ง กรุณาติดต่อลูกค้าโดยทันที</p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 mt-8 border-t pt-4">
            <p>ใบจัดส่งนี้สร้างโดยระบบ SignShop | พิมพ์เมื่อ: {new Date().toLocaleString('th-TH')}</p>
          </div>
        </div>
      </div>
    </>
  )
}

function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'รอดำเนินการ',
    processing: 'กำลังจัดการ',
    paid: 'ชำระเงินแล้ว',
    shipped: 'จัดส่งแล้ว',
    completed: 'สำเร็จ',
    cancelled: 'ยกเลิก'
  }
  return statusMap[status] || status
}
