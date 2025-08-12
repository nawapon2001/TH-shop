'use client'
import React, { useEffect, useMemo, useState } from 'react'
import Header from '../../components/Header'
import { Trash2, ShoppingBag, CreditCard, Plus, Minus, ChevronLeft } from 'lucide-react'

type Product = {
  _id: string
  name: string
  price: number
  image?: string
  description?: string
}

type CartItem = Product & { qty: number }

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([])

  // โหลดตะกร้า (อัปเกรดให้มี qty ถ้าเดิมยังไม่มี)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart')
      const arr: any[] = raw ? JSON.parse(raw) : []
      const withQty: CartItem[] = Array.isArray(arr)
        ? arr.map((p) => ({ ...p, qty: Math.max(1, Number((p as any).qty) || 1) }))
        : []
      setCart(withQty)
    } catch {
      setCart([])
    }
  }, [])

  const saveCart = (items: CartItem[]) => {
    setCart(items)
    localStorage.setItem('cart', JSON.stringify(items))
  }

  const inc = (id: string) =>
    saveCart(cart.map((it) => (it._id === id ? { ...it, qty: it.qty + 1 } : it)))

  const dec = (id: string) =>
    saveCart(
      cart
        .map((it) => (it._id === id ? { ...it, qty: Math.max(1, it.qty - 1) } : it))
        .filter(Boolean) as CartItem[]
    )

  const removeFromCart = (id: string) => saveCart(cart.filter((p) => p._id !== id))

  const fmtTHB = (n: number) =>
    n.toLocaleString('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 })

  const subTotal = useMemo(() => cart.reduce((s, p) => s + p.price * p.qty, 0), [cart])
  const shipping = subTotal === 0 ? 0 : subTotal >= 999 ? 0 : 40
  const total = subTotal + shipping

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Back + Title */}
        <div className="flex items-center gap-3 mb-6">
          <a href="/" className="inline-flex items-center gap-1 text-orange-700 hover:text-orange-800">
            <ChevronLeft className="w-5 h-5" /> ช้อปต่อ
          </a>
        </div>

        <div className="flex items-center mb-4">
          <ShoppingBag className="w-7 h-7 text-orange-600 mr-2" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">ตะกร้าสินค้า</h1>
        </div>

        {cart.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* รายการสินค้า */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-orange-200 bg-white shadow-sm overflow-hidden">
                <ul className="divide-y divide-orange-100">
                  {cart.map((item) => (
                    <li key={item._id} className="p-4 md:p-5 flex items-center gap-3 md:gap-4">
                      <img
                        src={item.image || 'https://via.placeholder.com/100x100?text=No+Image'}
                        alt={item.name}
                        className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-xl border border-orange-100 bg-white"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100x100?text=No+Image'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{item.name}</div>
                        <div className="mt-1 text-orange-700 font-bold">{fmtTHB(item.price)}</div>

                        {/* ตัวนับจำนวน (มือถือแสดงใต้ชื่อ) */}
                        <div className="mt-2 flex items-center gap-2 md:hidden">
                          <QtyControl qty={item.qty} onDec={() => dec(item._id)} onInc={() => inc(item._id)} />
                        </div>
                      </div>

                      {/* ตัวนับจำนวน (เดสก์ท็อป) */}
                      <div className="hidden md:flex items-center gap-3">
                        <QtyControl qty={item.qty} onDec={() => dec(item._id)} onInc={() => inc(item._id)} />
                      </div>

                      <button
                        className="ml-1 text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition"
                        onClick={() => removeFromCart(item._id)}
                        title="ลบสินค้า"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* สรุปคำสั่งซื้อ */}
            <aside className="lg:sticky lg:top-6 h-fit">
              <div className="rounded-2xl border border-orange-200 bg-white shadow-sm p-5">
                <h2 className="text-lg font-bold text-slate-900 mb-3">สรุปคำสั่งซื้อ</h2>
                <div className="space-y-2 text-sm">
                  <Row label="ยอดสินค้า" value={fmtTHB(subTotal)} />
                  <Row
                    label={
                      <span>
                        ค่าส่ง{shipping === 0 && subTotal > 0 ? (
                          <span className="ml-1 text-emerald-600 font-medium">(ส่งฟรี)</span>
                        ) : null}
                      </span>
                    }
                    value={fmtTHB(shipping)}
                  />
                </div>
                <div className="my-3 h-px bg-orange-100" />
                <Row label={<span className="font-semibold">ยอดรวมทั้งสิ้น</span>} value={<b>{fmtTHB(total)}</b>} />

                {subTotal > 0 && subTotal < 999 && (
                  <p className="mt-2 text-xs text-slate-500">
                    เหลืออีก <b>{fmtTHB(999 - subTotal)}</b> เพื่อรับ<span className="text-emerald-600 font-medium"> ส่งฟรี</span>
                  </p>
                )}

                <button
                  className="mt-4 w-full h-12 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold shadow hover:from-orange-700 hover:to-amber-600 transition"
                  onClick={() => alert('เดโม: ดำเนินการสั่งซื้อ')}
                >
                  <span className="inline-flex items-center gap-2">
                    <CreditCard className="w-5 h-5" /> ดำเนินการสั่งซื้อ
                  </span>
                </button>

                <a
                  href="/"
                  className="mt-3 block text-center text-sm text-orange-700 hover:text-orange-800"
                >
                  ← เลือกซื้อสินค้าเพิ่ม
                </a>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

/* -------------------- UI ส่วนย่อย -------------------- */
function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className="text-slate-900">{value}</span>
    </div>
  )
}

function QtyControl({ qty, onDec, onInc }: { qty: number; onDec: () => void; onInc: () => void }) {
  return (
    <div className="inline-flex items-center border border-orange-200 rounded-full overflow-hidden">
      <button
        type="button"
        className="w-9 h-9 grid place-items-center hover:bg-orange-50 text-slate-700"
        onClick={onDec}
        aria-label="ลดจำนวน"
      >
        <Minus className="w-4 h-4" />
      </button>
      <div className="min-w-[40px] text-center text-slate-900 font-semibold">{qty}</div>
      <button
        type="button"
        className="w-9 h-9 grid place-items-center hover:bg-orange-50 text-slate-700"
        onClick={onInc}
        aria-label="เพิ่มจำนวน"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="max-w-2xl mx-auto text-center bg-white rounded-2xl border border-orange-200 p-10 shadow-sm">
      <ShoppingBag className="w-16 h-16 text-orange-400 mx-auto mb-3" />
      <p className="text-slate-700">ยังไม่มีสินค้าในตะกร้า</p>
      <a
        href="/"
        className="mt-5 inline-flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-500 text-white px-6 h-11 rounded-full font-semibold shadow hover:from-orange-700 hover:to-amber-600"
      >
        ไปช้อปปิ้งต่อ
      </a>
    </div>
  )
}
