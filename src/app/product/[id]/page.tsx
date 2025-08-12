'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/Header'
import ReactMarkdown from 'react-markdown'
import {
  ChevronLeft, ChevronRight, Star, Truck, ShieldCheck, Tag, Share2, Heart, Copy, X, Maximize2
} from 'lucide-react'

// -------------------------------
// Types
// -------------------------------
type ProductOption = { name: string; values: string[] }

type Product = {
  _id: string
  name: string
  price: number
  image?: string
  images?: string[]
  description?: string
  options?: ProductOption[]
  rating?: number
  reviews?: number
  sold?: number
  discountPercent?: number
  deliveryInfo?: string
  promotions?: string[]
  category?: string
}

// -------------------------------
// Helpers
// -------------------------------
const formatTHB = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0 }).format(n)

// -------------------------------
// Skeleton
// -------------------------------
function ProductSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="h-5 w-40 bg-orange-50 rounded mb-4" />
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-2/5">
          <div className="aspect-square bg-orange-50 rounded-xl border border-orange-100 animate-pulse" />
          <div className="mt-3 grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-orange-50 rounded border border-orange-100 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-3">
          <div className="h-7 w-2/3 bg-orange-50 rounded" />
          <div className="h-5 w-1/3 bg-orange-50 rounded" />
          <div className="h-10 w-1/2 bg-orange-50 rounded" />
          <div className="h-24 w-full bg-orange-50 rounded" />
        </div>
      </div>
    </div>
  )
}

// -------------------------------
// Page
// -------------------------------
export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [product, setProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<Product[]>([])
  const [mainIndex, setMainIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  const images = useMemo(() => {
    if (!product) return [] as string[]
    if (product.images?.length) return product.images
    return product.image ? [product.image] : []
  }, [product])

  const mainImage = images[mainIndex]

  useEffect(() => {
    let mounted = true
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/products/${id}`)
        if (!res.ok) throw new Error('fetch failed')
        const data = await res.json()
        if (!mounted) return
        setProduct({
          ...data,
          rating: data.rating ?? 4.8,
          reviews: data.reviews ?? 123,
          sold: data.sold ?? 456,
          discountPercent: data.discountPercent ?? 15,
        })
        if (data.options) {
          const initial: Record<string, string> = {}
          data.options.forEach((opt: ProductOption) => {
            if (opt.values.length > 0) initial[opt.name] = opt.values[0]
          })
          setSelectedOptions(initial)
        }
      } catch {
        /* noop */
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchProduct()
    const cartData = localStorage.getItem('cart')
    if (cartData) setCart(JSON.parse(cartData))
    return () => { mounted = false }
  }, [id])

  const inCart = !!cart.find((p) => p._id === id)

  const addToCart = () => {
    if (product && !inCart) {
      const newCart = [...cart, product]
      setCart(newCart)
      localStorage.setItem('cart', JSON.stringify(newCart))
    }
  }

  const discountedPrice = useMemo(() => {
    if (!product) return 0
    if (!product.discountPercent) return product.price
    return Math.round(product.price * (1 - product.discountPercent / 100))
  }, [product])

  const nextImage = () => setMainIndex((i) => (i + 1) % Math.max(1, images.length))
  const prevImage = () => setMainIndex((i) => (i - 1 + Math.max(1, images.length)) % Math.max(1, images.length))

  const shareOrCopy = async () => {
    try {
      const url = typeof window !== 'undefined' ? window.location.href : ''
      if ((navigator as any).share) {
        await (navigator as any).share({ title: product?.name, url })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        alert('คัดลอกลิงก์แล้ว')
      }
    } catch {/* ignore */}
  }

  // Add to cart and go to checkout
  const buyNow = () => {
    if (product) {
      let newCart = [...cart]
      if (!inCart) {
        newCart = [...cart, product]
        setCart(newCart)
        localStorage.setItem('cart', JSON.stringify(newCart))
      }
      router.push('/checkout')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <ProductSkeleton />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-xl mx-auto p-8 text-center text-gray-500">ไม่พบสินค้า</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#fff' }}>
      <Header />
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Breadcrumb / Back */}
        <div className="flex items-center justify-between mb-3">
          <button
            className="inline-flex items-center gap-2 text-orange-700 hover:text-orange-900 hover:underline"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-4 h-4" /> กลับ
          </button>
          {product.category && (
            <div className="text-sm text-gray-500">
              หมวดหมู่: <span className="font-medium text-orange-800">{product.category}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Left: Gallery */}
          <div className="md:w-2/5">
            <div className="relative bg-gray-50 rounded-xl border aspect-square overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mainImage || 'https://via.placeholder.com/600x600?text=No+Image'}
                alt={product.name}
                className="w-full h-full object-contain group-hover:scale-[1.015] transition-transform"
              />

              {/* Controls */}
              {images.length > 1 && (
                <>
                  <button
                    aria-label="ก่อนหน้า"
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-orange-200 shadow hover:bg-white"
                  >
                    <ChevronLeft className="w-5 h-5 text-orange-800 mx-auto" />
                  </button>
                  <button
                    aria-label="ถัดไป"
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 border border-orange-200 shadow hover:bg-white"
                  >
                    <ChevronRight className="w-5 h-5 text-orange-800 mx-auto" />
                  </button>
                </>
              )}

              {/* Open lightbox */}
              {mainImage && (
                <button
                  onClick={() => setLightbox(true)}
                  aria-label="ขยายรูป"
                  className="absolute bottom-2 right-2 h-9 px-3 rounded-full bg-white/90 border border-orange-200 text-orange-800 text-sm inline-flex items-center gap-2 shadow hover:bg-white"
                >
                  <Maximize2 className="w-4 h-4" /> ขยาย
                </button>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={idx}
                    src={img}
                    alt={`thumb-${idx}`}
                    className={`h-16 w-full object-cover rounded-lg border cursor-pointer transition ring-2 ${
                      mainIndex === idx ? 'ring-orange-500' : 'ring-transparent'
                    }`}
                    onClick={() => setMainIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info (sticky on desktop) */}
          <div className="flex-1 flex flex-col gap-4 md:sticky md:top-8">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold leading-snug text-gray-900">{product.name}</h1>
              <div className="hidden md:flex items-center gap-2 text-gray-500">
                <button
                  className={`p-2 rounded-full border ${liked ? 'border-red-300 bg-red-50 text-red-600' : 'border-orange-200 hover:bg-orange-50'}`}
                  aria-label="ถูกใจ"
                  onClick={() => setLiked((s) => !s)}
                  title={liked ? 'นำออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 stroke-red-500' : ''}`} />
                </button>
                <button
                  className="p-2 rounded-full border border-orange-200 hover:bg-orange-50"
                  aria-label="แชร์"
                  onClick={shareOrCopy}
                  title="แชร์/คัดลอกลิงก์"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Rating & Meta */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1 text-yellow-600 font-semibold">
                <Star className="w-4 h-4 fill-yellow-400 stroke-yellow-400" />
                {product.rating?.toFixed(1)}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">รีวิว {formatTHB(product.reviews ?? 0)}</span>
              <span className="text-gray-300">|</span>
              <span className="text-gray-600">ขายแล้ว {formatTHB(product.sold ?? 0)}</span>
            </div>

            {/* Price */}
            <div className="flex items-end gap-4">
              <div className="text-3xl md:text-4xl font-extrabold text-orange-700 tracking-tight">
                <span className="text-lg align-top mr-1">฿</span>
                {formatTHB(discountedPrice)}
              </div>
              {product.discountPercent ? (
                <div className="flex items-center gap-2">
                  <span className="line-through text-gray-400">฿{formatTHB(product.price)}</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-orange-600 text-white">
                    <Tag className="w-3.5 h-3.5" /> -{product.discountPercent}%
                  </span>
                </div>
              ) : null}
            </div>

            {/* Promo chips */}
            {product.promotions?.length ? (
              <div className="flex flex-wrap gap-2">
                {product.promotions.map((p, i) => (
                  <span key={i} className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-semibold border border-pink-200">
                    {p}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Delivery / trust */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <Truck className="w-4 h-4" />
                <span>{product.deliveryInfo || 'ส่งฟรีขั้นต่ำตามเงื่อนไข'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                <ShieldCheck className="w-4 h-4" />
                <span>การรับประกัน 7 วัน</span>
              </div>
            </div>

            {/* Options */}
            {product.options?.length ? (
              <div className="space-y-4 pt-2">
                {product.options.map((opt) => (
                  <div key={opt.name}>
                    <div className="font-semibold mb-1">{opt.name}</div>
                    <div className="flex gap-2 flex-wrap">
                      {opt.values.map((val) => {
                        const active = selectedOptions[opt.name] === val
                        return (
                          <button
                            key={val}
                            type="button"
                            className={`px-3 h-9 rounded-full border text-sm font-medium transition ${
                              active
                                ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                                : 'bg-white text-gray-700 border-orange-200 hover:bg-orange-50'
                            }`}
                            onClick={() => setSelectedOptions((prev) => ({ ...prev, [opt.name]: val }))}
                          >
                            {val}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {/* Quantity */}
            <div className="flex items-center gap-3">
              <span className="font-semibold">จำนวน</span>
              <div className="flex items-center border border-orange-200 rounded-xl">
                <button
                  type="button"
                  className="w-10 h-10 text-lg font-bold text-gray-600 hover:bg-orange-50 rounded-l-xl"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-14 text-center border-0 focus:ring-0"
                />
                <button
                  type="button"
                  className="w-10 h-10 text-lg font-bold text-gray-600 hover:bg-orange-50 rounded-r-xl"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                className={`flex-1 py-3 rounded-xl font-semibold transition text-lg shadow ${
                  inCart ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
                onClick={addToCart}
                disabled={inCart}
              >
                {inCart ? 'อยู่ในตะกร้าแล้ว' : 'เพิ่มเข้าตะกร้า'}
              </button>
              <button
                className="flex-1 py-3 rounded-xl font-semibold bg-green-600 hover:bg-green-700 text-white transition text-lg shadow"
                onClick={buyNow}
              >
                ซื้อสินค้า
              </button>
            </div>

            {/* Secondary actions (mobile visible below, desktop here) */}
            <div className="flex md:hidden gap-2">
              <button
                onClick={shareOrCopy}
                className="flex-1 h-11 rounded-xl border border-orange-200 text-orange-900 bg-white"
              >
                แชร์ / คัดลอกลิงก์
              </button>
              <button
                onClick={() => setLiked((s) => !s)}
                className={`w-11 h-11 rounded-xl border ${liked ? 'border-red-300 bg-red-50 text-red-600' : 'border-orange-200 bg-white'}`}
                aria-label="ถูกใจ"
              >
                <Heart className={`w-4 h-4 mx-auto ${liked ? 'fill-red-500 stroke-red-500' : ''}`} />
              </button>
            </div>

            {/* Mobile description */}
            <div className="block md:hidden mt-6 text-black">
              {product.description}
            </div>
          </div>
        </div>

        {/* Description (desktop) */}
        <div className="hidden md:block mt-10 text-black">
          <h2 className="text-xl font-semibold mb-4">รายละเอียดสินค้า</h2>
          <div className="prose max-w-none prose-p:leading-7 prose-headings:scroll-mt-20 prose-strong:text-orange-900">
            <ReactMarkdown>{product.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</ReactMarkdown>
          </div>

          {/* Extra info sections */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            <InfoCard
              title="การจัดส่ง"
              icon={<Truck className="w-5 h-5" />}
              text="จัดส่งภายใน 1–3 วันทำการ (ยกเว้นวันหยุดนักขัตฤกษ์) มีเลขติดตาม"
            />
            <InfoCard
              title="การรับประกัน"
              icon={<ShieldCheck className="w-5 h-5" />}
              text="เปลี่ยน/คืนสินค้าได้ภายใน 7 วัน หากมีปัญหาจากการผลิต"
            />
            <InfoCard
              title="คำแนะนำ"
              icon={<Tag className="w-5 h-5" />}
              text="กดติดตามร้านเพื่อรับคูปองส่วนลดและโปรโมชันก่อนใคร"
            />
          </div>
        </div>
      </div>

      {/* Sticky action (mobile) */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-orange-100 p-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xl font-extrabold text-orange-700">
            <span className="text-base align-top mr-1">฿</span>
            {formatTHB(discountedPrice)}
          </div>
          <button
            className={`flex-1 py-3 rounded-xl font-semibold text-white ${
              inCart ? 'bg-gray-300' : 'bg-orange-600'
            }`}
            onClick={addToCart}
            disabled={inCart}
          >
            {inCart ? 'อยู่ในตะกร้าแล้ว' : 'เพิ่มเข้าตะกร้า'}
          </button>
        </div>
      </div>

      {/* Lightbox */}
     {lightbox && (
  <div
    className="fixed inset-0 z-50 bg-black/90"
    onClick={() => setLightbox(false)}   // คลิกพื้นหลังเพื่อปิด
  >
    <button
      aria-label="ปิด"
      className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/90 text-orange-900 grid place-items-center"
      onClick={(e) => { e.stopPropagation(); setLightbox(false) }} // กันคลิกทะลุ
    >
      <X className="w-5 h-5" />
    </button>

    <div
      className="absolute inset-0 flex items-center justify-center px-4 z-40"
      onClick={(e) => e.stopPropagation()} // ไม่ให้คลิกตรงเนื้อหาไปปิด
    >
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); prevImage() }}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-orange-900 grid place-items-center"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}

      <img
        src={mainImage}
        alt="preview"
        className="max-h-[80vh] max-w-[92vw] object-contain rounded-xl shadow-2xl"
      />

      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); nextImage() }}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-orange-900 grid place-items-center"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>

          {/* thumbs in lightbox */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 px-4">
              <div className="mx-auto max-w-4xl bg-black/30 rounded-xl p-2 overflow-x-auto no-scrollbar">
                <div className="flex gap-2">
                  {images.map((img, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={idx}
                      src={img}
                      alt={`lb-${idx}`}
                      className={`h-16 w-16 object-cover rounded-lg border cursor-pointer ring-2 ${
                        mainIndex === idx ? 'ring-orange-400' : 'ring-transparent'
                      }`}
                      onClick={() => setMainIndex(idx)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------- Small info card ---------- */
function InfoCard({ title, text, icon }: { title: string; text: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-orange-900 font-semibold mb-1">
        {icon} {title}
      </div>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  )
}

