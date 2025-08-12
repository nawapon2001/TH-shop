'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../../components/Header'
import Swal from 'sweetalert2'
import {
  ShoppingBag, Truck, CreditCard, Wallet, MapPin, Phone, User, ArrowLeft, Loader2, Package
} from 'lucide-react'

type CartItem = {
  _id: string
  name: string
  price: number
  image?: string
  images?: string[]
  description?: string
}

type ProfileStorage = {
  name?: string
  phone?: string
  email?: string
  addressLine1?: string
  addressLine2?: string
  subdistrict?: string
  district?: string
  province?: string
  postalCode?: string
  country?: string
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [note, setNote] = useState('')
  const [delivery, setDelivery] = useState<'standard' | 'express'>('standard')
  const [payment, setPayment] = useState<'cod' | 'transfer' | 'card'>('transfer')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const router = useRouter()

  // Load cart + prefill from profile
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart')
      setCart(raw ? JSON.parse(raw) : [])
    } catch { setCart([]) }

    try {
      const pRaw = localStorage.getItem('userProfile')
      if (pRaw) {
        const p: ProfileStorage = JSON.parse(pRaw)
        const addr = [
          p.addressLine1,
          p.addressLine2,
          p.subdistrict ? `ต.${p.subdistrict}` : '',
          p.district ? `อ.${p.district}` : '',
          p.province ? `จ.${p.province}` : '',
          p.postalCode,
          p.country,
        ]
          .filter(Boolean)
          .join(', ')
          .replace(/\s+,/g, ',')
        if (p.name) setName(p.name)
        if (p.phone) setPhone(p.phone)
        if (addr.trim()) setAddress(addr)
      }
    } catch {}
  }, [])

  // Helpers
  const phoneValid = useMemo(() => /^0\d{9}$/.test(phone.trim()), [phone])
  const subtotal = useMemo(() => cart.reduce((s, i) => s + (i.price || 0), 0), [cart])
  const shipCost = delivery === 'express' ? 50 : 0
  const codFee = payment === 'cod' ? 20 : 0
  const total = subtotal + shipCost + codFee

  const primaryBtnDisabled =
    !name.trim() || !address.trim() || !phoneValid || cart.length === 0 || loading

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ name: true, address: true, phone: true })
    if (primaryBtnDisabled) {
      return Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
    }
    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          address,
          phone,
          note,
          delivery,
          payment,
          items: cart,
          amounts: { subtotal, shipCost, codFee, total },
        }),
      })
      if (res.ok) {
        localStorage.removeItem('cart')
        Swal.fire({ icon: 'success', title: 'สั่งซื้อสำเร็จ', timer: 1400, showConfirmButton: false })
        setTimeout(() => router.push('/orders'), 1400)
      } else {
        Swal.fire({ icon: 'error', title: 'สั่งซื้อไม่สำเร็จ' })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-orange-700 hover:text-orange-900"
          >
            <ArrowLeft className="w-4 h-4" /> กลับ
          </button>
          <h1 className="text-xl md:text-2xl font-extrabold text-orange-800">ชำระเงิน / Checkout</h1>
          <div className="w-14" />
        </div>

        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Form */}
          <section className="md:col-span-7 space-y-6">
            {/* Recipient */}
            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> ข้อมูลผู้รับ
              </h2>
              <div className="grid gap-3">
                <Field
                  label="ชื่อ-นามสกุล"
                  value={name}
                  onChange={setName}
                  placeholder="เช่น สมชาย ใจดี"
                  icon={<User className="w-4 h-4 text-orange-700" />}
                  error={touched.name && !name.trim() ? 'กรุณากรอกชื่อ-นามสกุล' : ''}
                  onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                />
                <Field
                  label="เบอร์โทร"
                  value={phone}
                  onChange={setPhone}
                  placeholder="0XXXXXXXXX"
                  icon={<Phone className="w-4 h-4 text-orange-700" />}
                  inputMode="tel"
                  error={touched.phone && !phoneValid ? 'รูปแบบเบอร์ไม่ถูกต้อง (ต้องเป็น 10 หลัก)' : ''}
                  onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
                />
                <Textarea
                  label="ที่อยู่จัดส่ง"
                  value={address}
                  onChange={setAddress}
                  placeholder="บ้านเลขที่ / อาคาร / ถนน / แขวง/ตำบล / เขต/อำเภอ / จังหวัด / รหัสไปรษณีย์"
                  icon={<MapPin className="w-4 h-4 text-orange-700" />}
                  error={touched.address && !address.trim() ? 'กรุณากรอกที่อยู่ให้ครบถ้วน' : ''}
                  onBlur={() => setTouched((t) => ({ ...t, address: true }))}
                />
                <Textarea
                  label="หมายเหตุถึงคนส่งของ (ไม่บังคับ)"
                  value={note}
                  onChange={setNote}
                  placeholder="เช่น โทรก่อนถึง ฝากไว้ที่ รปภ."
                />
              </div>
            </div>

            {/* Delivery */}
            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" /> วิธีจัดส่ง
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <RadioCard
                  label="มาตรฐาน (ฟรี)"
                  desc="จัดส่ง 2–4 วันทำการ"
                  selected={delivery === 'standard'}
                  onClick={() => setDelivery('standard')}
                  badge="฿0"
                  icon={<Package className="w-4 h-4" />}
                />
                <RadioCard
                  label="ด่วนพิเศษ"
                  desc="จัดส่ง 1–2 วันทำการ"
                  selected={delivery === 'express'}
                  onClick={() => setDelivery('express')}
                  badge="+฿50"
                  icon={<Truck className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> วิธีชำระเงิน
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                <RadioCard
                  label="โอนเต็มจำนวน"
                  desc="โอนผ่านแอปธนาคาร"
                  selected={payment === 'transfer'}
                  onClick={() => setPayment('transfer')}
                  icon={<Wallet className="w-4 h-4" />}
                />
                <RadioCard
                  label="เก็บเงินปลายทาง (COD)"
                  desc="มีค่าธรรมเนียม +฿20"
                  selected={payment === 'cod'}
                  onClick={() => setPayment('cod')}
                  icon={<Package className="w-4 h-4" />}
                />
                <RadioCard
                  label="บัตรเครดิต/เดบิต"
                  desc="เดโม (ยังไม่เปิดใช้)"
                  selected={payment === 'card'}
                  onClick={() => setPayment('card')}
                  icon={<CreditCard className="w-4 h-4" />}
                />
              </div>
            </div>
          </section>

          {/* Right: Summary */}
          <aside className="md:col-span-5">
            <div className="md:sticky md:top-6 space-y-4">
              <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" /> สรุปคำสั่งซื้อ
                </h2>

                {/* Items */}
                <ul className="divide-y">
                  {cart.length === 0 ? (
                    <li className="py-4 text-gray-500">ไม่มีสินค้าในตะกร้า</li>
                  ) : (
                    cart.map((item) => {
                      const img = item.images?.[0] || item.image || 'https://via.placeholder.com/80x80?text=No+Image'
                      return (
                        <li key={item._id} className="py-3 flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt={item.name} className="w-14 h-14 rounded border object-cover" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 line-clamp-1">{item.name}</div>
                            <div className="text-xs text-gray-500">จำนวน 1 ชิ้น</div>
                          </div>
                          <div className="text-sm font-semibold text-gray-800">{item.price.toLocaleString()} ฿</div>
                        </li>
                      )
                    })
                  )}
                </ul>

                {/* Totals */}
                <div className="mt-4 space-y-1 text-sm">
                  <Row label="ยอดสินค้า" value={`฿${subtotal.toLocaleString()}`} />
                  <Row label="ค่าจัดส่ง" value={shipCost === 0 ? 'ฟรี' : `฿${shipCost.toLocaleString()}`} />
                  <Row label="ค่าธรรมเนียม COD" value={codFee > 0 ? `฿${codFee.toLocaleString()}` : '-'} />
                  <div className="h-px bg-orange-100 my-2" />
                  <Row
                    label="ยอดชำระทั้งหมด"
                    value={`฿${total.toLocaleString()}`}
                    bold
                    valueClass="text-orange-700"
                  />
                </div>

                <button
                  type="submit"
                  disabled={primaryBtnDisabled}
                  className={
                    'mt-4 w-full h-12 rounded-xl text-white font-semibold shadow inline-flex items-center justify-center gap-2 ' +
                    (primaryBtnDisabled
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700')
                  }
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  ยืนยันสั่งซื้อ
                </button>

                <a
                  href="/cart"
                  className="mt-2 block text-center text-sm text-orange-700 hover:underline"
                >
                  แก้ไขตะกร้า
                </a>
              </div>
            </div>
          </aside>
        </form>
      </div>

      {/* Mobile bottom CTA */}
      {cart.length > 0 && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-orange-100 p-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-gray-500">ยอดชำระ</div>
              <div className="text-lg font-extrabold text-orange-700">฿{total.toLocaleString()}</div>
            </div>
            <button
              onClick={(e) => {
                // trigger form submit
                const form = document.querySelector('form') as HTMLFormElement | null
                if (form) form.requestSubmit()
              }}
              disabled={primaryBtnDisabled}
              className={
                'flex-1 h-12 rounded-full text-white font-semibold shadow ' +
                (primaryBtnDisabled ? 'bg-gray-300' : 'bg-orange-600')
              }
            >
              ชำระเงิน
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- UI Bits ---------- */
function Row({ label, value, bold, valueClass }: { label: string; value: string; bold?: boolean; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className={'text-gray-600 ' + (bold ? 'font-semibold' : '')}>{label}</span>
      <span className={(bold ? 'font-extrabold ' : 'font-semibold ') + (valueClass || '')}>{value}</span>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  icon,
  error,
  onBlur,
  inputMode,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  icon?: React.ReactNode
  error?: string
  onBlur?: () => void
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-800">{label}</label>
      <div
        className={
          'flex items-center gap-2 h-11 px-3 rounded-xl border bg-white shadow-sm focus-within:ring-2 ' +
          (error ? 'border-red-300 bg-red-50/40 focus-within:ring-red-200' : 'border-orange-200 focus-within:ring-orange-300')
        }
      >
        {icon}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          inputMode={inputMode}
          className="flex-1 bg-transparent outline-none text-sm"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  icon,
  error,
  onBlur,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  icon?: React.ReactNode
  error?: string
  onBlur?: () => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-800">{label}</label>
      <div
        className={
          'flex items-start gap-2 min-h-[44px] px-3 py-2 rounded-xl border bg-white shadow-sm focus-within:ring-2 ' +
          (error ? 'border-red-300 bg-red-50/40 focus-within:ring-red-200' : 'border-orange-200 focus-within:ring-orange-300')
        }
      >
        <div className="pt-1">{icon}</div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={3}
          className="flex-1 bg-transparent outline-none text-sm resize-y"
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function RadioCard({
  label,
  desc,
  selected,
  onClick,
  badge,
  icon,
}: {
  label: string
  desc?: string
  selected: boolean
  onClick: () => void
  badge?: string
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'w-full text-left rounded-xl border p-3 hover:bg-orange-50 transition ' +
        (selected ? 'border-orange-500 bg-orange-50/70' : 'border-orange-200 bg-white')
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 text-orange-800">{icon}</div>
          <div>
            <div className="font-semibold text-gray-900">{label}</div>
            {desc && <div className="text-xs text-gray-600 mt-0.5">{desc}</div>}
          </div>
        </div>
        {badge && (
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white border border-orange-200 text-orange-700">
            {badge}
          </span>
        )}
      </div>
    </button>
  )
}
