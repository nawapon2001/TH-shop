'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Banner from '@/components/Banner'
import FullScreenBanner from '@/components/FullScreenBanner'
import ProductRecommendations from '@/components/ProductRecommendations'
import Swal from 'sweetalert2'
import { motion } from 'framer-motion'
import {
  ShoppingCart, Search, Filter, X, Truck, Star, ChevronLeft, ChevronRight,
} from 'lucide-react'

/* ------------------------------- Types ------------------------------- */
type Product = {
  _id: string
  name: string
  price: number
  image?: string
  images?: string[]
  description?: string
  rating?: number
  sold?: number
  freeShipping?: boolean
  category?: string
}
type Category = { name: string; icon?: string }
type BannerItem = { url: string; isSmall?: boolean }
type ApiBanner = { image?: string; url?: string; isSmall?: boolean }
type SortKey = 'popular' | 'price_asc' | 'price_desc'

/* ------------------------------- Helpers ------------------------------- */
const formatTHB = (value: number) =>
  new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0 }).format(value)
const clamp = (n: number, min = 0, max = 5) => Math.max(min, Math.min(max, n))

/* ------------------------------- Skeletons ------------------------------- */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-orange-100 animate-pulse aspect-[3/4] overflow-hidden">
      <div className="bg-orange-50 h-2/3" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-orange-50 rounded" />
        <div className="h-4 bg-orange-50 w-2/3 rounded" />
        <div className="h-6 bg-orange-50 w-1/3 rounded" />
      </div>
    </div>
  )
}
function EmptyMessage({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center py-14 bg-white/60 rounded-2xl border border-orange-100">
      <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center">
        <Search className="w-6 h-6 text-orange-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
    </div>
  )
}

/* ------------------------------- CategoryMenu ------------------------------- */
function CategoryMenu({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[]
  selected?: string
  onSelect?: (category: string | undefined) => void
}) {
  const scrollerId = 'cat-scroll'
  return (
    <div className="relative max-w-6xl mx-auto px-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-orange-900">เลือกหมวดหมู่</h2>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect?.(undefined)}
            className="text-sm text-orange-700 hover:text-orange-900 flex items-center gap-1"
            aria-label="ล้างตัวกรองหมวดหมู่"
          >
            <X className="w-4 h-4" /> ล้างตัวกรอง
          </button>
        )}
      </div>

      <div className="relative">
        <button
          type="button"
          aria-label="เลื่อนซ้าย"
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white border border-orange-200 shadow hover:bg-orange-50"
          onClick={() => document.getElementById(scrollerId)?.scrollBy({ left: -240, behavior: 'smooth' })}
        >
          <ChevronLeft className="w-4 h-4 text-orange-700" />
        </button>

        <div id={scrollerId} className="flex gap-3 overflow-x-auto no-scrollbar py-2 pr-2">
          {categories.map((cat) => {
            const active = selected === cat.name
            return (
              <button
                key={cat.name}
                className={
                  'group flex items-center gap-3 pr-4 pl-2 h-12 rounded-full border transition ' +
                  (active
                    ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                    : 'bg-white text-orange-800 border-orange-200 hover:bg-orange-50')
                }
                onClick={() => onSelect?.(active ? undefined : cat.name)}
                type="button"
              >
                <span className="w-8 h-8 rounded-full bg-white/90 border border-orange-200 flex items-center justify-center overflow-hidden">
                  {cat.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cat.icon} alt={cat.name} className="w-5 h-5 object-contain" />
                  ) : (
                    <span className="text-lg">🗂️</span>
                  )}
                </span>
                <span className="text-sm font-medium whitespace-nowrap">{cat.name}</span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          aria-label="เลื่อนขวา"
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-white border border-orange-200 shadow hover:bg-orange-50"
          onClick={() => document.getElementById(scrollerId)?.scrollBy({ left: 240, behavior: 'smooth' })}
        >
          <ChevronRight className="w-4 h-4 text-orange-700" />
        </button>
      </div>
    </div>
  )
}

/* ------------------------------- Product Card ------------------------------- */
function ProductCard({
  product,
  inCart,
  onAddToCart,
  onClick,
}: {
  product: Product
  inCart: boolean
  onAddToCart: (product: Product) => void
  onClick: () => void
}) {
  const discountPercent = 15
  const soldCount = product.sold ?? Math.floor(Math.random() * 600) + 20
  const isFreeShipping = product.freeShipping ?? true
  const rating = clamp(product.rating ?? 4 + Math.random())

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="group bg-white rounded-2xl shadow-sm border border-orange-100 hover:shadow-lg transition-all cursor-pointer overflow-hidden relative"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick()
      }}
    >
      {/* Image */}
      <div className="relative aspect-[4/5] bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            Array.isArray(product.images) && product.images.length
              ? product.images[0]
              : product.image || 'https://via.placeholder.com/600x600?text=No+Image'
          }
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x600?text=No+Image'
          }}
        />

        {/* Discount badge */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center px-2 py-1 text-[11px] font-semibold rounded-full bg-orange-600 text-white shadow">
            -{discountPercent}%
          </span>
        </div>

        {/* Free shipping */}
        {isFreeShipping && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-full bg-green-100 text-green-700 border border-green-200">
              <Truck className="w-3 h-3" /> ส่งฟรี
            </span>
          </div>
        )}

        {/* Quick actions */}
        <div className="absolute inset-x-2 bottom-2 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition">
          <button
            type="button"
            className="flex-1 h-10 rounded-xl bg-orange-600 text-white text-sm font-semibold shadow hover:bg-orange-700 flex items-center justify-center gap-2"
            onClick={(e) => {
              e.stopPropagation()
              onAddToCart(product)
            }}
            aria-label="เพิ่มลงตะกร้า"
          >
            <ShoppingCart className="w-4 h-4" /> เพิ่มลงตะกร้า
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="text-sm text-gray-900 line-clamp-2 min-h-[2.6em]">{product.name}</div>
        <div className="mt-2 flex items-center justify-between">
          <div className="text-xl text-orange-700 font-bold flex items-center">
            <span className="text-base mr-0.5">฿</span>
            {formatTHB(product.price)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <Star className="w-3.5 h-3.5 fill-yellow-400 stroke-yellow-400" />
            <span>{rating.toFixed(1)}</span>
            <span className="text-gray-300">•</span>
            <span>ขายแล้ว {formatTHB(soldCount)}</span>
          </div>
        </div>
      </div>

      {/* In cart ribbon */}
      {inCart && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2">
          <span className="px-2 py-1 bg-white/90 border border-orange-200 text-orange-700 text-[11px] font-semibold rounded-full shadow-sm">
            อยู่ในตะกร้าแล้ว
          </span>
        </div>
      )}
    </motion.div>
  )
}

/* ------------------------------- Page (wrapper เพื่อใช้ Suspense) ------------------------------- */
export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500">กำลังโหลด…</div>}>
      <ProductPageInner />
    </Suspense>
  )
}

/* ------------------------------- Page (จริง) ------------------------------- */
function ProductPageInner() {
  const [products, setProducts] = useState<Product[]>([])
  const [bannerImages, setBannerImages] = useState<BannerItem[]>([])
  const [cart, setCart] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCats, setLoadingCats] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>()
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('popular')

  const router = useRouter()
  const params = useSearchParams() // ✅ อยู่ใน Suspense แล้ว
  const username = params.get('username') || undefined

  /* Fetch products */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/products')
        setProducts(res.ok ? ((await res.json()) as Product[]) ?? [] : [])
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  /* Fetch banners */
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch('/api/banners')
        if (!res.ok) {
          setBannerImages([])
          return
        }
        const data = (await res.json()) as ApiBanner[] | unknown
        const arr = Array.isArray(data) ? data : []
        const banners: BannerItem[] = arr.map((b) => {
          const img = b.image || ''
          const url = b.url || ''
          const pick = img || url
          const normalized =
            pick && pick.startsWith('data:')
              ? pick
              : pick
              ? pick.startsWith('/banners/')
                ? pick
                : `/banners/${pick.replace(/^\/?banners\//, '')}`
              : ''
          return { url: normalized, isSmall: b.isSmall }
        })
        setBannerImages(banners)
      } catch {
        setBannerImages([])
      }
    }
    fetchBanners()
  }, [])

  /* Fetch categories */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCats(true)
        const res = await fetch('/api/categories')
        const d = res.ok ? ((await res.json()) as Category[] | string[]) ?? [] : []
        // รองรับทั้ง array ของ object และ array ของ string
        const cats: Category[] = Array.isArray(d)
          ? (typeof d[0] === 'string'
              ? (d as string[]).map((name) => ({ name }))
              : (d as Category[])
            )
          : []
        setCategories(cats)
      } catch {
        setCategories([])
      } finally {
        setLoadingCats(false)
      }
    }
    fetchCategories()
  }, [])

  /* Load & persist cart */
  useEffect(() => {
    const raw = localStorage.getItem('cart')
    try {
      setCart(raw ? (JSON.parse(raw) as Product[]) : [])
    } catch {
      setCart([])
    }
  }, [])
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (product: Product) => {
    setCart((prev) => {
      if (prev.find((p) => p._id === product._id)) {
        Swal.fire({ icon: 'info', title: 'มีสินค้าในตะกร้าแล้ว', timer: 1200, showConfirmButton: false })
        return prev
      }
      Swal.fire({ icon: 'success', title: 'เพิ่มสินค้าลงตะกร้าแล้ว', timer: 1200, showConfirmButton: false })
      return [...prev, product]
    })
  }

  /* Derived list */
  const filtered = useMemo(() => {
    let list = [...products]
    if (selectedCategory) list = list.filter((p) => p.category === selectedCategory)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((p) => [p.name, p.description].filter(Boolean).some((f) => f!.toLowerCase().includes(q)))
    }
    switch (sortBy) {
      case 'price_asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        list.sort((a, b) => b.price - a.price)
        break
      default:
        list.sort(
          (a, b) =>
            (b.sold ?? 0) - (a.sold ?? 0) ||
            (b.rating ?? 0) - (a.rating ?? 0) ||
            a.price - b.price
        )
    }
    return list
  }, [products, selectedCategory, search, sortBy])

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{
        background:
          'radial-gradient(1200px 600px at 20% -10%, rgba(255,237,213,0.6) 0%, rgba(255,255,255,0) 60%), radial-gradient(900px 500px at 90% -20%, rgba(254,215,170,0.45) 0%, rgba(255,255,255,0) 55%), #fff',
      }}
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-40 backdrop-blur bg-white/70 border-b border-orange-100">
        <Header user={username} />
        <div className="max-w-6xl mx-auto px-4 py-2 flex justify-end">
          <Link href="/orders" className="text-orange-700 hover:underline font-semibold">
            ดูคำสั่งซื้อของคุณ
          </Link>
        </div>
      </div>

      {/* Banners — แสดงเฉพาะที่ไม่ใช่ small */}
      <div className="relative">
        {bannerImages?.length > 0 ? (
          <Banner images={bannerImages.filter((b) => !b.isSmall)} />
        ) : (
          <FullScreenBanner />
        )}
      </div>

      {/* Toolbar */}
      <section className="max-w-6xl mx-auto mt-6 px-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-stretch">
          <div className="md:col-span-7">
            <div className="flex items-center gap-2 bg-white border border-orange-200 rounded-2xl px-3 h-12 shadow-sm focus-within:ring-2 focus-within:ring-orange-300">
              <Search className="w-5 h-5 text-orange-700" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาสินค้า ตัวอย่าง: หูฟัง, หม้อทอดไร้น้ำมัน"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
                aria-label="ค้นหาสินค้า"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="ล้างคำค้นหา"
                  className="p-1 rounded-full hover:bg-orange-50"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          </div>
          <div className="md:col-span-5">
            <div className="flex items-center gap-2 h-12">
              <div className="flex-1 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSortBy('popular')}
                  className={
                    'h-12 rounded-2xl border shadow-sm flex items-center justify-center gap-2 text-sm ' +
                    (sortBy === 'popular'
                      ? 'bg-orange-600 text-white border-orange-600'
                      : 'bg-white text-orange-900 border-orange-200 hover:bg-orange-50')
                  }
                >
                  <Filter className="w-4 h-4" />
                  ยอดนิยม
                </button>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    className="w-full h-12 appearance-none rounded-2xl border border-orange-200 bg-white pl-3 pr-8 text-black text-sm shadow-sm hover:bg-orange-50"
                    aria-label="เรียงลำดับราคา"
                  >
                    <option value="popular">จัดเรียง: แนะนำ</option>
                    <option value="price_asc">ราคาต่ำ → สูง</option>
                    <option value="price_desc">ราคาสูง → ต่ำ</option>
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-orange-700">▾</span>
                </div>
              </div>
              <Link
                href="/checkout"
                className="inline-flex items-center gap-2 h-12 px-4 rounded-2xl bg-orange-100 text-orange-800 font-semibold shadow hover:bg-orange-200 border border-orange-200"
              >
                <ShoppingCart className="w-5 h-5" /> ตะกร้า ({cart.length})
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <div className="mt-6">
        {loadingCats ? (
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 rounded-full bg-white border border-orange-100 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <CategoryMenu categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
        )}
      </div>

      {/* Welcome */}
      {username && (
        <div className="max-w-6xl mx-auto px-4 mt-3 text-right text-black">
          ยินดีต้อนรับ, <span className="font-bold">{username}</span>
        </div>
      )}

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* All Products */}
        <section className="mb-8">
          <div className="flex items-end justify-between mb-4">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-orange-900">สินค้าทั้งหมด</h1>
            {selectedCategory && (
              <div className="text-sm text-gray-600">
                หมวดหมู่: <span className="font-semibold text-orange-800">{selectedCategory}</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyMessage title="ไม่พบสินค้า" subtitle="ลองค้นหาด้วยคำอื่น หรือเปลี่ยนตัวกรองดูนะ" />
          ) : (
            <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {filtered.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  inCart={!!cart.find((p) => p._id === product._id)}
                  onAddToCart={addToCart}
                  onClick={() => router.push(`/product/${product._id}`)}
                />
              ))}
            </motion.div>
          )}
        </section>

        {/* You May Also Like */}
        {products.length > 10 && (
          <ProductRecommendations products={products.slice(8, 16)} title="คุณอาจชอบ" />
        )}
      </main>

      {/* Floating Cart CTA (mobile) */}
      <Link
        href="/checkout"
        className="fixed md:hidden bottom-4 right-4 inline-flex items-center gap-2 px-4 h-12 rounded-full bg-orange-600 text-white font-semibold shadow-lg"
        aria-label="ไปที่ตะกร้าสินค้า"
      >
        <ShoppingCart className="w-5 h-5" /> {cart.length}
      </Link>
    </div>
  )
}
