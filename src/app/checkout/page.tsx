'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../../components/Header'
import Swal from 'sweetalert2'
import {
  ShoppingBag, Truck, CreditCard, Wallet, MapPin, Phone, User, ArrowLeft, Loader2, Package, QrCode, CheckCircle2, XCircle, Upload
} from 'lucide-react'

/**
 * NOTE: ปรับให้กำหนดปลายทาง API ได้ผ่าน ENV
 * - ถ้าใช้ API แยกต่างหาก (เช่น http://192.168.1.110:3001) ให้ตั้งค่า NEXT_PUBLIC_API_BASE
 * - ถ้าใช้ Next.js API route เดียวกัน ให้ปล่อยว่าง (default = same-origin)
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, '') || '' // e.g. "http://192.168.1.110:3001"

/** Types */
type CartItem = {
  _id: string
  name: string
  price: number
  image?: string
  images?: string[]
  description?: string
  qty: number
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
  const [payment, setPayment] = useState<'cod' | 'transfer'>('transfer')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Slip & Verification
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [slipPreview, setSlipPreview] = useState<string>('')
  const [slipHash, setSlipHash] = useState<string>('')
  const [transferAmountInput, setTransferAmountInput] = useState<string>('')
  const [amountVerified, setAmountVerified] = useState<boolean | null>(null)

  const router = useRouter()

  // shipping prices
  const STANDARD_SHIP = 45
  const EXPRESS_SHIP = 80

  // Load cart + prefill from profile
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart')
      const cartItems = raw ? JSON.parse(raw) : []
      const itemsWithQty = Array.isArray(cartItems)
        ? cartItems.map((item: any) => ({ ...item, qty: Math.max(1, Number(item.qty) || 1) }))
        : []
      setCart(itemsWithQty)
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
  const subtotal = useMemo(() => cart.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0), [cart])
  const shipCost = delivery === 'express' ? EXPRESS_SHIP : STANDARD_SHIP
  const codFee = payment === 'cod' ? 20 : 0
  const total = subtotal + shipCost + codFee

  // PromptPay QR: amount as 2 decimals
  const promptPayNumber = '0647472359'
  const expectedAmountStr = useMemo(() => Math.max(0, total).toFixed(2), [total])
  const promptPayQRUrl = useMemo(
    () => `https://promptpay.io/${promptPayNumber}/${expectedAmountStr}.png`,
    [expectedAmountStr]
  )

  // Compare paid vs expected (tolerance 0.01)
  const diff = useMemo(() => {
    const paid = Number(parseFloat((transferAmountInput || expectedAmountStr) as string).toFixed(2))
    const expect = Number(parseFloat(expectedAmountStr).toFixed(2))
    return Number((paid - expect).toFixed(2))
  }, [transferAmountInput, expectedAmountStr])

  // Reset when changing method
  useEffect(() => {
    if (payment !== 'transfer') {
      setSlipFile(null)
      setSlipPreview('')
      setSlipHash('')
      setTransferAmountInput('')
      setAmountVerified(null)
    }
  }, [payment])

  // Auto verify when have slip & amount matches
  useEffect(() => {
    if (payment === 'transfer') {
      const ok = !!slipFile && Math.abs(diff) <= 0.01
      setAmountVerified(ok ? true : null)
    }
  }, [payment, slipFile, diff])

  const baseDisabled = !name.trim() || !address.trim() || !phoneValid || cart.length === 0 || loading
  const transferBlocked = payment === 'transfer' && (!slipFile || !(amountVerified === true || Math.abs(diff) <= 0.01))
  const primaryBtnDisabled = baseDisabled || transferBlocked

  async function fileSHA256(file: File): Promise<string> {
    const buf = await file.arrayBuffer()
    const hash = await crypto.subtle.digest('SHA-256', buf)
    const bytes = Array.from(new Uint8Array(hash))
    return bytes.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async function onSlipChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    setSlipFile(f || null)
    setAmountVerified(null)
    setTransferAmountInput(expectedAmountStr) // prefill expected
    if (f) {
      if (slipPreview) URL.revokeObjectURL(slipPreview)
      const url = URL.createObjectURL(f)
      setSlipPreview(url)
      setSlipHash(await fileSHA256(f))
    } else {
      setSlipPreview('')
      setSlipHash('')
    }
  }

  function verifyAmountLocally() {
    const ok = Math.abs(diff) <= 0.01
    setAmountVerified(ok)
    Swal.fire({
      icon: ok ? 'success' : 'error',
      title: ok ? 'ยอดถูกต้อง' : 'ยอดไม่ตรง',
      text: ok ? 'จำนวนเงินตรงกับยอดที่ต้องชำระ' : `ส่วนต่าง ${diff.toFixed(2)} บาท`,
    })
  }

  /**
   * POST helper — รองรับทั้ง same-origin และ cross-origin API
   */
  async function postOrder(body: FormData | object, isMultipart: boolean) {
    const url = `${API_BASE}/api/orders`
    const opts: RequestInit = isMultipart
      ? { method: 'POST', body: body as FormData, mode: API_BASE ? 'cors' : 'same-origin' }
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          mode: API_BASE ? 'cors' : 'same-origin',
        }

    const res = await fetch(url, opts)
    const contentType = res.headers.get('content-type') || ''
    const data = contentType.includes('application/json') ? await res.json().catch(() => ({})) : await res.text()

    if (!res.ok) {
      const msg = typeof data === 'string' ? data : data?.message || data?.error || 'Server error'
      throw new Error(`HTTP ${res.status} ${res.statusText} - ${msg}`)
    }
    return data
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ name: true, address: true, phone: true })
    if (primaryBtnDisabled) {
      return Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
    }
    setLoading(true)
    try {
      if (payment === 'transfer') {
        const form = new FormData()
        form.append('order', JSON.stringify({
          name,
          address,
          phone,
          note,
          delivery,
          payment,
          items: cart,
          amounts: { subtotal, shipCost, codFee, total },
          promptpay: { number: promptPayNumber, url: promptPayQRUrl, amount: expectedAmountStr },
          transfer: { declaredAmount: Number(parseFloat((transferAmountInput || expectedAmountStr) as string).toFixed(2)), slipHash }
        }))
        if (slipFile) form.append('slip', slipFile)

        await postOrder(form, true)
      } else {
        await postOrder({
          name,
          address,
          phone,
          note,
          delivery,
          payment,
          items: cart,
          amounts: { subtotal, shipCost, codFee, total },
        }, false)
      }

      localStorage.removeItem('cart')
      Swal.fire({ icon: 'success', title: 'สั่งซื้อสำเร็จ', timer: 1400, showConfirmButton: false })
      setTimeout(() => router.push('/orders'), 1400)
    } catch (err: any) {
      console.error('Order submission error:', err)
      Swal.fire({ icon: 'error', title: 'สั่งซื้อไม่สำเร็จ', text: err?.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (500)' })
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
                  label="มาตรฐาน"
                  desc="จัดส่ง 2–4 วันทำการ"
                  selected={delivery === 'standard'}
                  onClick={() => setDelivery('standard')}
                  badge={`฿${STANDARD_SHIP.toLocaleString()}`}
                  icon={<Package className="w-4 h-4" />}
                />
                <RadioCard
                  label="ด่วนพิเศษ"
                  desc="จัดส่ง 1–2 วันทำการ"
                  selected={delivery === 'express'}
                  onClick={() => setDelivery('express')}
                  badge={`฿${EXPRESS_SHIP.toLocaleString()}`}
                  icon={<Truck className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Payment */}
            <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-orange-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> วิธีชำระเงิน
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
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
              </div>

              {/* PromptPay QR */}
              {payment === 'transfer' && (
                <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/50 p-4 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-orange-900 font-semibold mb-2">
                      <QrCode className="w-4 h-4" /> สแกนจ่ายด้วย PromptPay
                    </div>
                    <div className="text-sm text-gray-700 mb-3">
                      ยอดชำระ <span className="font-semibold">฿{Number(expectedAmountStr).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={promptPayQRUrl}
                        alt={`PromptPay QR สำหรับยอด ${expectedAmountStr} บาท`}
                        className="w-56 h-56 rounded-xl border bg-white object-contain"
                      />
                    </div>
                  </div>

                  {/* Upload & Verify */}
                  <div className="rounded-xl border border-orange-200 bg-white p-3">
                    <div className="flex items-center gap-2 font-semibold text-gray-800 mb-2"><Upload className="w-4 h-4"/> อัปโหลดสลิปการโอน</div>
                    <input type="file" accept="image/*,application/pdf" onChange={onSlipChange} className="block w-full text-sm" />

                    {(slipPreview || slipHash) && (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
                        <div className="sm:col-span-2">
                          {slipPreview && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={slipPreview} alt="สลิปตัวอย่าง" className="w-full max-h-56 object-contain rounded border" />
                          )}
                        </div>
                        <div className="text-xs text-gray-600 break-words">
                          <div className="font-semibold text-gray-800 mb-1">รหัสไฟล์ (SHA-256)</div>
                          <div className="font-mono">{slipHash ? `${slipHash.slice(0, 24)}…${slipHash.slice(-8)}` : '-'}</div>
                        </div>
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-gray-700 mb-1">จำนวนเงินที่โอน (บาท)</label>
                        <input
                          value={transferAmountInput}
                          onChange={(e) => { setTransferAmountInput(e.target.value); setAmountVerified(null) }}
                          placeholder={expectedAmountStr}
                          inputMode="decimal"
                          className="w-full h-10 px-3 rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-300 outline-none text-sm"
                        />
                        <div className="mt-1 text-xs text-gray-500">ยอดที่ต้องชำระ: ฿{Number(expectedAmountStr).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </div>
                      <button type="button" onClick={verifyAmountLocally} className="h-10 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold">
                        ตรวจสอบยอด
                      </button>
                    </div>

                    {amountVerified !== null && (
                      <div className={'mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ' + (amountVerified ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200')}>
                        {amountVerified ? <CheckCircle2 className="w-4 h-4"/> : <XCircle className="w-4 h-4"/>}
                        {amountVerified ? 'จำนวนเงินตรงกับยอดที่ต้องชำระ' : `ยอดไม่ตรง (ต่าง ${Math.abs(diff).toFixed(2)} บาท)`}
                      </div>
                    )}

                    <p className="mt-3 text-[11px] text-gray-500">
                      หมายเหตุ: ระบบนี้ตรวจสอบยอดจากจำนวนเงินที่คุณกรอกและไฟล์สลิปเท่านั้น หากต้องการตรวจสอบอัตโนมัติโดย OCR/เว็บฮุคจากธนาคาร ให้เชื่อมต่อฝั่งเซิร์ฟเวอร์เพิ่มเติม
                    </p>
                  </div>
                </div>
              )}
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
                            <div className="text-xs text-gray-500">จำนวน {item.qty || 1} ชิ้น</div>
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
                  <Row label="ค่าจัดส่ง" value={`฿${shipCost.toLocaleString()}`} />
                  <Row label="ค่าธรรมเนียม COD" value={codFee > 0 ? `฿${codFee.toLocaleString()}` : '-'} />
                  <div className="h-px bg-orange-100 my-2" />
                  <Row
                    label="ยอดชำระทั้งหมด"
                    value={`฿${(subtotal + shipCost + codFee).toLocaleString()}`}
                    bold
                    valueClass="text-orange-700"
                  />
                </div>

                {/* QR (mobile emphasize) */}
                {payment === 'transfer' && (
                  <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/50 p-3">
                    <div className="flex items-center gap-2 text-orange-900 font-semibold mb-2">
                      <QrCode className="w-4 h-4" /> QR ชำระเงิน (PromptPay)
                    </div>
                    <div className="flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={promptPayQRUrl}
                        alt={`PromptPay QR สำหรับยอด ${expectedAmountStr} บาท`}
                        className="w-48 h-48 rounded-xl border bg-white object-contain"
                      />
                    </div>
                  </div>
                )}

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

        {/* ---------- Server-side sample (comment) ---------- */}
        {`
        // ถ้าใช้เซิร์ฟเวอร์แยก (พอร์ต 3001) ให้ตั้งค่า env:
        // NEXT_PUBLIC_API_BASE=http://192.168.1.110:3001
        // แล้วรีสตาร์ท dev server

        // ตัวอย่าง Express + formidable (TypeScript):
        // import express from 'express'
        // import formidable from 'formidable'
        // import cors from 'cors'
        // const app = express()
        // app.use(cors({ origin: true, credentials: true })) // เปิด CORS ถ้าเรียกข้ามโดเมน/พอร์ต
        // app.post('/api/orders', (req, res) => {
        //   const form = formidable({ multiples: false })
        //   form.parse(req, (err, fields, files) => {
        //     if (err) return res.status(400).json({ error: 'parse_error' })
        //     try {
        //       const order = JSON.parse(String(fields.order || '{}'))
        //       const declared = Number(order?.transfer?.declaredAmount || 0)
        //       const expected = Number(order?.amounts?.subtotal + order?.amounts?.shipCost + order?.amounts?.codFee)
        //       const match = Math.abs(Number(declared.toFixed(2)) - Number(expected.toFixed(2))) <= 0.01
        //       // TODO: เก็บไฟล์ files.slip, บันทึก DB, ตรวจสอบเพิ่ม
        //       return res.status(200).json({ ok: true, match })
        //     } catch (e) {
        //       return res.status(500).json({ error: 'server_error', message: (e as Error).message })
        //     }
        //   })
        // })
        // app.listen(3001)
        `}
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
