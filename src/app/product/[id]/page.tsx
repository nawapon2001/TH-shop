'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import ReactMarkdown from 'react-markdown'
import { CartManager } from '@/lib/cart-utils'
import {
  ChevronLeft, ChevronRight, Star, Truck, ShieldCheck, Tag, Share2, Heart, X, Maximize2
} from 'lucide-react'
import { Store } from 'lucide-react'

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
  stock?: number
}

// -------------------------------
// Helpers
// -------------------------------
const formatTHB = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0 }).format(n)
const ensureString = (v: unknown) => (v == null ? '' : String(v))

// กันเคส backend อื่น ๆ ที่ยังไม่ normalize (เผื่อไว้)
function normalizeOptionsUI(raw: any): ProductOption[] {
  if (Array.isArray(raw) && raw.every((o) => typeof o === 'object' && Array.isArray(o?.values))) {
    return (raw as any[]).map((o) => ({ name: ensureString(o.name), values: (o.values ?? []).map(ensureString) }))
  }
  if (Array.isArray(raw) && raw.every((v) => typeof v === 'string' || typeof v === 'number')) {
    return [{ name: 'ตัวเลือก', values: (raw as Array<string|number>).map(ensureString) }]
  }
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return Object.entries(raw).map(([k, vals]) => ({
      name: ensureString(k),
      values: Array.isArray(vals) ? (vals as any[]).map(ensureString) : []
    }))
  }
  return []
}

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
  const [mainIndex, setMainIndex] = useState(0)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  // Update document title dynamically based on product
  useEffect(() => {
    if (product) {
      document.title = `${product.name} | TH-THAI SHOP`
    } else {
      document.title = 'รายละเอียดสินค้า | TH-THAI SHOP'
    }
  }, [product])
  const [sellerInfo, setSellerInfo] = useState<any | null>(null)

  // Fetch product by id
  useEffect(() => {
    let mounted = true
    async function fetchProduct() {
      try {
        setLoading(true)
        // try main products first
        let res = await fetch(`/api/products/${id}`)
        let data: any = null
        if (res.ok) {
          data = await res.json()
        } else {
          // if id was prefixed when merged (e.g. 'seller-<id>'), strip prefix
          let lookupId = id
          if (typeof lookupId === 'string' && lookupId.startsWith('seller-')) lookupId = lookupId.replace(/^seller-/, '')
          // try seller_products
          const spRes = await fetch(`/api/seller-products?id=${encodeURIComponent(lookupId)}`)
          if (spRes.ok) {
            data = await spRes.json()
            // normalize seller product fields to Product shape
            data = {
              _id: data._id ? String(data._id) : String(lookupId),
              name: data.name || 'สินค้าจากร้าน',
              price: Number(data.price) || 0,
              image: data.image || '',
              images: data.images || [],
              description: data.desc || data.description || '' ,
              category: data.category || '',
              // include real metrics when available
              rating: data.rating ?? 0,
              reviews: data.reviews ?? 0,
              sold: data.sold ?? 0,
              discountPercent: data.discountPercent ?? 0,
              stock: data.stock ?? 0,
            }
            // also set sellerInfo if available
            if (data && data.username) {
              // nothing here; sellerInfo fetch handled below
            }
          } else {
            throw new Error('fetch failed')
          }
        }

  const normalizedOptions = normalizeOptionsUI(data.options)

        const enriched: Product = {
          ...data,
          options: normalizedOptions,
          // use real values from the DB when present, otherwise fall back to safe zeros
          rating: data.rating ?? 0,
          reviews: data.reviews ?? 0,
          sold: data.sold ?? 0,
          discountPercent: data.discountPercent ?? 0,
          stock: data.stock ?? 0
        }

        if (!mounted) return
        setProduct(enriched)

        // ตั้งค่า default ของแต่ละ option เป็นค่าตัวแรก
        if (normalizedOptions.length) {
          const init: Record<string, string> = {}
          normalizedOptions.forEach((o) => {
            if (o.values?.length) init[o.name] = ensureString(o.values[0])
          })
          setSelectedOptions(init)
        } else {
          setSelectedOptions({})
        }
      } catch {/* no-op */} finally {
        if (mounted) setLoading(false)
      }
    }
    fetchProduct()
    // fetch seller info for this product from seller_products collection
    ;(async () => {
      try {
        // normalize lookup id (handles 'seller-<id>' prefix used when merging lists)
        let lookupId = id
        if (typeof lookupId === 'string' && lookupId.startsWith('seller-')) lookupId = lookupId.replace(/^seller-/, '')
        const spRes = await fetch(`/api/seller-products?id=${encodeURIComponent(lookupId)}`)
        if (!spRes.ok) return
        const sp = await spRes.json().catch(()=>null)
        if (!sp) return
        const username = sp.username || sp.seller || sp.owner || sp.user
        if (!username) return
        const sRes = await fetch(`/api/seller-info?username=${encodeURIComponent(username)}`)
        if (!sRes.ok) return
        const s = await sRes.json().catch(()=>null)
        if (s) setSellerInfo(s)
      } catch (err) {
        // ignore
      }
    })()
    return () => { mounted = false }
  }, [id])

  // Images
  const images = useMemo(() => {
    if (!product) return [] as string[]
    if (product.images?.length) return product.images
    return product.image ? [product.image] : []
  }, [product])

    // normalize image src: ensure leading slash for local uploads and allow data/http URLs
    const normalizeSrc = (src?: string) => {
      try {
        const s = String(src || '').trim()
        if (!s) return ''
        if (s.startsWith('http') || s.startsWith('data:') || s.startsWith('/')) return s
        return `/${s.replace(/^\/?/, '')}`
      } catch { return String(src || '') }
    }

    const mainImage = normalizeSrc(images[mainIndex]) || 'https://via.placeholder.com/600x600?text=No+Image'

  // Price
  const discountedPrice = useMemo(() => {
    if (!product) return 0
    if (!product.discountPercent) return product.price
    return Math.round(product.price * (1 - product.discountPercent / 100))
  }, [product])

  // Option gating: ถ้าไม่มีตัวเลือก -> ซื้อได้เลย
  const requiresOptions = (product?.options?.length ?? 0) > 0
  const selectedComplete = !requiresOptions
    ? true
    : product!.options!.every((opt) => !!selectedOptions[opt.name])

  // Cart state — อ้างอิงตาม selectedOptions เสมอ
  const inCart = CartManager.isInCart(product?._id || '', selectedOptions)
  const currentQuantity = CartManager.getItemQuantity(product?._id || '', selectedOptions)

  // Actions
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
    } catch { /* ignore */ }
  }

  const addToCart = () => {
    if (!product) return
    if (requiresOptions && !selectedComplete) {
      alert('กรุณาเลือกตัวเลือกสินค้าให้ครบก่อนเพิ่มเข้าตะกร้า')
      return
    }
    CartManager.addProduct({
      ...product,
      selectedOptions,
      // attach seller username when available (sellerInfo fetched separately)
      seller: (product as any).seller || (product as any).sellerUsername || sellerInfo?.username || (product as any).username || undefined,
    } as any, quantity)
  }

  const buyNow = () => {
    if (!product) return
    if (requiresOptions && !selectedComplete) {
      alert('กรุณาเลือกตัวเลือกสินค้าให้ครบก่อนสั่งซื้อ')
      return
    }
    CartManager.addProduct({
      ...product,
      selectedOptions,
      seller: (product as any).seller || (product as any).sellerUsername || sellerInfo?.username || (product as any).username || undefined,
    } as any, quantity)
    router.push('/checkout')
  }

  // อย่าให้จำนวนเกิน stock
  useEffect(() => {
    setQuantity((q) => Math.max(1, Math.min(q, product?.stock ?? 999)))
  }, [product?.stock])

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
        {/* Back & category */}
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
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-contain group-hover:scale-[1.015] transition-transform"
              />

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

            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {images.map((img, idx) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={idx}
                    src={normalizeSrc(img)}
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

          {/* Right: Info */}
          <div className="flex-1 flex flex-col gap-4 md:sticky md:top-8 relative z-20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold leading-snug text-gray-900">{product.name}</h1>
                {sellerInfo && (
                  <div className="mt-1 text-sm text-slate-600">
                    ร้าน: <Link href={`/seller/${encodeURIComponent(sellerInfo.username)}`} className="text-orange-700 font-medium">{sellerInfo.shopName || sellerInfo.username}</Link>
                  </div>
                )}
              </div>
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

            {/* Seller card */}
            {sellerInfo && (
              <div className="mt-4 p-4 border rounded-lg bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded overflow-hidden bg-orange-50 border">
                    {sellerInfo.image ? <img src={normalizeSrc(sellerInfo.image)} className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-orange-500 m-3" />}
                  </div>
                  <div>
                    <div className="font-semibold">{sellerInfo.shopName || sellerInfo.username}</div>
                    <div className="text-sm text-slate-600">ผู้ขาย: {sellerInfo.fullName || sellerInfo.username}</div>
                  </div>
                  <div className="ml-auto">
                    <button onClick={() => router.push(`/seller/${encodeURIComponent(sellerInfo.username)}`)} className="px-3 py-1 rounded bg-orange-600 text-white">ไปที่หน้าร้าน</button>
                  </div>
                </div>
              </div>
            )}

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
              <div className="space-y-4 pt-2 relative z-10">
                {product.options.map((opt) => (
                  <div key={opt.name} className="pointer-events-auto">
                    <div className="font-semibold mb-1">
                      {opt.name}
                      {selectedOptions[opt.name] ? (
                        <span className="ml-2 text-sm text-gray-500">เลือก: {selectedOptions[opt.name]}</span>
                      ) : null}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {(opt.values || []).map((rawVal, i) => {
                        const val = ensureString(rawVal)
                        const active = selectedOptions[opt.name] === val

                        return (
                          <button
                            key={`${opt.name}-${val}-${i}`}
                            type="button"
                            style={{ WebkitTapHighlightColor: 'transparent' }}
                            className={`px-3 h-9 rounded-full border text-sm font-medium transition ${
                              active
                                ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                                : 'bg-white text-gray-700 border-orange-200 hover:bg-orange-50'
                            }`}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setSelectedOptions((prev) => ({ ...prev, [opt.name]: val }))
                            }}
                          >
                            {val}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {requiresOptions && !selectedComplete && (
                  <p className="text-xs text-red-600">กรุณาเลือกตัวเลือกสินค้าให้ครบก่อนทำรายการ</p>
                )}
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
                  onClick={() => setQuantity((q) => Math.min(q + 1, product?.stock || 999))}
                  disabled={quantity >= (product?.stock || 999)}
                >
                  +
                </button>
              </div>
              <span className="text-sm text-gray-500">สต็อก: {formatTHB(product?.stock ?? 0)}</span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                className={`flex-1 py-3 rounded-xl font-semibold transition text-lg shadow ${
                  selectedComplete ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-gray-300 text-white cursor-not-allowed'
                }`}
                onClick={addToCart}
                disabled={!selectedComplete}
              >
                {inCart ? `เพิ่มอีก ${quantity} ชิ้น (${currentQuantity + quantity})` : 'เพิ่มเข้าตะกร้า'}
              </button>
              <button
                className={`flex-1 py-3 rounded-xl font-semibold transition text-lg shadow ${
                  selectedComplete ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-300 text-white cursor-not-allowed'
                }`}
                onClick={buyNow}
                disabled={!selectedComplete}
              >
                ซื้อสินค้า
              </button>
            </div>

            {/* Secondary actions (mobile) */}
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
              selectedComplete ? 'bg-orange-600' : 'bg-gray-300'
            }`}
            onClick={addToCart}
            disabled={!selectedComplete}
          >
            {inCart ? 'อยู่ในตะกร้าแล้ว' : 'เพิ่มเข้าตะกร้า'}
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90"
          onClick={() => setLightbox(false)}
        >
          <button
            aria-label="ปิด"
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/90 text-orange-900 grid place-items-center"
            onClick={(e) => { e.stopPropagation(); setLightbox(false) }}
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className="absolute inset-0 flex items-center justify-center px-4 z-40"
            onClick={(e) => e.stopPropagation()}
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
