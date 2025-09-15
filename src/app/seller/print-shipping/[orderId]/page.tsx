"use client"

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getSellerUsername } from '@/lib/seller-auth'
import { 
  Package, 
  Printer, 
  X, 
  ScanLine, 
  Send, 
  Download, 
  Phone, 
  Mail, 
  MapPin, 
  Truck, 
  Hash, 
  DollarSign, 
  ClipboardList, 
  Search, 
  Zap, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle, 
  Archive, 
  Shield, 
  Clock, 
  Target 
} from 'lucide-react'

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
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        
        @media print {
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          body { margin: 0; font-family: 'Sarabun', sans-serif; }
          .no-print { display: none !important; }
          .print-container { 
            padding: 8mm;
            font-family: 'Sarabun', sans-serif;
            color: #1a1a1a;
            background: white;
            font-size: 11px;
            line-height: 1.2;
          }
          .print-header {
            border-bottom: 2px solid #e97317;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .print-section {
            break-inside: avoid;
            margin-bottom: 8px;
          }
          .barcode-section {
            text-align: center;
            margin: 8px 0;
            padding: 8px;
            border: 1px dashed #e97317;
            background: #fef7ed;
          }
          .sender-receiver {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 8px 0;
          }
          .info-box {
            border: 1px solid #e97317;
            border-radius: 4px;
            padding: 8px;
            background: #fefefe;
          }
          .items-section {
            border: 1px solid #d1d5db;
            border-radius: 4px;
            padding: 8px;
            margin: 8px 0;
            background: #f9fafb;
          }
          .instructions-section {
            border: 1px solid #10b981;
            border-radius: 4px;
            padding: 8px;
            margin: 8px 0;
            background: #f0fdf4;
          }
          .footer-branding {
            border-top: 1px solid #e97317;
            padding-top: 8px;
            margin-top: 10px;
            text-align: center;
            background: linear-gradient(135deg, #fef7ed 0%, #fff7ed 100%);
            border-radius: 4px;
            padding: 8px;
          }
          .compact-text { font-size: 10px; line-height: 1.1; }
          .compact-title { font-size: 14px; margin-bottom: 4px; }
          .compact-header { font-size: 20px; margin-bottom: 6px; }
        }
        
        @page {
          size: A4;
          margin: 8mm;
        }
        
        .goocode-logo {
          font-weight: 700;
          background: linear-gradient(135deg, #e97317 0%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className="print-container min-h-screen bg-white p-8">
        {/* Header with no-print controls */}
        <div className="no-print mb-6 flex gap-4">
          <button 
            onClick={() => window.print()} 
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg font-medium flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> พิมพ์ใบจัดส่ง
          </button>
          <button 
            onClick={() => window.close()} 
            className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-200 shadow-lg font-medium flex items-center gap-2"
          >
            <X className="w-4 h-4" /> ปิดหน้าต่าง
          </button>
        </div>

        {/* Professional Shipping Label Content */}
        <div className="max-w-4xl mx-auto">
          {/* Compact Header */}
          <div className="print-header text-center mb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="compact-header font-bold text-gray-800">ใบจัดส่งสินค้า</h1>
                <p className="text-sm text-orange-600 font-medium">Professional Shipping Label</p>
              </div>
            </div>
            <div className="compact-text text-gray-600">
              เลขที่ออเดอร์: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-xs">{order._id}</span>
            </div>
          </div>

          {/* Compact Barcode Section */}
          <div className="barcode-section print-section">
            <h3 className="compact-title font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <ScanLine className="w-4 h-4" /> บาร์โค้ดสำหรับจัดส่ง
            </h3>
            <img
              src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(order._id)}&code=Code128&translate-esc=false&unit=Fit&dpi=96&eclevel=L`}
              alt={`Barcode ${order._id}`}
              className="mx-auto block"
              style={{ maxWidth: 300, width: '100%', height: 'auto' }}
            />
            <div className="mt-1 compact-text font-mono text-gray-600 break-words tracking-wider">
              {order._id}
            </div>
          </div>

          {/* Compact Sender & Receiver */}
          <div className="sender-receiver print-section">
            <div className="info-box">
              <h2 className="compact-title font-bold text-orange-600 mb-2 flex items-center gap-2">
                <Send className="w-4 h-4" /> ผู้ส่ง
              </h2>
              <div className="space-y-1">
                <p className="font-semibold text-sm text-gray-800">{sellerInfo.displayName || sellerInfo.username}</p>
                {sellerInfo.phone && (
                  <p className="flex items-center gap-2 compact-text text-gray-700">
                    <Phone className="w-3 h-3 text-green-600" /> {sellerInfo.phone}
                  </p>
                )}
                {sellerInfo.email && (
                  <p className="flex items-center gap-2 compact-text text-gray-700">
                    <Mail className="w-3 h-3 text-blue-600" /> {sellerInfo.email}
                  </p>
                )}
                {sellerInfo.address && (
                  <p className="flex items-start gap-2 compact-text text-gray-700">
                    <MapPin className="w-3 h-3 text-red-600 mt-0.5" /> 
                    <span>{sellerInfo.address}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="info-box">
              <h2 className="compact-title font-bold text-orange-600 mb-2 flex items-center gap-2">
                <Download className="w-4 h-4" /> ผู้รับ
              </h2>
              <div className="space-y-1">
                <p className="font-semibold text-sm text-gray-800">{order.name}</p>
                <p className="flex items-center gap-2 compact-text text-gray-700">
                  <Phone className="w-3 h-3 text-green-600" /> {order.phone}
                </p>
                <p className="flex items-start gap-2 compact-text text-gray-700">
                  <MapPin className="w-3 h-3 text-red-600 mt-0.5" /> 
                  <span>{order.address}</span>
                </p>
                {order.shippingNumber && (
                  <p className="flex items-center gap-2 compact-text text-gray-700 mt-2 p-1 bg-blue-50 rounded">
                    <Truck className="w-3 h-3 text-blue-600" /> 
                    <span className="font-mono">เลขขนส่ง: {order.shippingNumber}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Compact Items Section */}
          {Array.isArray(order.items) && order.items.length > 0 && (
            <div className="items-section print-section">
              <h2 className="compact-title font-bold text-gray-800 mb-2 flex items-center gap-2 border-b border-gray-200 pb-1">
                <Package className="w-4 h-4" /> รายการสินค้า ({order.items.length} รายการ)
              </h2>
              <div className="space-y-2">
                {order.items.map((item: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                    <div className="flex-shrink-0">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-10 h-10 object-cover rounded border border-gray-200" 
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                          <Package className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 compact-text leading-tight">{item.name}</h3>
                      <div className="flex items-center gap-2 mt-1 compact-text text-gray-600">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          จำนวน: <span className="font-semibold">{item.qty || item.quantity || 1}</span>
                        </span>
                        {item.price && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            ฿{typeof item.price === 'number' ? item.price.toLocaleString() : item.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Compact Order Summary */}
              {order.amounts && (
                <div className="mt-3 p-2 bg-orange-50 rounded border border-orange-200">
                  <h3 className="font-semibold text-gray-800 mb-2 compact-text flex items-center gap-2">
                    <DollarSign className="w-3 h-3" /> สรุปยอดเงิน
                  </h3>
                  <div className="space-y-1 compact-text">
                    {order.amounts.shipping && (
                      <div className="flex justify-between">
                        <span>ค่าจัดส่ง:</span>
                        <span className="font-semibold">฿{order.amounts.shipping.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-orange-600 border-t border-orange-200 pt-1">
                      <span>ยอดรวม:</span>
                      <span>฿{order.amounts.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Compact Instructions & Footer */}
          <div className="instructions-section print-section">
            <h2 className="compact-title font-bold text-green-700 mb-2 flex items-center gap-2">
              <ClipboardList className="w-4 h-4" /> คำแนะนำการจัดส่ง
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <ul className="space-y-1 compact-text text-gray-700">
                <li className="flex items-start gap-2">
                  <Search className="w-3 h-3 text-orange-500 mt-0.5" />
                  <span>ตรวจสอบความครบถ้วนของสินค้า</span>
                </li>
                <li className="flex items-start gap-2">
                  <Zap className="w-3 h-3 text-red-500 mt-0.5" />
                  <span>ระมัดระวังในการขนส่ง</span>
                </li>
                <li className="flex items-start gap-2">
                  <Smartphone className="w-3 h-3 text-blue-500 mt-0.5" />
                  <span>แจ้งเลขขนส่งให้ลูกค้า</span>
                </li>
              </ul>
              <ul className="space-y-1 compact-text text-gray-700">
                <li className="flex items-start gap-2">
                  <AlertTriangle className="w-3 h-3 text-yellow-500 mt-0.5" />
                  <span>หากมีปัญหา ติดต่อลูกค้าทันที</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-3 h-3 text-green-500 mt-0.5" />
                  <span>ยืนยันการส่งมอบ</span>
                </li>
                <li className="flex items-start gap-2">
                  <Archive className="w-3 h-3 text-purple-500 mt-0.5" />
                  <span>เก็บหลักฐานการจัดส่ง</span>
                </li>
              </ul>
            </div>
            
            {/* Compact Status & Date */}
            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200 flex justify-between items-center compact-text">
              <div>
                <span className="text-gray-600">สถานะ:</span>
                <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full font-medium">
                  {getStatusLabel(order.status)}
                </span>
              </div>
              <div className="text-gray-600">
                วันที่: <span className="font-medium">{new Date(order.createdAt).toLocaleDateString('th-TH')}</span>
              </div>
            </div>
          </div>

          {/* Compact Footer with GooCode Branding */}
          <div className="footer-branding print-section">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="text-center">
                <div className="goocode-logo text-lg font-bold">GooCode</div>
                <p className="compact-text text-gray-600">Professional E-Commerce Solutions</p>
              </div>
            </div>
            
            <div className="border-t border-orange-200 pt-2 text-center space-y-1">
              <p className="compact-text text-gray-600 flex items-center justify-center gap-2">
                <Printer className="w-3 h-3" /> พิมพ์เมื่อ: <span className="font-medium">{new Date().toLocaleString('th-TH')}</span>
              </p>
              <p className="text-xs text-gray-500">© 2025 GooCode - www.goocode.com</p>
              <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Secure
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Fast
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" /> Professional
                </span>
              </div>
            </div>
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
