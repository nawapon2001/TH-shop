// src/app/admin/orders.tsx
'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Swal from 'sweetalert2'
import {
  RefreshCw, Search, Filter, SortDesc,
  Truck, User, Phone, MapPin, CalendarClock, Package,
  CheckCircle2, Clock, XCircle, BadgeCheck, CreditCard
} from 'lucide-react'

type OrderItem = { name: string; price: number; image?: string; qty?: number }
type Amounts = { subtotal?: number; shipCost?: number; codFee?: number; total?: number }
type Order = {
  _id: string
  name: string
  address: string
  phone: string
  items: OrderItem[]
  status?: 'pending' | 'processing' | 'shipped' | 'paid' | 'completed' | 'cancelled'
  shippingNumber?: string
  createdAt?: string
  amounts?: Amounts
  delivery?: 'standard' | 'express'
  payment?: 'cod' | 'transfer' | 'card'
}

type StatusKey = NonNullable<Order['status']> | 'all'

const STATUS_LABEL: Record<Exclude<StatusKey, 'all'>, string> = {
  pending: 'รอดำเนินการ',
  processing: 'กำลังจัดการ',
  shipped: 'จัดส่งแล้ว',
  paid: 'ชำระเงินแล้ว',
  completed: 'สำเร็จ',
  cancelled: 'ยกเลิก',
}

const STATUS_ORDER: Exclude<StatusKey, 'all'>[] = [
  'pending', 'processing', 'paid', 'shipped', 'completed', 'cancelled'
]

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<StatusKey>('all')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [shippingInputs, setShippingInputs] = useState<Record<string, string>>({})

  // -------- Fetch
  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' })
      const data = await res.json()
      const arr = Array.isArray(data) ? (data as Order[]) : []
      setOrders(arr)
      setShippingInputs(
        Object.fromEntries(arr.map(o => [o._id, o.shippingNumber || '']))
      )
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { fetchOrders() }, [])

  // -------- Derived
  const filtered = useMemo(() => {
    const kw = q.trim().toLowerCase()
    let list = orders
      .filter(o => status === 'all' ? true : (o.status || 'pending') === status)
      .filter(o => {
        if (!kw) return true
        return (
          o.name?.toLowerCase().includes(kw) ||
          o.phone?.toLowerCase().includes(kw) ||
          o.address?.toLowerCase().includes(kw) ||
          o.items?.some(it => it.name?.toLowerCase().includes(kw)) ||
          o._id?.toLowerCase().includes(kw)
        )
      })
    list = list.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime()
      const db = new Date(b.createdAt || 0).getTime()
      return sort === 'newest' ? db - da : da - db
    })
    return list
  }, [orders, q, status, sort])

  const countByStatus = useMemo(() => {
    const map = Object.fromEntries(STATUS_ORDER.map(s => [s, 0])) as Record<Exclude<StatusKey, 'all'>, number>
    for (const o of orders) {
      const k = (o.status || 'pending') as Exclude<StatusKey, 'all'>
      map[k] = (map[k] || 0) + 1
    }
    return map
  }, [orders])

  // -------- Helpers
  const fmt = (n: number | undefined) => `฿${(n ?? 0).toLocaleString()}`
  const orderTotal = (o: Order) =>
    o.amounts?.total ??
    o.items?.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0) +
      (o.amounts?.shipCost ?? 0) + (o.amounts?.codFee ?? 0)

  const shortId = (id?: string) => id ? `#${id.slice(-6)}` : '#—'

  // -------- Actions
  const updateStatus = async (id: string, newStatus: Exclude<StatusKey, 'all'>) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })
      if (!res.ok) throw new Error()
      await fetchOrders()
      Swal.fire({ icon: 'success', title: 'อัปเดตสถานะแล้ว', timer: 1000, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'อัปเดตสถานะไม่สำเร็จ' })
    }
  }

  const saveShipping = async (id: string, shippingNumber: string) => {
    if (!shippingNumber.trim()) return
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, shippingNumber }),
      })
      if (!res.ok) throw new Error()
      await fetchOrders()
      Swal.fire({ icon: 'success', title: 'บันทึกเลขขนส่งแล้ว', timer: 1000, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'บันทึกเลขขนส่งไม่สำเร็จ' })
    }
  }

  // -------- UI
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-orange-700">คำสั่งซื้อทั้งหมด</h1>
          <p className="text-sm text-slate-600">จัดการสถานะ อัปเดตเลขขนส่ง และค้นหาออเดอร์</p>
        </div>
        <button
          onClick={fetchOrders}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-orange-200 bg-white px-4 font-semibold text-orange-700 shadow-sm hover:bg-orange-50"
        >
          <RefreshCw className="h-4 w-4" /> รีเฟรช
        </button>
      </div>

      {/* Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        <StatCard label="ทั้งหมด" value={orders.length} tone="default" />
        <StatCard label={STATUS_LABEL.pending} value={countByStatus.pending} tone="muted" icon={<Clock className="h-4 w-4" />} />
        <StatCard label={STATUS_LABEL.processing} value={countByStatus.processing} tone="amber" icon={<Filter className="h-4 w-4" />} />
        <StatCard label={STATUS_LABEL.paid} value={countByStatus.paid} tone="amber" icon={<CreditCard className="h-4 w-4" />} />
        <StatCard label={STATUS_LABEL.shipped} value={countByStatus.shipped} tone="blue" icon={<Truck className="h-4 w-4" />} />
        <StatCard label={STATUS_LABEL.completed} value={countByStatus.completed} tone="green" icon={<CheckCircle2 className="h-4 w-4" />} />
      </div>

      {/* Toolbar */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ค้นหา: ชื่อ/เบอร์/ที่อยู่/สินค้า/รหัสออเดอร์"
            className="h-11 w-full rounded-xl border border-orange-200 bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusKey)}
              className="h-11 w-full appearance-none rounded-xl border border-orange-200 bg-white pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="all">สถานะทั้งหมด</option>
              {STATUS_ORDER.map(s => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <div className="relative w-36">
            <SortDesc className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as 'newest' | 'oldest')}
              className="h-11 w-full appearance-none rounded-xl border border-orange-200 bg-white pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="newest">ใหม่ → เก่า</option>
              <option value="oldest">เก่า → ใหม่</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <SkeletonList />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-orange-200 bg-white p-10 text-center text-slate-500">
          ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไข
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((o) => {
            const total = orderTotal(o)
            const created = o.createdAt ? new Date(o.createdAt) : null
            return (
              <div
                key={o._id}
                className="rounded-2xl border border-orange-200 bg-white p-5 shadow-sm hover:shadow-md transition"
              >
                {/* Header */}
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-700 border border-orange-200">
                      {shortId(o._id)}
                    </span>
                    <StatusBadge status={o.status || 'pending'} />
                    {o.payment && (
                      <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        ชำระ: {o.payment === 'transfer' ? 'โอน' : o.payment === 'cod' ? 'เก็บปลายทาง' : 'บัตร'}
                      </span>
                    )}
                    {o.delivery && (
                      <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        ส่ง: {o.delivery === 'express' ? 'ด่วนพิเศษ' : 'มาตรฐาน'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CalendarClock className="h-4 w-4" />
                    {created ? created.toLocaleString() : '-'}
                  </div>
                </div>

                {/* Body */}
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Customer */}
                  <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-3">
                    <div className="mb-1 flex items-center gap-2 font-semibold text-orange-700">
                      <User className="h-4 w-4" /> ผู้รับ
                    </div>
                    <div className="text-sm text-slate-800">{o.name}</div>
                    <div className="mt-1 flex items-start gap-2 text-sm text-slate-700">
                      <MapPin className="mt-0.5 h-4 w-4" />
                      <span>{o.address}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-700">
                      <Phone className="h-4 w-4" />
                      <span>{o.phone}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="rounded-xl border border-orange-100 bg-orange-50/30 p-3">
                    <div className="mb-1 flex items-center gap-2 font-semibold text-orange-700">
                      <Package className="h-4 w-4" /> รายการสินค้า
                    </div>
                    <ul className="divide-y text-sm">
                      {o.items?.map((it, i) => (
                        <li key={i} className="flex items-center justify-between py-1.5">
                          <span className="truncate">
                            {it.name}
                            <span className="text-gray-500 text-sm ml-2">
                              (x{it.qty || 1})
                            </span>
                          </span>
                          <span className="font-semibold text-slate-800">
                            {((it.price || 0) * (it.qty || 1)).toLocaleString()} บาท
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Totals & actions */}
                  <div className="rounded-xl border border-orange-100 bg-orange-50/30 p-3">
                    <div className="mb-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">ยอดสินค้า</span>
                        <span className="font-semibold">{fmt(o.amounts?.subtotal ?? o.items?.reduce((s, it)=>s+(it.price||0)*(it.qty||1),0))}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">ค่าจัดส่ง</span>
                        <span className="font-semibold">{o.amounts?.shipCost ? fmt(o.amounts.shipCost) : '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">ค่าธรรมเนียม COD</span>
                        <span className="font-semibold">{o.amounts?.codFee ? fmt(o.amounts.codFee) : '—'}</span>
                      </div>
                      <div className="my-2 h-px bg-orange-100" />
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700">รวมสุทธิ</span>
                        <span className="text-lg font-extrabold text-orange-700">{fmt(total)}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="mt-3 grid gap-2">
                      <label className="text-xs font-semibold text-slate-600">อัปเดตสถานะ</label>
                      <select
                        className="h-10 rounded-lg border border-orange-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                        value={o.status || 'pending'}
                        onChange={(e) => updateStatus(o._id, e.target.value as Exclude<StatusKey,'all'>)}
                      >
                        {STATUS_ORDER.map(s => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>

                      <label className="mt-2 text-xs font-semibold text-slate-600">เลขขนส่ง</label>
                      <div className="flex gap-2">
                        <input
                          className="h-10 flex-1 rounded-lg border border-orange-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-orange-300"
                          placeholder="กรอกเลขขนส่ง"
                          value={shippingInputs[o._id] ?? ''}
                          onChange={(e) => setShippingInputs(prev => ({ ...prev, [o._id]: e.target.value }))}
                        />
                        <button
                          onClick={() => saveShipping(o._id, shippingInputs[o._id] ?? '')}
                          className="h-10 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700"
                        >
                          บันทึก
                        </button>
                      </div>

                      {o.shippingNumber && (
                        <div className="mt-1 text-xs">
                          <span className="rounded-full bg-green-100 px-2 py-1 font-semibold text-green-700">
                            ล่าสุด: {o.shippingNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ---------------- UI bits ---------------- */
function StatusBadge({ status }: { status: Exclude<StatusKey, 'all'> }) {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border'
  switch (status) {
    case 'pending':
      return <span className={`${base} border-slate-200 bg-slate-50 text-slate-800`}><Clock className="h-3.5 w-3.5" /> {STATUS_LABEL.pending}</span>
    case 'processing':
      return <span className={`${base} border-amber-200 bg-amber-50 text-amber-800`}><Filter className="h-3.5 w-3.5" /> {STATUS_LABEL.processing}</span>
    case 'paid':
      return <span className={`${base} border-amber-200 bg-amber-50 text-amber-800`}><BadgeCheck className="h-3.5 w-3.5" /> {STATUS_LABEL.paid}</span>
    case 'shipped':
      return <span className={`${base} border-blue-200 bg-blue-50 text-blue-800`}><Truck className="h-3.5 w-3.5" /> {STATUS_LABEL.shipped}</span>
    case 'completed':
      return <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-800`}><CheckCircle2 className="h-3.5 w-3.5" /> {STATUS_LABEL.completed}</span>
    case 'cancelled':
    default:
      return <span className={`${base} border-red-200 bg-red-50 text-red-800`}><XCircle className="h-3.5 w-3.5" /> {STATUS_LABEL.cancelled}</span>
  }
}

function StatCard({
  label, value, icon, tone = 'default',
}: { label: string; value: number | string; icon?: React.ReactNode; tone?: 'default'|'muted'|'amber'|'blue'|'green' }) {
  const tones: Record<typeof tone, string> = {
    default: 'border-orange-200 bg-white text-orange-800',
    muted: 'border-slate-200 bg-white text-slate-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-800',
    blue: 'border-blue-200 bg-blue-50 text-blue-800',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  } as any
  return (
    <div className={`flex items-center justify-between rounded-xl border px-3 py-2 shadow-sm ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon} {label}
      </div>
      <div className="text-base font-extrabold">{value}</div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-orange-200 bg-white p-5">
          <div className="mb-3 h-4 w-40 rounded bg-slate-200" />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="h-24 rounded bg-slate-100" />
            <div className="h-24 rounded bg-slate-100" />
            <div className="h-24 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}