'use client'

import React, { useMemo, useState, useEffect } from 'react'
import Header from '../../components/Header'
import {
  Mail, Lock, User, Calendar, Eye, EyeOff, Loader2,
  Store, Package, ShieldCheck, Sparkles
} from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [memberType, setMemberType] = useState<'ลูกค้าทั่วไป'>('ลูกค้าทั่วไป')

  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Update document title
  useEffect(() => {
    document.title = 'สมัครสมาชิก | TH-THAI SHOP'
  }, [])
  const pwStrength = useMemo(() => {
    const v = password
    let score = 0
    if (v.length >= 8) score++
    if (/[A-Z]/.test(v)) score++
    if (/[0-9]/.test(v)) score++
    if (/[^A-Za-z0-9]/.test(v)) score++
    return score // 0-4
  }, [password])

  const canSubmit =
    fullName.trim().length > 0 &&
    emailValid &&
    password.length >= 8 &&
    password === confirmPassword &&
    !loading

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    })

    if (!canSubmit) return

    try {
      setLoading(true)
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          birthDate,
          memberType,
          email,
          password,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.message || 'เกิดข้อผิดพลาด')
      } else {
        setMessage(data?.message || 'สมัครสมาชิกสำเร็จ')
        // reset
        setEmail(''); setPassword(''); setConfirmPassword('')
        setFullName(''); setBirthDate(''); setMemberType('ลูกค้าทั่วไป')
        setTouched({})
      }
    } catch {
      setError('เกิดข้อผิดพลาดที่เซิร์ฟเวอร์')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: 'url("/customerRegis.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Header />

      <main className="px-4 py-10">
        <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[1fr_460px] items-start">
          {/* LEFT — Hero / Value props */}
          <section className="hidden lg:block">
            <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur border border-orange-200 shadow-xl p-10">
              {/* soft glow */}
              <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-orange-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-amber-300/20 blur-3xl" />

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-orange-500/10 to-amber-400/10 text-orange-700 border border-orange-200">
                <Sparkles className="w-4 h-4" /> สมัครสมาชิกใหม่
              </div>

              <h1 className="mt-4 text-5xl font-black tracking-tight text-orange-800 leading-tight">
                เริ่มช้อปกับ <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">TH-THAI</span>
              </h1>
              <p className="mt-3 text-lg text-orange-900/80">
                สมัครง่าย ไม่กี่ขั้นตอน • ข้อมูลปลอดภัย • ใช้งานสะดวกทั้งมือถือ/คอม
              </p>

              {/* value props */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ValueCard
                  icon={<ShieldCheck className="w-5 h-5" />}
                  title="ปลอดภัย"
                  desc="เข้ารหัสข้อมูล & HTTPS"
                />
                <ValueCard
                  icon={<Package className="w-5 h-5" />}
                  title="สั่งง่าย"
                  desc="จัดส่งไว ติดตามสถานะได้"
                />
                <ValueCard
                  icon={<Store className="w-5 h-5" />}
                  title="ดีลเพียบ"
                  desc="โปรสมาชิกสุดคุ้ม"
                />
              </div>

              <ul className="mt-6 space-y-2 text-sm text-slate-700">
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500" /> สมัครฟรี ไม่มีค่าแรกเข้า</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500" /> เก็บแต้ม & คูปองส่วนลดสำหรับสมาชิก</li>
                <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500" /> ศูนย์ช่วยเหลือดูแลหลังการขาย</li>
              </ul>
            </div>
          </section>

          {/* RIGHT — Form card */}
          <section>
            <div className="rounded-2xl border border-orange-200 bg-white/95 backdrop-blur shadow-2xl p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-orange-700 text-center">สมัครสมาชิก</h2>
              <p className="text-center text-slate-600 mt-1 mb-6">ใช้เวลาไม่ถึง 1 นาที</p>

              {/* segmented member type */}
              <MemberTypePicker value={memberType} onChange={setMemberType} />

              <form onSubmit={handleSubmit} className="grid gap-4 mt-4">
                <Field
                  label="ชื่อ-นามสกุล"
                  icon={<User className="w-4 h-4 text-orange-700" />}
                  value={fullName}
                  onChange={setFullName}
                  placeholder="เช่น สมชาย ใจดี"
                  error={touched.fullName && !fullName.trim() ? 'กรุณากรอกชื่อ-นามสกุล' : ''}
                  onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                />

                <Field
                  label="วันเดือนปีเกิด (ไม่บังคับ)"
                  type="date"
                  icon={<Calendar className="w-4 h-4 text-orange-700" />}
                  value={birthDate}
                  onChange={setBirthDate}
                  placeholder=""
                />

                <Field
                  label="อีเมล"
                  type="email"
                  icon={<Mail className="w-4 h-4 text-orange-700" />}
                  value={email}
                  onChange={setEmail}
                  placeholder="name@example.com"
                  error={touched.email && !emailValid ? 'อีเมลไม่ถูกต้อง' : ''}
                  onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                />

                <Field
                  label="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)"
                  type={showPw ? 'text' : 'password'}
                  icon={<Lock className="w-4 h-4 text-orange-700" />}
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  error={touched.password && password.length < 8 ? 'รหัสผ่านสั้นเกินไป' : ''}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  trailing={
                    <button type="button" className="text-slate-600" onClick={() => setShowPw((s) => !s)} aria-label="toggle password">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                {/* strength meter */}
                <div className="space-y-1 -mt-2">
                  <div className="h-1.5 rounded-full bg-orange-100 overflow-hidden">
                    <div
                      className={
                        'h-full transition-all ' +
                        (pwStrength <= 1
                          ? 'bg-red-400 w-1/4'
                          : pwStrength === 2
                          ? 'bg-yellow-400 w-2/4'
                          : pwStrength === 3
                          ? 'bg-amber-500 w-3/4'
                          : 'bg-green-500 w-full')
                      }
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    ความแข็งแรงรหัสผ่าน: {['อ่อน', 'อ่อน', 'ปานกลาง', 'ดี', 'ดีมาก'][pwStrength]}
                  </p>
                </div>

                <Field
                  label="ยืนยันรหัสผ่าน"
                  type={showPw2 ? 'text' : 'password'}
                  icon={<Lock className="w-4 h-4 text-orange-700" />}
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="••••••••"
                  error={touched.confirmPassword && confirmPassword !== password ? 'รหัสผ่านและยืนยันไม่ตรงกัน' : ''}
                  onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                  trailing={
                    <button type="button" className="text-slate-600" onClick={() => setShowPw2((s) => !s)} aria-label="toggle confirm password">
                      {showPw2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={
                    'mt-2 h-11 rounded-full text-white font-semibold shadow inline-flex items-center justify-center gap-2 ' +
                    (canSubmit
                      ? 'bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600'
                      : 'bg-gray-300 cursor-not-allowed')
                  }
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  สมัครสมาชิก
                </button>

                <p className="text-center text-sm text-slate-600">
                  มีบัญชีแล้ว?{' '}
                  <Link href="/login" className="text-orange-700 font-medium hover:underline">
                    เข้าสู่ระบบ
                  </Link>
                </p>
              </form>

              {error && (
                <div className="mt-4 text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm">
                  {error}
                </div>
              )}
              {message && (
                <div className="mt-4 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-sm">
                  {message}
                </div>
              )}

              {/* trust bar */}
              <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl border border-orange-200 bg-orange-50/40 px-3 py-2 inline-flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-700" /> ข้อมูลปลอดภัย
                </div>
                <div className="rounded-xl border border-orange-200 bg-orange-50/40 px-3 py-2 inline-flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-700" /> สมัครฟรี ไม่มีค่าแรกเข้า
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

/* ---------- ValueCard Component ---------- */
function ValueCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50/60 px-4 py-3 flex flex-col items-start gap-2 shadow-sm">
      <div className="flex items-center gap-2 text-orange-700 font-bold">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-xs text-slate-700">{desc}</div>
    </div>
  )
}

/* ---------- Segmented MemberType Picker ---------- */
function MemberTypePicker({
  value,
  onChange,
}: {
  value: 'ลูกค้าทั่วไป'
  onChange: (v: 'ลูกค้าทั่วไป') => void
}) {
  // เหลือเฉพาะลูกค้าทั่วไป
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-800">ประเภทสมาชิก</label>
      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={() => onChange('ลูกค้าทั่วไป')}
          aria-pressed={true}
          className="h-10 rounded-xl border text-sm font-semibold inline-flex items-center justify-center gap-2 bg-orange-600 text-white border-orange-600 shadow"
        >
          <User className="w-4 h-4" /> ลูกค้าทั่วไป
        </button>
      </div>
    </div>
  )
}

/* ---------- Reusable Field ---------- */
function Field({
  label,
  type = 'text',
  icon,
  value,
  onChange,
  placeholder,
  error,
  trailing,
  onBlur,
}: {
  label: string
  type?: React.HTMLInputTypeAttribute
  icon?: React.ReactNode
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
  trailing?: React.ReactNode
  onBlur?: () => void
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
        {icon && <span>{icon}</span>}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm"
        />
        {trailing}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

