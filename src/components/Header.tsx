'use client'

import React from 'react'
import Link from 'next/link'
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
} from 'lucide-react'

export type UserProfile = {
  name: string
  address: string
  phone: string
  paymentType: 'deposit' | 'full'
}

export default function Header({ user }: { user?: string | null }) {
  const [currentUser, setCurrentUser] = React.useState<string | null>(user ?? null)
  const [profile, setProfile] = React.useState<UserProfile | null>(null)
  const [cartCount, setCartCount] = React.useState(0)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [profileOpen, setProfileOpen] = React.useState(false)

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

  React.useEffect(() => {
    const readCart = () => {
      try {
        const raw = localStorage.getItem('cart')
        if (!raw) return setCartCount(0)
        const arr = JSON.parse(raw)
        setCartCount(Array.isArray(arr) ? arr.length : 0)
      } catch {
        setCartCount(0)
      }
    }
    readCart()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cart') readCart()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
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
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
  }, [currentUser, profile])

  return (
    <header className="sticky top-0 z-50">
      {/* Accent bar (คงไว้ได้) */}
      <div className="h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-pink-400" />

      {/* Main bar — เปลี่ยนพื้นหลังเป็นสีส้ม */}
      <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-400 text-white shadow">
        <div className="max-w-6xl mx-auto px-3 md:px-4">
          <div className="h-16 flex items-center justify-between gap-3">
            {/* Left: Brand */}
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 text-white font-black shadow-sm">
                  P
                </span>
                <span className="text-xl font-extrabold tracking-tight text-white hidden sm:block">
                  PAYMUNGTAK
                </span>
              </Link>
            </div>

            {/* Center: Nav (desktop) */}
            <nav className="hidden md:flex items-center gap-2">
              <HeaderLink href="/" icon={<Home className="w-4 h-4" />}>หน้าแรก</HeaderLink>
              <HeaderLink href="/cart" icon={<ShoppingCart className="w-4 h-4" />} badge={cartCount}>
                ตะกร้า
              </HeaderLink>
              {currentUser && (
                <HeaderLink href="/profile" icon={<User className="w-4 h-4" />}>โปรไฟล์</HeaderLink>
              )}
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Search (chip สีขาว ตัดกับพื้นหลังส้ม) */}
              <button
                className="hidden sm:inline-flex items-center justify-center w-10 h-10 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 text-orange-800"
                aria-label="ค้นหา"
                title="ค้นหา"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Auth area */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen((s) => !s)}
                    className="inline-flex items-center gap-2 pl-2 pr-3 h-10 rounded-full bg-white border border-orange-200 shadow-sm hover:bg-orange-50"
                    aria-haspopup="menu"
                    aria-expanded={profileOpen}
                    title="บัญชีผู้ใช้"
                  >
                    <span className="w-7 h-7 rounded-full bg-orange-600 text-white grid place-items-center text-xs font-bold">
                      {initials}
                    </span>
                    <span className="hidden sm:inline text-orange-900 max-w-[120px] truncate">
                      {profile?.name || currentUser}
                    </span>
                  </button>

                  {profileOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white border border-orange-200 rounded-2xl shadow-lg p-2 z-50"
                      role="menu"
                    >
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-orange-50 text-orange-900"
                        onClick={() => setProfileOpen(false)}
                      >
                        <User className="w-4 h-4" /> ดูโปรไฟล์
                      </Link>
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-orange-50 text-red-600"
                      >
                        <LogOut className="w-4 h-4" /> ออกจากระบบ
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <HeaderButton href="/login" icon={<LogIn className="w-4 h-4" />}>เข้าสู่ระบบ</HeaderButton>
                  <HeaderButton href="/register" icon={<UserPlus className="w-4 h-4" />}>สมัคร</HeaderButton>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 text-orange-800"
                aria-label="เมนู"
                onClick={() => setMobileOpen((s) => !s)}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sheet (ให้พื้นหลังขาวเพื่อความอ่านง่าย) */}
      {mobileOpen && (
        <div className="md:hidden border-b border-orange-100 bg-white/95 backdrop-blur">
          <div className="max-w-6xl mx-auto px-3 py-3 grid gap-2">
            <HeaderLinkMobile href="/" icon={<Home className="w-4 h-4" />}>หน้าแรก</HeaderLinkMobile>
            <HeaderLinkMobile href="/cart" icon={<ShoppingCart className="w-4 h-4" />} badge={cartCount}>
              ตะกร้า
            </HeaderLinkMobile>
            {currentUser ? (
              <>
                <HeaderLinkMobile href="/profile" icon={<User className="w-4 h-4" />}>โปรไฟล์</HeaderLinkMobile>
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 text-red-600"
                >
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
        </div>
      )}
    </header>
  )
}

/* ----------------------------- Subcomponents ----------------------------- */
function HeaderLink({ href, icon, children, badge }: { href: string; icon: React.ReactNode; children: React.ReactNode; badge?: number }) {
  return (
    <Link
      href={href}
      className="relative inline-flex items-center gap-2 px-3 h-10 rounded-full bg-white text-orange-800 font-medium border border-orange-200 shadow-sm hover:bg-orange-50"
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
      {typeof badge === 'number' && badge > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] grid place-items-center text-[11px] rounded-full bg-orange-600 text-white px-1">
          {badge}
        </span>
      )}
    </Link>
  )
}

function HeaderButton({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 px-3 h-10 rounded-full bg-white text-orange-800 font-semibold border border-orange-200 shadow-sm hover:bg-orange-50"
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </Link>
  )
}

function HeaderLinkMobile({ href, icon, children, badge }: { href: string; icon: React.ReactNode; children: React.ReactNode; badge?: number }) {
  return (
    <Link
      href={href}
      className="relative flex items-center gap-2 px-3 py-2 rounded-xl border border-orange-200 bg-white hover:bg-orange-50 text-orange-900"
    >
      {icon}
      <span>{children}</span>
      {typeof badge === 'number' && badge > 0 && (
        <span className="ml-auto min-w-[18px] h-[18px] grid place-items-center text-[11px] rounded-full bg-orange-600 text-white px-1">
          {badge}
        </span>
      )}
    </Link>
  )
}
