'use client'

import React from 'react'
import { CartManager } from '@/lib/cart-utils'
import Link from 'next/link'
import { isSellerLoggedIn } from '@/lib/seller-auth'
import {
  ShoppingCart,
  User,
  Home,
  LogIn,
  UserPlus,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Package,
  Heart,
} from 'lucide-react'

export type UserProfile = {
  name: string
  address: string
  phone: string
  paymentType: 'deposit' | 'full'
}

// Shopee-like Sticky Header with Search + Category Bar + Compact Topbar
export default function Header({ user }: { user?: string | null }) {
  const [currentUser, setCurrentUser] = React.useState<string | null>(user ?? null)
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const [cartCount, setCartCount] = React.useState(0)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [profileOpen, setProfileOpen] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [cartOpen, setCartOpen] = React.useState(false)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [q, setQ] = React.useState('')

  const categoryRef = React.useRef<HTMLDivElement | null>(null)
  const profileRef = React.useRef<HTMLDivElement | null>(null)
  const cartRef = React.useRef<HTMLDivElement | null>(null)
  const searchRef = React.useRef<HTMLDivElement | null>(null)

  // ---- Load user + profile from localStorage ----
  React.useEffect(() => {
    if (user) {
      setCurrentUser(user)
      if (typeof window !== 'undefined') localStorage.setItem('user', user)
    } else if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user')
      if (storedUser) setCurrentUser(storedUser)
    }

    if (typeof window !== 'undefined') {
      const storedProfile = localStorage.getItem('userProfile')
      if (storedProfile) setProfile(JSON.parse(storedProfile))
    }
  }, [user])

  // ---- Cart counter + listen to changes (use canonical CartManager) ----
  React.useEffect(() => {
    const readCart = () => {
      try {
        const arr = CartManager.getCart()
        setCartCount(Array.isArray(arr) ? arr.length : 0)
      } catch {
        setCartCount(0)
      }
    }
    readCart()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cart_v2' || e.key === 'cart') readCart()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // ---- Click outside to close popovers ----
  React.useEffect(() => {
    function onClick(e: MouseEvent) {
      const t = e.target as Node
      if (profileRef.current && !profileRef.current.contains(t)) setProfileOpen(false)
      if (categoryRef.current && !categoryRef.current.contains(t)) setMenuOpen(false)
      if (cartRef.current && !cartRef.current.contains(t)) setCartOpen(false)
      if (searchRef.current && !searchRef.current.contains(t)) setSearchOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const signOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user')
      setCurrentUser(null)
      setProfile(null)
      window.location.href = '/'
    }
  }

  const initials = React.useMemo(() => {
    if (!currentUser) return 'U'
    const name = profile?.name || currentUser
    return name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [currentUser, profile])

  // When clicking the Seller Center link: if the visitor is a seller, go to manage;
  // if they're a normal logged-in user or not logged in, go to seller auth (login)
  const handleSellerCenterClick = (e: React.MouseEvent) => {
    e.preventDefault()
    try {
      if (typeof window === 'undefined') return
      if (isSellerLoggedIn()) {
        window.location.href = '/seller/manage'
        return
      }
      const normalUser = localStorage.getItem('user')
      if (normalUser) {
        window.location.href = '/seller/auth'
        return
      }
      window.location.href = '/seller/auth'
    } catch {
      window.location.href = '/seller/auth'
    }
  }

  const hotKeywords = [
    'iPhone 16',
    'เคสโทรศัพท์',
    'หูฟังไร้สาย',
    'กระเป๋าแฟชั่น',
    'คีย์บอร์ดเกมมิ่ง',
  ]

  const categories = [
    { name: 'มือถือ & แท็บเล็ต', href: '/c/mobile' },
    { name: 'คอมพิวเตอร์ & เกมมิ่ง', href: '/c/computer' },
    { name: 'แฟชั่นผู้หญิง', href: '/c/women' },
    { name: 'แฟชั่นผู้ชาย', href: '/c/men' },
    { name: 'ความงาม & สุขภาพ', href: '/c/beauty' },
    { name: 'บ้าน & ไลฟ์สไตล์', href: '/c/home' },
    { name: 'ซูเปอร์มาร์เก็ต', href: '/c/supermarket' },
    { name: 'อิเล็กทรอนิกส์', href: '/c/electronics' },
    { name: 'กีฬา & กลางแจ้ง', href: '/c/sport' },
  ]

  const cartItems = React.useMemo(() => {
    try {
      const arr = CartManager.getCart()
      if (!Array.isArray(arr)) return [] as any[]
      // Normalize basic fields
      return arr.slice(0, 5).map((it: any, idx: number) => ({
        id: it._id ?? idx,
        name: it.name ?? 'สินค้า',
        price: it.price ?? 0,
        qty: it.quantity ?? it.qty ?? 1,
        image: (it.images && it.images[0]) || it.image || 'https://picsum.photos/seed/cart/80/80',
      }))
    } catch {
      return [] as any[]
    }
  }, [cartOpen, cartCount])

  return (
    <header className="sticky top-0 z-50">
      {/* Top micro-bar */}
      <div className="bg-[#f05d40] text-white/90 text-xs">
        <div className="max-w-6xl mx-auto px-3 md:px-4 flex items-center justify-between h-9">
          <div className="flex items-center gap-3">
            <a href="/seller/manage" onClick={handleSellerCenterClick} className="hover:text-white/100">ศูนย์ผู้ขาย</a>
            <span className="opacity-60">|</span>
            <Link href="/admin" className="hover:text-white/100" onClick={e => { e.preventDefault(); window.location.href = '/admin'; }}>ผู้ดูแลระบบ</Link>
            <span className="hidden sm:inline opacity-60">|</span>
            <Link href="/follow" className="hidden sm:inline hover:text-white/100">ติดตามเรา</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/notifications" className="inline-flex items-center gap-1 hover:text-white/100">
              <Bell className="w-3.5 h-3.5" /> การแจ้งเตือน
            </Link>
            <Link href="/help" className="inline-flex items-center gap-1 hover:text-white/100">
              <HelpCircle className="w-3.5 h-3.5" /> ช่วยเหลือ
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="bg-gradient-to-r from-[#ee4d2d] via-[#f05d40] to-[#ff8a4c] text-white shadow">
        <div className="max-w-6xl mx-auto px-3 md:px-4">
          <div className="h-20 md:h-24 flex items-center gap-3">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <span className="grid place-items-center w-11 h-11 rounded-2xl bg-white/10 ring-1 ring-white/20 text-white font-black shadow-sm">
                T
              </span>
              <span className="text-2xl font-extrabold tracking-tight hidden sm:block">TH-THAI</span>
            </Link>

            {/* Search */}
            <div ref={searchRef} className="flex-1">
              <div className="relative">
                <div className="flex items-stretch bg-white rounded-full overflow-hidden shadow-sm ring-1 ring-black/5">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="ค้นหาสินค้า แบรนด์ และร้านค้า"
                    className="flex-1 h-11 md:h-12 px-4 text-sm md:text-base text-neutral-800 placeholder:text-neutral-400 outline-none"
                  />
                  <Link
                    href={q ? `/search?q=${encodeURIComponent(q)}` : '#'}
                    className="grid place-items-center w-12 md:w-14 rounded-l-none bg-[#fb5533] hover:brightness-95 active:brightness-90"
                    aria-label="ค้นหา"
                  >
                    <Search className="w-5 h-5" />
                  </Link>
                </div>

                {/* Hot keywords */}
                <div className="hidden md:flex gap-2 mt-2 pl-1">
                  {hotKeywords.map((k) => (
                    <Link
                      key={k}
                      href={`/search?q=${encodeURIComponent(k)}`}
                      className="text-[11px] px-2 py-1 rounded-full bg-white/15 hover:bg-white/25"
                    >
                      {k}
                    </Link>
                  ))}
                </div>

                {/* Suggestion dropdown */}
                {searchOpen && (
                  <div className="absolute left-0 right-0 mt-2 bg-white text-neutral-800 rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
                    <div className="px-3 py-2 text-xs text-neutral-500">คำแนะนำการค้นหา</div>
                    <ul className="max-h-64 overflow-auto">
                      {[q, ...hotKeywords].filter(Boolean).slice(0, 6).map((s, idx) => (
                        <li key={idx}>
                          <Link
                            href={`/search?q=${encodeURIComponent(s!)}`}
                            className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-50"
                            onClick={() => setSearchOpen(false)}
                          >
                            <Search className="w-4 h-4 text-neutral-400" />
                            <span className="truncate">{s}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Cart + User */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Cart */}
              <div ref={cartRef} className="relative">
                <button
                  onClick={() => setCartOpen((s) => !s)}
                  className="relative grid place-items-center w-11 h-11 rounded-2xl bg-white/10 ring-1 ring-white/20 hover:bg-white/15"
                  aria-label="ตะกร้า"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] grid place-items-center text-[10px] rounded-full bg-white text-[#ee4d2d] font-bold px-1">
                      {cartCount}
                    </span>
                  )}
                </button>
                {cartOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white text-neutral-800 rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
                    <div className="px-4 py-2 font-semibold text-sm border-b">สินค้าในตะกร้า</div>
                    {cartItems.length === 0 ? (
                      <div className="p-4 text-sm text-neutral-500">ตะกราว่าง</div>
                    ) : (
                      <ul className="divide-y">
                        {cartItems.map((it) => (
                          <li key={it.id} className="flex items-center gap-3 p-3">
                            <img src={it.image} alt="item" className="w-12 h-12 rounded-lg object-cover" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{it.name}</div>
                              <div className="text-xs text-neutral-500">x{it.qty}</div>
                            </div>
                            <div className="text-sm font-semibold">฿{Number(it.price).toLocaleString()}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="p-3">
                      <Link href="/cart" className="block text-center w-full rounded-xl bg-[#fb5533] hover:brightness-95 text-white py-2 font-semibold">
                        ไปตะกร้า
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile */}
              {currentUser ? (
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen((s) => !s)}
                    className="inline-flex items-center gap-2 pl-2 pr-3 h-11 rounded-2xl bg-white/10 ring-1 ring-white/20 hover:bg-white/15"
                    aria-haspopup="menu"
                    aria-expanded={profileOpen}
                    title="บัญชีผู้ใช้"
                  >
                    <span className="w-8 h-8 rounded-full bg-white text-[#ee4d2d] grid place-items-center text-xs font-extrabold">
                      {initials}
                    </span>
                    <span className="hidden sm:inline max-w-[140px] truncate font-medium">{profile?.name || currentUser}</span>
                    <ChevronDown className="w-4 h-4 hidden md:inline" />
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white text-neutral-800 rounded-2xl shadow-xl ring-1 ring-black/5 p-2 z-50" role="menu">
                      <Link href="/profile" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-50" onClick={() => setProfileOpen(false)}>
                        <User className="w-4 h-4" /> ดูโปรไฟล์
                      </Link>
                      <Link href="/orders" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-50" onClick={() => setProfileOpen(false)}>
                        <Package className="w-4 h-4" /> คำสั่งซื้อของฉัน
                      </Link>
                      <Link href="/wishlist" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-50" onClick={() => setProfileOpen(false)}>
                        <Heart className="w-4 h-4" /> สินค้าที่ถูกใจ
                      </Link>
                      <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-neutral-50 text-red-600">
                        <LogOut className="w-4 h-4" /> ออกจากระบบ
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/login" className="inline-flex items-center gap-2 px-3 h-11 rounded-2xl bg-white/10 ring-1 ring-white/20 hover:bg-white/15 font-medium">
                    <LogIn className="w-4 h-4" /> เข้าสู่ระบบ
                  </Link>
                  <Link href="/register" className="inline-flex items-center gap-2 px-3 h-11 rounded-2xl bg-white text-[#ee4d2d] hover:brightness-95 font-semibold">
                    <UserPlus className="w-4 h-4" /> สมัคร
                  </Link>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                className="md:hidden grid place-items-center w-11 h-11 rounded-2xl bg-white/10 ring-1 ring-white/20 hover:bg-white/15"
                aria-label="เมนู"
                onClick={() => setMobileOpen((s) => !s)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Category bar */}
        <div className="hidden md:block bg-white/10">
          <div className="max-w-6xl mx-auto px-3 md:px-4">
            <div className="flex items-center gap-2 h-12">
              <div ref={categoryRef} className="relative">
                <button
                  onClick={() => setMenuOpen((s) => !s)}
                  className="inline-flex items-center gap-2 px-3 h-9 rounded-full bg-white/15 hover:bg-white/25 ring-1 ring-white/20"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <Menu className="w-4 h-4" /> หมวดหมู่
                  <ChevronDown className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute left-0 mt-2 grid grid-cols-2 gap-2 min-w-[520px] bg-white text-neutral-800 rounded-2xl shadow-xl ring-1 ring-black/5 p-2 z-50">
                    {categories.map((c) => (
                      <Link key={c.name} href={c.href} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-neutral-50">
                        <span>{c.name}</span>
                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                {['ดีลพิเศษ', 'โค้ดส่วนลด', 'คูปองร้านค้า', 'ช้อปแบรนด์', 'ฟรีค่าจัดส่ง'].map((t) => (
                  <Link key={t} href={`/tag/${encodeURIComponent(t)}`} className="px-3 h-9 rounded-full bg-white/0 hover:bg-white/15 grid place-items-center text-sm">
                    {t}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="md:hidden border-b border-orange-100 bg-white">
          <div className="px-3 py-3 grid gap-2">
            {/* Mobile search */}
            <div className="flex items-stretch bg-neutral-100 rounded-xl overflow-hidden ring-1 ring-black/5">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ค้นหาในร้าน"
                className="flex-1 h-11 px-3 text-sm outline-none bg-transparent"
              />
              <Link href={q ? `/search?q=${encodeURIComponent(q)}` : '#'} className="grid place-items-center w-12">
                <Search className="w-5 h-5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <HeaderLinkMobile href="/" icon={<Home className="w-4 h-4" />}>หน้าแรก</HeaderLinkMobile>
              <HeaderLinkMobile href="/cart" icon={<ShoppingCart className="w-4 h-4" />} badge={cartCount}>ตะกร้า</HeaderLinkMobile>
              {currentUser ? (
                <>
                  <HeaderLinkMobile href="/profile" icon={<User className="w-4 h-4" />}>โปรไฟล์</HeaderLinkMobile>
                  <HeaderLinkMobile href="/orders" icon={<Package className="w-4 h-4" />}>คำสั่งซื้อ</HeaderLinkMobile>
                  <button onClick={signOut} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 text-red-600">
                    <LogOut className="w-4 h-4" /> ออกจากระบบ
                  </button>
                </>
              ) : (
                <>
                  <HeaderLinkMobile href="/login" icon={<LogIn className="w-4 h-4" />}>เข้าสู่ระบบ</HeaderLinkMobile>
                  <HeaderLinkMobile href="/register" icon={<UserPlus className="w-4 h-4" />}>สมัคร</HeaderLinkMobile>
                </>
              )}
            </div>

            <div className="pt-1">
              <div className="text-xs text-neutral-500 mb-2">คำค้นหายอดนิยม</div>
              <div className="flex flex-wrap gap-2">
                {hotKeywords.map((k) => (
                  <Link key={k} href={`/search?q=${encodeURIComponent(k)}`} className="px-2 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-sm">
                    {k}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

/* ----------------------------- Subcomponents ----------------------------- */
function HeaderLinkMobile({ href, icon, children, badge }: { href: string; icon: React.ReactNode; children: React.ReactNode; badge?: number }) {
  return (
    <Link href={href} className="relative flex items-center gap-2 px-3 py-2 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 text-orange-900">
      {icon}
      <span>{children}</span>
      {typeof badge === 'number' && badge > 0 && (
        <span className="ml-auto min-w-[18px] h-[18px] grid place-items-center text-[11px] rounded-full bg-[#ee4d2d] text-white px-1">
          {badge}
        </span>
      )}
    </Link>
  )
}
