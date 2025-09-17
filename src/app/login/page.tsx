'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../../components/Header'
import {
  Mail, Lock, Eye, EyeOff, Loader2, LogIn, ArrowRight, ShieldCheck
} from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(false)
  const router = useRouter()

  // Update document title
  useEffect(() => {
    document.title = 'เข้าสู่ระบบ | TH-THAI SHOP'
  }, [])

  const emailValid = useMemo(() => /\S+@\S+\.\S+/.test(email.trim()), [email])
  const canSubmit = emailValid && password.length > 0 && !loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setLoading(true)
    try {
      // ลองเรียก API ก่อน
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok && data.user) {
        const displayName = data.user.fullName || data.user.email || email.trim()
        setUser(displayName)

        // เก็บไว้ใน localStorage
        try { 
          localStorage.setItem('user', displayName)
          localStorage.setItem('currentUserEmail', email.trim())
          localStorage.setItem('userEmail', email.trim())
        } catch {}

        // Check for return URL
        const urlParams = new URLSearchParams(window.location.search)
        const returnUrl = urlParams.get('returnUrl')
        
        if (returnUrl) {
          router.push(returnUrl)
        } else {
          router.push(`/?username=${encodeURIComponent(displayName)}`)
        }
      } else if (res.status === 404) {
        // ถ้าไม่มี API ให้ทำ simple login
        const displayName = email.trim()
        setUser(displayName)

        // เก็บไว้ใน localStorage  
        try { 
          localStorage.setItem('user', displayName)
          localStorage.setItem('currentUserEmail', email.trim())
          localStorage.setItem('userEmail', email.trim())
        } catch {}

        // Check for return URL
        const urlParams = new URLSearchParams(window.location.search)
        const returnUrl = urlParams.get('returnUrl')
        
        if (returnUrl) {
          router.push(returnUrl)
        } else {
          router.push(`/?username=${encodeURIComponent(displayName)}`)
        }
      } else {
        setError(data?.message || 'เข้าสู่ระบบไม่สำเร็จ')
      }
    } catch {
      // ในกรณี error ให้ทำ simple login
      const displayName = email.trim()
      setUser(displayName)

      try { 
        localStorage.setItem('user', displayName)
        localStorage.setItem('currentUserEmail', email.trim())
        localStorage.setItem('userEmail', email.trim())
      } catch {}

      const urlParams = new URLSearchParams(window.location.search)
      const returnUrl = urlParams.get('returnUrl')
      
      if (returnUrl) {
        router.push(returnUrl)
      } else {
        router.push(`/?username=${encodeURIComponent(displayName)}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* ภาพพื้นหลังเบลอ */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage: 'url("/customerRegis.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(8px)',
        }}
      />
      {/* Floating decor */}
      <div className="pointer-events-none absolute -top-20 -right-28 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-12 h-80 w-80 rounded-full bg-amber-200/50 blur-3xl" />

      <Header user={user} />

      <main className="px-4 py-10">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          {/* Left promo */}
          <section className="hidden lg:block">
            <div className="relative h-full rounded-3xl border border-orange-200 bg-white/70 backdrop-blur p-8 shadow-xl">
              <div className="flex items-center gap-3 text-orange-700 font-extrabold text-2xl">
                <ShieldCheck className="w-7 h-7" />
                TH-THAI Account
              </div>
              <p className="mt-2 text-slate-600">
                เข้าสู่ระบบเพื่อช้อปง่าย จ่ายสะดวก จัดส่งไว พร้อมสิทธิพิเศษเฉพาะสมาชิก
              </p>

              <div className="mt-8 grid gap-4">
                <Feature
                  title="ปลอดภัยเป็นอันดับแรก"
                  desc="เข้ารหัสข้อมูลและตรวจสอบความปลอดภัยทุกขั้นตอน"
                />
                <Feature
                  title="รวดเร็วไม่สะดุด"
                  desc="เข้าสู่ระบบและชำระเงินได้ในไม่กี่คลิก"
                />
                <Feature
                  title="สิทธิพิเศษสมาชิก"
                  desc="สะสมแต้ม รับคูปอง และดีลเฉพาะคุณ"
                />
              </div>

              <div className="mt-10 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-white p-6 shadow-lg">
                <div className="text-lg font-bold">ยังไม่มีบัญชี?</div>
                <p className="text-white/90 text-sm mt-1">
                  สมัครฟรี ใช้เวลาไม่ถึง 1 นาที!
                </p>
                <a
                  href="/register"
                  className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-orange-700 font-semibold hover:bg-white transition"
                >
                  สมัครสมาชิก <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </section>

          {/* Right card (form) */}
          <section className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-orange-200 bg-white/90 backdrop-blur p-8 shadow-2xl">
              <div className="flex flex-col items-center mb-6">
                <div className="grid place-items-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-lg">
                  <LogIn className="w-7 h-7" />
                </div>
                <h2 className="mt-3 text-2xl font-extrabold text-orange-700">เข้าสู่ระบบ</h2>
                <p className="text-sm text-slate-600">กรุณากรอกอีเมลและรหัสผ่านของคุณ</p>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {!user ? (
                <form onSubmit={handleSubmit} className="grid gap-4">
                  {/* Email */}
                  <Input
                    label="อีเมล"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="name@example.com"
                    icon={<Mail className="w-4 h-4 text-orange-700" />}
                    error={email.length > 0 && !emailValid ? 'อีเมลไม่ถูกต้อง' : ''}
                    autoFocus
                  />

                  {/* Password */}
                  <Input
                    label="รหัสผ่าน"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••"
                    icon={<Lock className="w-4 h-4 text-orange-700" />}
                    trailing={
                      <button
                        type="button"
                        className="text-slate-600"
                        onClick={() => setShowPw(s => !s)}
                        aria-label={showPw ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-1 focus:ring-orange-500"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                      />
                      จดจำฉัน
                    </label>
                    <a href="/forgot-password" className="text-orange-700 hover:underline">
                      ลืมรหัสผ่าน?
                    </a>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className={
                      'mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-full px-4 font-semibold text-white shadow ' +
                      (canSubmit
                        ? 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600'
                        : 'bg-gray-300 cursor-not-allowed')
                    }
                  >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    เข้าสู่ระบบ
                  </button>

                  <p className="text-center text-sm text-slate-600">
                    ยังไม่มีบัญชี?{' '}
                    <a href="/register" className="text-orange-700 font-medium hover:underline">
                      สมัครสมาชิก
                    </a>
                  </p>
                </form>
              ) : (
                <div className="text-center text-green-700 text-lg font-semibold">
                  สวัสดีคุณ {user} 🎉 ยินดีต้อนรับเข้าสู่ระบบ!
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

/* -------------------------- Reusable UI -------------------------- */
function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon,
  trailing,
  error,
  autoFocus,
}: {
  label: string
  type?: React.HTMLInputTypeAttribute
  value: string
  onChange: (v: string) => void
  placeholder?: string
  icon?: React.ReactNode
  trailing?: React.ReactNode
  error?: string
  autoFocus?: boolean
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-800">{label}</label>
      <div
        className={
          'flex h-11 items-center gap-2 rounded-xl border bg-white px-3 shadow-sm focus-within:ring-2 ' +
          (error
            ? 'border-red-300 bg-red-50/40 focus-within:ring-red-200'
            : 'border-orange-200 focus-within:ring-orange-300')
        }
      >
        {icon && <span>{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm"
          autoFocus={autoFocus}
        />
        {trailing}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4 hover:bg-orange-50 transition">
      <div className="text-sm font-semibold text-orange-700">{title}</div>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
    </div>
  )
}
