'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Header from '@/components/Header'
import {
  Package, ShoppingBag, Truck, CreditCard, Calendar, Receipt, Printer,
  ChevronDown, ChevronUp, Phone, MapPin, User
} from 'lucide-react'

type Order = {
  _id?: string
  name?: string
  address?: string
  phone?: string
  createdAt?: string
  status?: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
  delivery?: 'standard' | 'express'
  payment?: 'cod' | 'transfer' | 'card'
  items?: { _id?: string; name?: string; price?: number; image?: string; images?: string[] }[]
  amounts?: { subtotal?: number; shipCost?: number; codFee?: number; total?: number }
  shippingNumber?: string
}

const formatTHB = (n = 0) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0 }).format(n)
const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' }) : '-'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Fetch orders only once on mount (remove polling)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/orders')
        const data = await res.json()
        setOrders(Array.isArray(data) ? data : [])
      } catch {
        setError('โหลดข้อมูลไม่สำเร็จ')
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  // Show orders newest first (sort by createdAt descending)
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
      return dateB - dateA
    })
  }, [orders])

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <ShoppingBag className="w-7 h-7 text-orange-600" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-orange-800">คำสั่งซื้อของคุณ</h1>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl border border-orange-100 bg-white animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 text-red-700 p-4">{error}</div>
        ) : sortedOrders.length === 0 ? (
          <div className="rounded-2xl border border-orange-100 bg-white p-10 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-orange-100 grid place-items-center mb-3">
              <Package className="w-7 h-7 text-orange-700" />
            </div>
            <div className="text-lg font-semibold text-orange-800">ยังไม่มีคำสั่งซื้อ</div>
            <p className="text-gray-600 mt-1">เริ่มช้อปปิ้งและกลับมาดูคำสั่งซื้อที่นี่ได้เลย</p>
            <a
              href="/"
              className="inline-block mt-4 px-5 h-11 rounded-full bg-orange-600 text-white font-semibold hover:bg-orange-700"
            >
              ไปหน้าสินค้า
            </a>
          </div>
        ) : (
          <div className="space-y-5">
            {sortedOrders.map((order, idx) => (
              <OrderCard key={order._id ?? idx} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function OrderCard({ order }: { order: Order }) {
  const [open, setOpen] = useState(true)
  const items = Array.isArray(order.items) ? order.items : []
  const calcSubtotal = items.reduce((s, it) => s + (it.price || 0), 0)
  const shipCost = order.amounts?.shipCost ?? (order.delivery === 'express' ? 50 : 0)
  const codFee = order.amounts?.codFee ?? (order.payment === 'cod' ? 20 : 0)
  const subtotal = order.amounts?.subtotal ?? calcSubtotal
  const total = order.amounts?.total ?? subtotal + shipCost + codFee

  // Status badge
  const statusLabel =
    order.status === 'shipped'
      ? <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold">จัดส่งแล้ว</span>
      : order.status === 'processing'
      ? <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-bold">ดำเนินการอยู่</span>
      : order.status === 'paid'
      ? <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">ชำระเงินแล้ว</span>
      : order.status === 'completed'
      ? <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">สำเร็จ</span>
      : order.status === 'cancelled'
      ? <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-bold">ยกเลิก</span>
      : <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-bold">รอดำเนินการ</span>

  return (
    <div className="rounded-2xl border border-orange-100 bg-white shadow-sm p-5">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Receipt className="w-5 h-5 text-orange-700" />
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 truncate">
              เลขที่คำสั่งซื้อ: <span className="text-orange-800">{order._id ?? '-'}</span>
            </div>
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(order.createdAt)}
            </div>
          </div>
        </div>
        <div>{statusLabel}</div>
      </div>

      {/* Address & contact */}
      <div className="grid sm:grid-cols-3 gap-3 mt-4">
        <InfoRow icon={<User className="w-4 h-4" />} label="ผู้รับ" value={order.name || '-'} />
        <InfoRow icon={<Phone className="w-4 h-4" />} label="โทร" value={order.phone || '-'} />
        <InfoRow icon={<MapPin className="w-4 h-4" />} label="ที่อยู่" value={order.address || '-'} />
      </div>

      {/* Items */}
      <div className="mt-4">
        <button
          onClick={() => setOpen((s) => !s)}
          className="inline-flex items-center gap-2 text-orange-700 hover:text-orange-900"
        >
          รายการสินค้า ({items.length}) {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {open && (
          <ul className="mt-2 divide-y rounded-xl border border-orange-100 overflow-hidden">
            {items.map((it, i) => {
              const img = it.images?.[0] || it.image || 'https://via.placeholder.com/80x80?text=No+Image'
              return (
                <li key={it._id ?? i} className="p-3 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={it.name ?? 'item'} className="w-14 h-14 rounded border object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 line-clamp-1">{it.name ?? '-'}</div>
                    <div className="text-xs text-gray-500">จำนวน 1 ชิ้น</div>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">฿{formatTHB(it.price ?? 0)}</div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 grid sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
          <div className="text-sm text-gray-600 mb-1 flex items-center gap-2">
            <Truck className="w-4 h-4" /> วิธีจัดส่ง: {order.delivery === 'express' ? 'ด่วนพิเศษ' : 'มาตรฐาน'}
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> ชำระเงิน: {paymentLabel(order.payment)}
          </div>
        </div>
        <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-4">
          <Row label="ยอดสินค้า" value={`฿${formatTHB(subtotal)}`} />
          <Row label="ค่าจัดส่ง" value={shipCost === 0 ? 'ฟรี' : `฿${formatTHB(shipCost)}`} />
          <Row label="ค่าธรรมเนียม COD" value={codFee > 0 ? `฿${formatTHB(codFee)}` : '-'} />
          <div className="h-px bg-orange-100 my-2" />
          <Row label="ยอดสุทธิ" value={`฿${formatTHB(total)}`} bold />
        </div>
      </div>

      {/* Shipping number display */}
      {order.shippingNumber && (
        <div className="mt-4 flex items-center gap-2 text-green-700 font-bold">
          <Truck className="w-5 h-5" />
          <span>เลขขนส่งล่าสุด:</span>
          <span className="bg-green-100 px-3 py-1 rounded-full">{order.shippingNumber}</span>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2 justify-end">
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-orange-200 bg-white text-orange-800 hover:bg-orange-50"
        >
          <Printer className="w-4 h-4" /> พิมพ์ใบสรุป
        </button>
      </div>
    </div>
  )
}

/* ---------- Small UI parts ---------- */
function labelStatus(s: Order['status']) {
  switch (s) {
    case 'paid': return 'ชำระเงินแล้ว'
    case 'shipped': return 'จัดส่งแล้ว'
    case 'completed': return 'สำเร็จ'
    case 'cancelled': return 'ยกเลิก'
    default: return 'รอดำเนินการ'
  }
}
function paymentLabel(p?: Order['payment']) {
  switch (p) {
    case 'cod': return 'ปลายทาง (COD)'
    case 'card': return 'บัตรเครดิต/เดบิต'
    default: return 'โอนเงิน'
  }
}
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-orange-100 bg-white p-3">
      <div className="text-xs text-gray-500 flex items-center gap-1">{icon} {label}</div>
      <div className="text-sm font-medium text-gray-800 mt-0.5">{value}</div>
    </div>
  )
}
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={'text-gray-600 ' + (bold ? 'font-semibold' : '')}>{label}</span>
      <span className={bold ? 'font-extrabold text-orange-800' : 'font-semibold'}>{value}</span>
    </div>
  )
}
