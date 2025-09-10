'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../../components/Header'
import { CartManager } from '@/lib/cart-utils'
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
  seller?: string
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

  // Update document title
  useEffect(() => {
    document.title = 'ชำระเงิน | TH-THAI SHOP'
  }, [])
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
      // Use CartManager to read the canonical cart (uses 'cart_v2')
      const items = CartManager.getCart()
      const itemsWithQty = Array.isArray(items)
        ? items.map((it: any) => ({
            _id: it._id,
            name: it.name,
            price: it.price,
            image: it.image,
            images: it.images,
            description: it.description,
            qty: Math.max(1, Number(it.quantity) || 1),
            // preserve seller metadata captured by CartManager
            seller: it.seller || it.sellerUsername || it.username || undefined,
          }))
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
  
  // Calculate number of separate orders (by seller)
  const sellerCount = useMemo(() => {
    const sellers = new Set(cart.map(item => (item as any).seller).filter(Boolean))
    const hasNoSellerItems = cart.some(item => !(item as any).seller)
    return sellers.size + (hasNoSellerItems ? 1 : 0)
  }, [cart])
  
  const shipCost = delivery === 'express' ? EXPRESS_SHIP : STANDARD_SHIP
  const totalShipCost = shipCost * Math.max(1, sellerCount) // shipping per order/seller
  const codFee = payment === 'cod' ? 20 : 0
  const total = subtotal + totalShipCost + codFee

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
      // normalize cart items to include productId and seller when available
      const itemsToSend = cart.map(it => ({
        _id: it._id,
        name: it.name,
        price: it.price,
        image: it.image || (it.images && it.images[0]) || '',
        qty: it.qty || 1,
        // preserve any existing productId/seller fields if present
        productId: (it as any).productId || (it as any)._id || undefined,
        seller: (it as any).seller || (it as any).username || undefined,
      }))

      // Group items by seller to create separate orders per shop
      const itemsBySeller: Record<string, typeof itemsToSend> = {}
      const noSellerItems: typeof itemsToSend = []
      
      for (const item of itemsToSend) {
        const seller = (item as any).seller
        if (seller) {
          if (!itemsBySeller[seller]) itemsBySeller[seller] = []
          itemsBySeller[seller].push(item)
        } else {
          noSellerItems.push(item)
        }
      }

      // Collect unique seller usernames and fetch shop info
      const sellerUsernames = Array.from(new Set(itemsToSend.map(i => (i as any).seller).filter(Boolean)))
      const sellersMap: Record<string, any> = {}
      if (sellerUsernames.length) {
        // fetch seller info in parallel; tolerate failures
        const sellerFetches = await Promise.all(
          sellerUsernames.map(async (username) => {
            try {
              const url = `${API_BASE}/api/seller-info?username=${encodeURIComponent(username as string)}`
              const res = await fetch(url, { method: 'GET', mode: API_BASE ? 'cors' : 'same-origin' })
              if (!res.ok) return null
              const data = await res.json().catch(() => null)
              return { username, data }
            } catch (e) {
              return null
            }
          })
        )
        for (const s of sellerFetches) {
          if (s && s.username && s.data) sellersMap[s.username] = s.data
        }
      }

      // Create separate orders for each seller + one for items without seller
      const ordersToCreate = []
      
      // Orders for each seller
      for (const [seller, sellerItems] of Object.entries(itemsBySeller)) {
        const sellerSubtotal = sellerItems.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0)
        const sellerTotal = sellerSubtotal + shipCost + (payment === 'cod' ? codFee : 0)
        
        ordersToCreate.push({
          seller,
          items: sellerItems,
          amounts: { 
            subtotal: sellerSubtotal, 
            shipCost, 
            codFee: payment === 'cod' ? codFee : 0, 
            total: sellerTotal 
          },
          sellers: sellersMap[seller] ? { [seller]: sellersMap[seller] } : undefined
        })
      }
      
      // Order for items without seller (if any)
      if (noSellerItems.length > 0) {
        const noSellerSubtotal = noSellerItems.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0)
        const noSellerTotal = noSellerSubtotal + shipCost + (payment === 'cod' ? codFee : 0)
        
        ordersToCreate.push({
          seller: null,
          items: noSellerItems,
          amounts: { 
            subtotal: noSellerSubtotal, 
            shipCost, 
            codFee: payment === 'cod' ? codFee : 0, 
            total: noSellerTotal 
          },
          sellers: undefined
        })
      }

      // Submit each order separately
      const orderResults = []
      for (let i = 0; i < ordersToCreate.length; i++) {
        const orderData = ordersToCreate[i]
        
        if (payment === 'transfer') {
          const form = new FormData()
          form.append('order', JSON.stringify({
            name,
            address,
            phone,
            note,
            delivery,
            payment,
            items: orderData.items,
            amounts: orderData.amounts,
            sellers: orderData.sellers,
            promptpay: { number: promptPayNumber, url: promptPayQRUrl, amount: orderData.amounts.total.toFixed(2) },
            transfer: { declaredAmount: Number(parseFloat((transferAmountInput || orderData.amounts.total.toFixed(2)) as string).toFixed(2)), slipHash }
          }))
          // Only attach slip to first order to avoid duplication
          if (slipFile && i === 0) form.append('slip', slipFile)
          if (orderData.sellers) form.append('sellers', JSON.stringify(orderData.sellers))

          // dev-only debug: preview payload being sent
          if (process.env.NODE_ENV !== 'production') {
            try {
              console.debug(`[checkout] sending multipart order ${i + 1}/${ordersToCreate.length} (seller: ${orderData.seller || 'none'}):`, {
                order: JSON.parse(String(form.get('order'))),
                sellers: form.get('sellers') ? JSON.parse(String(form.get('sellers'))) : undefined,
                slipAttached: !!form.get('slip')
              })
            } catch (e) {}
          }

          const result = await postOrder(form, true)
          orderResults.push(result)
        } else {
          const jsonPayload = {
            name,
            address,
            phone,
            note,
            delivery,
            payment,
            items: orderData.items,
            amounts: orderData.amounts,
            sellers: orderData.sellers
          }

          if (process.env.NODE_ENV !== 'production') {
            try {
              console.debug(`[checkout] sending json order ${i + 1}/${ordersToCreate.length} (seller: ${orderData.seller || 'none'}):`, { 
                ...jsonPayload, 
                items: (jsonPayload.items || []).slice(0,5) 
              })
            } catch (e) {}
          }

          const result = await postOrder(jsonPayload, false)
          orderResults.push(result)
        }
      }

  // clear canonical cart storage
  CartManager.clear()
      
      const orderCount = orderResults.length
      const successMessage = orderCount > 1 
        ? `สั่งซื้อสำเร็จ (แยก ${orderCount} คำสั่งตามร้าน)` 
        : 'สั่งซื้อสำเร็จ'
      
      Swal.fire({ 
        icon: 'success', 
        title: successMessage, 
        text: orderCount > 1 ? 'คำสั่งซื้อถูกแยกตามร้านค้าแล้ว' : undefined,
        timer: 2000, 
        showConfirmButton: false 
      })
      setTimeout(() => router.push('/orders'), 2000)
    } catch (err: any) {
      console.error('Order submission error:', err)
      Swal.fire({ icon: 'error', title: 'สั่งซื้อไม่สำเร็จ', text: err?.message || 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (500)' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-slate-50">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-10 md:py-12">
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
            <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-orange-50 border border-transparent">
              <h2 className="text-lg md:text-xl font-semibold text-orange-900 mb-4 flex items-center gap-3">
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
            <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-orange-50 border border-transparent">
              <h2 className="text-lg md:text-xl font-semibold text-orange-900 mb-4 flex items-center gap-3">
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
            <div className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-orange-50 border border-transparent">
              <h2 className="text-lg md:text-xl font-semibold text-orange-900 mb-4 flex items-center gap-3">
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
                <div className="mt-4 rounded-xl bg-orange-50/60 p-4 space-y-4 ring-1 ring-orange-100">
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
                          className="w-full h-11 px-4 rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-300 outline-none text-sm bg-white"
                        />
                        <div className="mt-1 text-xs text-gray-500">ยอดที่ต้องชำระ: <span className="font-semibold">฿{Number(expectedAmountStr).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                      </div>
                      <button type="button" onClick={verifyAmountLocally} className="h-11 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold px-4 shadow-sm transition">
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
              <div className="rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-orange-50 border border-transparent">
                <h2 className="text-lg md:text-xl font-semibold text-orange-900 mb-3 flex items-center gap-3">
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
                  {sellerCount > 1 ? (
                    <Row 
                      label={`ค่าจัดส่ง (${sellerCount} คำสั่ง)`} 
                      value={`฿${shipCost.toLocaleString()} × ${sellerCount} = ฿${totalShipCost.toLocaleString()}`} 
                    />
                  ) : (
                    <Row label="ค่าจัดส่ง" value={`฿${totalShipCost.toLocaleString()}`} />
                  )}
                  <Row label="ค่าธรรมเนียม COD" value={codFee > 0 ? `฿${codFee.toLocaleString()}` : '-'} />
                  {sellerCount > 1 && (
                    <div className="text-xs text-orange-600 italic">
                      * จะแยกเป็น {sellerCount} คำสั่งซื้อตามร้านค้า
                    </div>
                  )}
                  <div className="h-px bg-orange-100 my-2" />
                  <Row
                    label="ยอดชำระทั้งหมด"
                    value={`฿${total.toLocaleString()}`}
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
                    'mt-4 w-full h-12 rounded-xl text-white font-semibold shadow-lg inline-flex items-center justify-center gap-2 transition ' +
                    (primaryBtnDisabled
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600')
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
        <div className="md:hidden fixed bottom-4 inset-x-4 z-40 bg-white/95 backdrop-blur border border-orange-100 p-3 rounded-xl shadow-lg">
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
                'flex-1 h-12 rounded-full text-white font-semibold shadow-lg transition ' +
                (primaryBtnDisabled ? 'bg-gray-300' : 'bg-gradient-to-r from-orange-600 to-amber-500')
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
    <div className="flex items-center justify-between py-0.5">
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
          'flex items-center gap-2 h-12 px-4 rounded-xl bg-white transition-shadow ' +
          (error ? 'ring-1 ring-red-200 border border-red-100 shadow-sm' : 'ring-1 ring-transparent border border-orange-100 shadow-sm focus-within:ring-orange-200')
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
          'flex items-start gap-3 min-h-[52px] px-4 py-3 rounded-xl bg-white shadow-sm transition ' +
          (error ? 'ring-1 ring-red-200 border border-red-100' : 'ring-1 ring-transparent border border-orange-100 focus-within:ring-orange-200')
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
        'w-full text-left rounded-xl p-3 transition-transform transform hover:-translate-y-0.5 ' +
        (selected ? 'bg-gradient-to-r from-orange-50 to-white border border-orange-200 shadow-sm ring-1 ring-orange-100' : 'bg-white border border-orange-100')
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
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
