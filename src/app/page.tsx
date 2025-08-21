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
  Heart, Share2, Eye, Zap, Gift, Crown
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 animate-pulse aspect-[3/4] overflow-hidden">
      <div className="bg-gradient-to-br from-slate-100 to-slate-200 h-2/3" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded" />
        <div className="h-4 bg-slate-200 w-2/3 rounded" />
        <div className="h-6 bg-slate-200 w-1/2 rounded" />
      </div>
    </div>
  )
}

function EmptyMessage({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 shadow-sm"
    >
      <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
        <Search className="w-8 h-8 text-orange-600" />
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      {subtitle && <p className="text-slate-500 text-sm max-w-md mx-auto">{subtitle}</p>}
    </motion.div>
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
    <div className="relative max-w-7xl mx-auto px-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
          หมวดหมู่สินค้า
        </h2>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect?.(undefined)}
            className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 hover:bg-orange-100 transition-colors"
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
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg hover:bg-slate-50 hover:shadow-xl transition-all"
          onClick={() => document.getElementById(scrollerId)?.scrollBy({ left: -300, behavior: 'smooth' })}
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>

        <div id={scrollerId} className="flex gap-4 overflow-x-auto no-scrollbar py-3 px-2">
          {categories.map((cat, index) => {
            const active = selected === cat.name
            return (
              <motion.button
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={
                  'group flex flex-col items-center gap-2 p-4 min-w-[100px] rounded-2xl border-2 transition-all duration-300 ' +
                  (active
                    ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white border-orange-500 shadow-lg scale-105'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:shadow-md hover:scale-105')
                }
                onClick={() => onSelect?.(active ? undefined : cat.name)}
                type="button"
              >
                <div className={
                  'w-12 h-12 rounded-xl flex items-center justify-center transition-all ' +
                  (active ? 'bg-white/20' : 'bg-gradient-to-br from-orange-50 to-red-50')
                }>
                  {cat.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cat.icon} alt={cat.name} className="w-7 h-7 object-contain" />
                  ) : (
                    <span className="text-2xl">🗂️</span>
                  )}
                </div>
                <span className="text-xs font-semibold text-center leading-tight">{cat.name}</span>
              </motion.button>
            )
          })}
        </div>

        <button
          type="button"
          aria-label="เลื่อนขวา"
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 hidden lg:flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg hover:bg-slate-50 hover:shadow-xl transition-all"
          onClick={() => document.getElementById(scrollerId)?.scrollBy({ left: 300, behavior: 'smooth' })}
        >
          <ChevronRight className="w-5 h-5 text-slate-600" />
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
  const discountPercent = Math.floor(Math.random() * 30) + 10
  const originalPrice = Math.floor(product.price * (1 + discountPercent / 100))
  const soldCount = product.sold ?? Math.floor(Math.random() * 600) + 20
  const isFreeShipping = product.freeShipping ?? true
  const rating = clamp(product.rating ?? 4 + Math.random())
  const [isLiked, setIsLiked] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="group bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-xl transition-all cursor-pointer overflow-hidden relative"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onClick()
      }}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            Array.isArray(product.images) && product.images.length
              ? product.images[0]
              : product.image || 'https://via.placeholder.com/400x400?text=No+Image'
          }
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=No+Image'
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-md bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg">
            -{discountPercent}%
          </span>
          {soldCount > 500 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 shadow">
              <Crown className="w-3 h-3" /> ขายดี
            </span>
          )}
        </div>

        {/* Free shipping */}
        {isFreeShipping && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg">
              <Truck className="w-3 h-3" /> ส่งฟรี
            </span>
          </div>
        )}

        {/* Wishlist button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsLiked(!isLiked)
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0"
          style={{ right: isFreeShipping ? '90px' : '8px' }}
        >
          <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all">
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-slate-600'}`} />
          </div>
        </button>

        {/* Quick view */}
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all"
          >
            <Eye className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Add to cart overlay */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <button
            type="button"
            className="w-full h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 hover:from-orange-600 hover:to-red-600 transition-all"
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
      <div className="p-4">
        <div className="text-sm text-slate-800 line-clamp-2 min-h-[2.5em] font-medium leading-relaxed">{product.name}</div>
        
        {/* Rating and sold */}
        <div className="mt-2 flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3 h-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} 
                />
              ))}
            </div>
            <span className="text-slate-600 font-medium">{rating.toFixed(1)}</span>
          </div>
          <span className="text-slate-300">•</span>
          <span className="text-slate-500">ขายแล้ว {formatTHB(soldCount)}</span>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 line-through">฿{formatTHB(originalPrice)}</span>
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-semibold">-{discountPercent}%</span>
            </div>
            <div className="text-lg font-bold text-orange-600 flex items-center">
              <span className="text-sm mr-0.5">฿</span>
              {formatTHB(product.price)}
            </div>
          </div>
          {soldCount > 1000 && (
            <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
              <Zap className="w-3 h-3" />
              <span className="font-semibold">Hot</span>
            </div>
          )}
        </div>
      </div>

      {/* In cart indicator */}
      {inCart && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2">
          <span className="px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
            ✓ อยู่ในตะกร้า
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
    <div className="min-h-screen bg-white">
      {/* Enhanced sticky header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200 shadow-sm">
        <Header user={username} />
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/seller" className="text-orange-600 hover:text-orange-700 font-semibold text-sm flex items-center gap-1 hover:underline">
              <Gift className="w-4 h-4" /> ขายสินค้า
            </Link>
            <span className="text-slate-300">|</span>
            <Link href="/orders" className="text-slate-600 hover:text-orange-600 font-medium text-sm hover:underline">
              ติดตามคำสั่งซื้อ
            </Link>
          </div>
          <div className="text-sm text-slate-500">
            สินค้า {formatTHB(products.length)} รายการ
          </div>
        </div>
      </div>

      {/* Enhanced banners */}
      <div className="relative">
        {bannerImages?.length > 0 ? (
          <Banner images={bannerImages.filter((b) => !b.isSmall)} />
        ) : (
          <FullScreenBanner />
        )}
      </div>

      {/* Enhanced search and filters */}
      <section className="max-w-7xl mx-auto mt-8 px-4">
        <div className="bg-slate-50 rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Search */}
            <div className="lg:col-span-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ค้นหาสินค้า แบรนด์ และร้านค้า"
                  className="w-full h-12 pl-12 pr-12 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                  aria-label="ค้นหาสินค้า"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    <X className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Sort and Cart */}
            <div className="lg:col-span-4 flex gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="popular">เรียงตาม: ความนิยม</option>
                <option value="price_asc">ราคา: น้อย → มาก</option>
                <option value="price_desc">ราคา: มาก → น้อย</option>
              </select>
              
              <Link
                href="/checkout"
                className="inline-flex items-center gap-2 h-12 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-red-600 transition-all"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="hidden sm:inline">ตะกร้า</span>
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{cart.length}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced categories */}
      <div className="mt-8">
        {loadingCats ? (
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-white border border-slate-200 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <CategoryMenu categories={categories} selected={selectedCategory} onSelect={setSelectedCategory} />
        )}
      </div>

      {/* Enhanced main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-800">สินค้าแนะนำ</h1>
              {selectedCategory && (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                  {selectedCategory}
                </span>
              )}
            </div>
            <div className="text-sm text-slate-500">
              {filtered.length > 0 && `${formatTHB(filtered.length)} รายการ`}
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyMessage 
              title="ไม่พบสินค้าที่ต้องการ" 
              subtitle="ลองเปลี่ยนคำค้นหาหรือดูหมวดหมู่อื่น ๆ" 
            />
          ) : (
            <motion.div 
              layout 
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            >
              {filtered.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <ProductCard
                    product={product}
                    inCart={!!cart.find((p) => p._id === product._id)}
                    onAddToCart={addToCart}
                    onClick={() => router.push(`/product/${product._id}`)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>

        {/* Enhanced recommendations */}
        {products.length > 10 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <ProductRecommendations products={products.slice(8, 16)} title="สินค้าที่คุณอาจสนใจ" />
          </motion.div>
        )}
      </main>

      {/* Enhanced floating cart */}
      <Link
        href="/checkout"
        className="fixed md:hidden bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40"
        aria-label="ไปที่ตะกร้าสินค้า"
      >
        <ShoppingCart className="w-6 h-6" />
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
            {cart.length > 99 ? '99+' : cart.length}
          </span>
        )}
      </Link>
    </div>
  )
}
        