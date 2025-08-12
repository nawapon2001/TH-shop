'use client'
import React, { useMemo, useState } from 'react'
import Header from '../../components/Header'
import { Mail, Lock, User, Calendar, ChevronDown, Eye, EyeOff, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [memberType, setMemberType] = useState<'ร้านค้า' | 'ตัวแทนจำหน่าย' | 'ลูกค้าทั่วไป'>('ลูกค้าทั่วไป')

  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const emailValid = useMemo(() => /\S+@\S+\.\S+/.test(email.trim()), [email])
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

    // touch all for showing inline errors
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
        // รีเซ็ตฟอร์ม
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setFullName('')
        setBirthDate('')
        setMemberType('ลูกค้าทั่วไป')
        setTouched({})
      }
    } catch {
      setError('เกิดข้อผิดพลาดที่เซิร์ฟเวอร์')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <Header />
      <main className="px-4 py-8">
        <div className="max-w-md mx-auto">
          <div className="rounded-2xl border border-orange-200 bg-white/90 backdrop-blur shadow-xl p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-orange-700 text-center">สมัครสมาชิก</h1>
            <p className="text-center text-slate-600 mt-1 mb-6">สร้างบัญชีเพื่อเริ่มช้อปปิ้งกับเรา</p>

            <form onSubmit={handleSubmit} className="grid gap-4">
              {/* Full name */}
              <Field
                label="ชื่อ-นามสกุล"
                icon={<User className="w-4 h-4 text-orange-700" />}
                value={fullName}
                onChange={setFullName}
                placeholder="เช่น สมชาย ใจดี"
                error={touched.fullName && !fullName.trim() ? 'กรุณากรอกชื่อ-นามสกุล' : ''}
                onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
              />

              {/* Birth date */}
              <Field
                label="วันเดือนปีเกิด (ไม่บังคับ)"
                type="date"
                icon={<Calendar className="w-4 h-4 text-orange-700" />}
                value={birthDate}
                onChange={setBirthDate}
                placeholder=""
              />

              {/* Member type */}
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-800">ประเภทสมาชิก</label>
                <div className="relative">
                  <select
                    value={memberType}
                    onChange={(e) => setMemberType(e.target.value as any)}
                    className="w-full h-11 rounded-xl border border-orange-200 bg-white pl-3 pr-9 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="ร้านค้า">ร้านค้า</option>
                    <option value="ตัวแทนจำหน่าย">ตัวแทนจำหน่าย</option>
                    <option value="ลูกค้าทั่วไป">ลูกค้าทั่วไป</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-orange-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Email */}
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

              {/* Password */}
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
                  <button type="button" className="text-slate-600" onClick={() => setShowPw((s) => !s)}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
              />

              {/* Strength meter */}
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

              {/* Confirm Password */}
              <Field
                label="ยืนยันรหัสผ่าน"
                type={showPw2 ? 'text' : 'password'}
                icon={<Lock className="w-4 h-4 text-orange-700" />}
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="••••••••"
                error={
                  touched.confirmPassword && confirmPassword !== password ? 'รหัสผ่านและยืนยันไม่ตรงกัน' : ''
                }
                onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                trailing={
                  <button type="button" className="text-slate-600" onClick={() => setShowPw2((s) => !s)}>
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
          </div>
        </div>
      </main>
    </div>
  )
}

/* ---------- Reusable field ---------- */
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
