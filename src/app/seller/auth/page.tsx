'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import {
  PackagePlus, LogIn, UserPlus, Mail, Phone, Store, Calendar,
  MapPin, Eye, EyeOff, Loader2, ShieldCheck, User as UserIcon,
  Lock, ChevronDown, Sparkles, PiggyBank, Smartphone, ArrowRight
} from 'lucide-react'

import { termsText } from '@/constants/termsText'

// รายชื่อ 77 จังหวัดของประเทศไทย
const THAI_PROVINCES = [
  'กรุงเทพมหานคร','กระบี่','กาญจนบุรี','กาฬสินธุ์','กำแพงเพชร','ขอนแก่น','จันทบุรี','ฉะเชิงเทรา',
  'ชัยนาท','ชัยภูมิ','ชุมพร','ชลบุรี','เชียงใหม่','เชียงราย','ตรัง','ตราด','ตาก','นครนายก',
  'นครปฐม','นครพนม','นครราชสีมา','นครศรีธรรมราช','นครสวรรค์','นนทบุรี','นราธิวาส','น่าน',
  'บึงกาฬ','บุรีรัมย์','ปทุมธานี','ประจวบคีรีขันธ์','ปราจีนบุรี','ปัตตานี','พระนครศรีอยุธยา',
  'พังงา','พัทลุง','พิจิตร','พิษณุโลก','เพชรบุรี','เพชรบูรณ์','แพร่','พะเยา','ภูเก็ต','มหาสารคาม',
  'มุกดาหาร','แม่ฮ่องสอน','ยโสธร','ยะลา','ร้อยเอ็ด','ระนอง','ระยอง','ราชบุรี','ลพบุรี','ลำปาง',
  'ลำพูน','เลย','ศรีสะเกษ','สกลนคร','สงขลา','สตูล','สมุทรปราการ','สมุทรสงคราม','สมุทรสาคร',
  'สระแก้ว','สระบุรี','สิงห์บุรี','สุโขทัย','สุพรรณบุรี','สุราษฎร์ธานี','สุรินทร์','หนองคาย',
  'หนองบัวลำภู','อำนาจเจริญ','อุดรธานี','อุตรดิตถ์','อุทัยธานี','อ่างทอง','อุบลราชธานี'
]

export default function SellerAuthPage() {
  const router = useRouter()
  const [sellerUser, setSellerUser] = useState('')
  const [sellerPass, setSellerPass] = useState('')

  // Update document title
  useEffect(() => {
    document.title = 'ลงทะเบียนขาย | TH-THAI SHOP'
  }, [])
  const [confirmPass, setConfirmPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  // สมัครสมาชิก (ย้ายเป็น 2 ขั้นตอน)
  const [step, setStep] = useState<1 | 2>(1)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [shopName, setShopName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [province, setProvince] = useState('')
  const [address, setAddress] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showMore, setShowMore] = useState(false) // พับ/กาง “รายละเอียดเพิ่มเติม”

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setLoading(true)
    try {
      const res = await fetch('/api/seller-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: sellerUser.trim(), password: sellerPass })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
  const msg = err?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
  setAuthError(msg)
  Swal.fire({ icon: 'error', title: 'เข้าสู่ระบบล้มเหลว', text: msg })
        // If API says user not found, guide user to create a shop/register
        if ((err?.message || '').includes('ไม่พบ')) {
          router.push('/seller/create')
          return
        }
      } else {
        const data = await res.json().catch(() => ({}))
        // store username and optional token
        localStorage.setItem('sellerUser', sellerUser.trim())
        if (data?.token) localStorage.setItem('sellerToken', data.token)
        setSellerUser(''); setSellerPass('')
        Swal.fire({ icon: 'success', title: 'เข้าสู่ระบบสำเร็จ', timer: 1200, showConfirmButton: false })
        // If the account has no shop/profile yet, redirect to create-shop page
        if (data?.needsProfile) {
          router.push('/seller/create')
        } else {
          router.push('/seller/manage')
        }
      }
    } catch {
  const msg = 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'
  setAuthError(msg)
  Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: msg })
    } finally {
      setLoading(false)
    }
  }

  const validateStep1 = () => {
    const u = sellerUser.trim()
    const p = sellerPass.trim()
    const c = confirmPass.trim()
    if (!u || !p || !c) { setAuthError('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบ'); return false }
    if (p.length < 6) { setAuthError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return false }
    if (p !== c) { setAuthError('รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน'); return false }
    setAuthError('')
    return true
  }

  const validateStep2 = () => {
    if (!fullName.trim() || !phone.trim() || !shopName.trim()) {
  const msg = 'กรุณากรอก ชื่อ-นามสกุล / เบอร์โทร / ชื่อร้าน ให้ครบ'
  setAuthError(msg)
  Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: msg })
      return false
    }
    if (!acceptTerms) {
  const msg = 'กรุณายอมรับข้อตกลงการใช้งาน'
  setAuthError(msg)
  Swal.fire({ icon: 'warning', title: 'ยอมรับข้อตกลง', text: msg })
      return false
    }
    setAuthError('')
    return true
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    // ตรวจให้ครบสองขั้น
    if (!validateStep1()) { setStep(1); return }
    if (!validateStep2()) { setStep(2); return }

    const payload = {
      username: sellerUser.trim(),
      password: sellerPass.trim(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      shopName: shopName.trim(),
      // เพิ่มเติม (ไม่บังคับ)
      email: email.trim() || undefined,
      birthDate: birthDate.trim() || undefined,
      province: province.trim() || undefined,
      address: address.trim() || undefined,
    }

    setLoading(true)
    try {
      const res = await fetch('/api/seller-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
    const msg = err?.message || 'สมัครไม่สำเร็จ'
    setAuthError(msg)
    Swal.fire({ icon: 'error', title: 'สมัครล้มเหลว', text: msg })
    return
      }

      const data = await res.json().catch(() => ({}))
      // store username and optional token
      localStorage.setItem('sellerUser', payload.username)
      if (data?.token) localStorage.setItem('sellerToken', data.token)
      // also persist the entered profile fields so create-shop page can prefill them
      try {
        const profile = {
          username: payload.username,
          fullName: payload.fullName || '',
          phone: payload.phone || '',
          shopName: payload.shopName || '',
          email: payload.email || '',
          province: payload.province || '',
          address: payload.address || ''
        }
        localStorage.setItem('sellerProfile', JSON.stringify(profile))
      } catch (e) { /* ignore */ }
      // reset
      setSellerUser(''); setSellerPass(''); setConfirmPass('')
      setFullName(''); setEmail(''); setPhone(''); setShopName('')
      setBirthDate(''); setProvince(''); setAddress(''); setAcceptTerms(false)
      setShowMore(false); setStep(1)
      Swal.fire({ icon: 'success', title: 'สมัครสำเร็จ', timer: 1200, showConfirmButton: false })
      router.push('/seller/manage')
    } catch (error) {
    const msg = 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'
    setAuthError(msg)
    Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: msg })
    console.error('Register error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex bg-orange-50"
      style={{
        backgroundImage: 'linear-gradient(115deg, rgba(255,136,0,.08), rgba(255,88,0,.12)), url("/seller-bg.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* ฝั่งซ้าย (Hero) */}
<aside className="hidden lg:flex flex-1 items-center">
  <div className="w-full max-w-2xl mx-12">
    <div className="space-y-6">

      {/* Hero Selling Block */}
      <div className="relative overflow-hidden rounded-3xl bg-white/30 backdrop-blur-xl border border-white/50 shadow-2xl p-10 ring-1 ring-orange-200/40">
        {/* soft glow */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-orange-400/20 blur-3xl" />
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-orange-500/10 to-amber-400/10 text-orange-700 border border-orange-200">
          <ShieldCheck className="w-4 h-4" /> TH-THAI Seller Center
        </div>

        <h1 className="mt-4 text-5xl font-black tracking-tight text-orange-800 leading-tight">
          เริ่มขายกับ <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">TH-THAI</span>
        </h1>
        <p className="mt-3 text-orange-900/80 text-lg">
          สมัครง่าย • ค่าธรรมเนียมเป็นมิตร • ใช้งานสะดวกทั้งมือถือ/คอม
        </p>

        {/* 3 Selling Points */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <FeatureCard
            icon={<Sparkles className="w-5 h-5" />}
            title="สมัครง่าย"
            desc="แค่ 2 ขั้นตอน • ใช้เวลาไม่นาน"
          />
          <FeatureCard
            icon={<PiggyBank className="w-5 h-5" />}
            title="ค่าธรรมเนียมต่ำ"
            desc="จ่ายเมื่อขายได้ • เรทเป็นมิตร"
          />
          <FeatureCard
            icon={<Smartphone className="w-5 h-5" />}
            title="สะดวก"
            desc="จัดการร้านได้ทุกที่ทุกเวลา"
          />
        </div>

        {/* CTA */}
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => { setAuthMode('register'); setStep(1); window?.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="group inline-flex items-center gap-2 h-12 px-6 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold shadow-lg hover:from-orange-700 hover:to-amber-600 transition-all"
          >
            เริ่มสมัครผู้ขาย
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('login'); window?.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className="inline-flex items-center gap-2 h-12 px-6 rounded-full bg-white text-orange-700 font-semibold border border-orange-200 hover:bg-orange-50"
          >
            มีบัญชีแล้ว เข้าสู่ระบบ
          </button>
        </div>

        <p className="mt-3 text-xs text-orange-900/70">
          ไม่มีค่าแรกเข้า • คู่มือเริ่มต้นสำหรับมือใหม่ • ทีมช่วยเหลือพร้อมซัพพอร์ต
        </p>
      </div>

      {/* Quick stats / social proof */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill label="สมัครเร็ว" value="ขั้นตอนสั้น" />
        <StatPill label="ต้นทุนคุ้ม" value="ค่าธรรมเนียมต่ำ" />
        <StatPill label="ใช้งานง่าย" value="รองรับมือถือ" />
      </div>
    </div>
  </div>
</aside>


      {/* Modal ข้อตกลงการใช้งาน */}
      {showTerms && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-2xl border border-orange-200 shadow-2xl max-w-3xl w-full p-8 relative overflow-y-auto max-h-[90vh]">
            <button
              className="absolute top-4 right-4 text-red-600 font-bold text-2xl hover:bg-red-100 rounded-full w-10 h-10 flex items-center justify-center"
              onClick={() => setShowTerms(false)}
              aria-label="ปิดข้อตกลง"
            >×</button>
            <h2 className="text-3xl font-extrabold text-orange-700 mb-6">ข้อตกลงการใช้งานแพลตฟอร์ม TH-THAI</h2>
            <pre className="whitespace-pre-wrap text-base text-slate-800">{termsText}</pre>
          </div>
        </div>
      )}

      {/* กล่องฟอร์มด้านขวา */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* แบรนด์ / แท็บ */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-2">
              <span className="grid place-items-center w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-white font-black shadow-sm">
                T
              </span>
              <span className="text-xl font-extrabold tracking-tight text-orange-800">TH-THAI</span>
            </div>
          </div>

          <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-orange-200 shadow-2xl p-6 ring-1 ring-orange-200/40">
            {/* segmented tab */}
            <div className="mb-6 p-1 bg-orange-50 rounded-full border border-orange-200 flex">
              <button
                className={`flex-1 h-10 rounded-full text-sm font-semibold transition ${
                  authMode === 'login'
                    ? 'bg-white shadow text-orange-700'
                    : 'text-orange-700/70 hover:text-orange-800'
                }`}
                onClick={() => { setAuthMode('login'); setAuthError('') }}
                disabled={authMode === 'login'}
              >
                เข้าสู่ระบบ
              </button>
              <button
                className={`flex-1 h-10 rounded-full text-sm font-semibold transition ${
                  authMode === 'register'
                    ? 'bg-white shadow text-orange-700'
                    : 'text-orange-700/70 hover:text-orange-800'
                }`}
                onClick={() => { setAuthMode('register'); setAuthError('') }}
                disabled={authMode === 'register'}
              >
                สมัครผู้ขาย
              </button>
            </div>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="ชื่อผู้ใช้"
                  value={sellerUser}
                  onChange={setSellerUser}
                  placeholder="username"
                  icon={<UserIcon className="w-4 h-4" />}
                  autoComplete="username"
                  required
                />
                <Input
                  label="รหัสผ่าน"
                  value={sellerPass}
                  onChange={setSellerPass}
                  placeholder="••••••••"
                  type={showPass ? 'text' : 'password'}
                  icon={<Lock className="w-4 h-4" />}
                  autoComplete="current-password"
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPass(s => !s)}
                      className="text-slate-500 hover:text-slate-700"
                      aria-label="สลับการแสดงรหัสผ่าน"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />

                <Button
                  loading={loading}
                  icon={<LogIn className="w-5 h-5" />}
                  text="เข้าสู่ระบบ"
                />
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                {/* Progress (2 ขั้น) */}
                <div className="relative h-2 rounded-full bg-orange-100 overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-600 to-amber-500 transition-all"
                    style={{ width: step === 1 ? '50%' : '100%' }}
                  />
                </div>
                <div className="flex justify-between text-[11px] font-semibold text-orange-800/80">
                  <span>ขั้นที่ 1: บัญชี</span>
                  <span>ขั้นที่ 2: ข้อมูลพื้นฐาน</span>
                </div>

                {/* STEP 1 */}
                {step === 1 && (
                  <div className="space-y-4">
                    <Input
                      label="ชื่อผู้ใช้"
                      value={sellerUser}
                      onChange={setSellerUser}
                      placeholder="ตั้งชื่อผู้ใช้สำหรับล็อกอิน"
                      autoComplete="username"
                      icon={<UserIcon className="w-4 h-4" />}
                      required
                    />
                    <Input
                      label="รหัสผ่าน"
                      value={sellerPass}
                      onChange={setSellerPass}
                      placeholder="อย่างน้อย 6 ตัวอักษร"
                      type={showPass ? 'text' : 'password'}
                      minLength={6}
                      autoComplete="new-password"
                      icon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowPass(s => !s)}
                          className="text-slate-500 hover:text-slate-700"
                          aria-label="สลับการแสดงรหัสผ่าน"
                        >
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                      required
                    />
                    <Input
                      label="ยืนยันรหัสผ่าน"
                      value={confirmPass}
                      onChange={setConfirmPass}
                      placeholder="พิมพ์รหัสผ่านอีกครั้ง"
                      type={showConfirm ? 'text' : 'password'}
                      minLength={6}
                      autoComplete="new-password"
                      icon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowConfirm(s => !s)}
                          className="text-slate-500 hover:text-slate-700"
                          aria-label="สลับการแสดงยืนยันรหัสผ่าน"
                        >
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                      required
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAuthMode('login')}
                        className="h-10 rounded-full border border-orange-200 bg-white text-orange-700 font-semibold hover:bg-orange-50"
                      >
                        กลับไปล็อกอิน
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (validateStep1()) setStep(2) }}
                        className="h-10 rounded-full bg-orange-600 text-white font-semibold hover:bg-orange-700"
                      >
                        ถัดไป
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                  <div className="space-y-4">
                    <Input
                      label="ชื่อ-นามสกุล"
                      value={fullName}
                      onChange={setFullName}
                      placeholder="ชื่อ-นามสกุลจริง"
                      icon={<UserIcon className="w-4 h-4" />}
                      required
                    />
                    <Input
                      label="เบอร์โทรศัพท์"
                      value={phone}
                      onChange={setPhone}
                      type="tel"
                      placeholder="08xxxxxxxx"
                      icon={<Phone className="w-4 h-4" />}
                      required
                    />
                    <Input
                      label="ชื่อร้านค้า"
                      value={shopName}
                      onChange={setShopName}
                      placeholder="เช่น TH-THAI Shop"
                      icon={<Store className="w-4 h-4" />}
                      required
                    />

                    {/* พับเก็บ: รายละเอียดเพิ่มเติม (ไม่บังคับ) */}
                    <div className="rounded-xl border border-orange-200 bg-orange-50/40">
                      <button
                        type="button"
                        onClick={() => setShowMore(s => !s)}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm font-semibold text-orange-800"
                      >
                        รายละเอียดเพิ่มเติม (ไม่บังคับ)
                        <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
                      </button>
                      {showMore && (
                        <div className="px-4 pb-4 pt-1 grid gap-3">
                          <Input
                            label="อีเมล"
                            value={email}
                            onChange={setEmail}
                            type="email"
                            placeholder="you@example.com"
                            autoComplete="email"
                            icon={<Mail className="w-4 h-4" />}
                            required={false}
                          />
                          <Input
                            label="วันเกิด"
                            value={birthDate}
                            onChange={setBirthDate}
                            type="date"
                            icon={<Calendar className="w-4 h-4" />}
                            required={false}
                          />
                          <div>
                            <label className="block text-sm font-semibold text-orange-800/90 mb-1">จังหวัด</label>
                            <div>
                              <select
                                value={province}
                                onChange={(e) => setProvince(e.target.value)}
                                className="w-full h-11 rounded-xl border bg-white/80 backdrop-blur px-3 text-sm outline-none border-orange-200 focus:ring-2 focus:ring-orange-300 focus:border-orange-300"
                              >
                                <option value="">เลือกจังหวัด</option>
                                {THAI_PROVINCES.map((p) => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <Textarea
                            label="ที่อยู่"
                            value={address}
                            onChange={setAddress}
                            placeholder="บ้านเลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
                            required={false}
                          />
                        </div>
                      )}
                    </div>

                    <label className="flex items-start gap-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded-md border-slate-300 text-orange-600 focus:ring-1 focus:ring-orange-500"
                        required
                      />
                      <span>
                        ฉันยอมรับข้อตกลงการใช้งานและนโยบายความเป็นส่วนตัว
                        <button
                          type="button"
                          className="text-orange-600 hover:underline ml-1"
                          onClick={() => setShowTerms(true)}
                        >
                          (อ่านเพิ่มเติม)
                        </button>
                      </span>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="h-10 rounded-full border border-orange-200 bg-white text-orange-700 font-semibold hover:bg-orange-50"
                      >
                        ย้อนกลับ
                      </button>
                      <Button
                        loading={loading}
                        icon={<UserPlus className="w-5 h-5" />}
                        text="สมัครสมาชิก"
                      />
                    </div>
                  </div>
                )}

                {authError && (
                  <div className="mt-1 rounded-xl border border-red-200 bg-red-50 text-red-700 text-center px-4 py-2 text-sm">
                    {authError}
                  </div>
                )}
              </form>
            )}
          </div>

          <p className="mt-4 text-xs text-slate-500">
            เคล็ดลับ: กรอกเฉพาะที่จำเป็นก่อน แล้วเติมรายละเอียดในโปรไฟล์ผู้ขายภายหลังได้
          </p>
        </div>
      </main>
    </div>
  )
}

/* ---------- UI atoms (อัปเดต: รองรับ required/optional) ---------- */
function Input(props: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  autoComplete?: string
  minLength?: number
  className?: string
  icon?: React.ReactNode
  rightIcon?: React.ReactNode
  required?: boolean
}) {
  const {
    label, value, onChange, placeholder, type = 'text', autoComplete, minLength, className,
    icon, rightIcon, required = false
  } = props
  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-orange-800/90 mb-1">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</div>}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          autoComplete={autoComplete}
          minLength={minLength}
          required={required}
          className={`w-full h-11 rounded-xl border bg-white/80 backdrop-blur px-3 ${icon ? 'pl-10' : 'pl-3'} pr-10 text-sm outline-none
            border-orange-200 focus:ring-2 focus:ring-orange-300 focus:border-orange-300
            placeholder:text-slate-400`}
        />
        {rightIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightIcon}</div>}
      </div>
    </div>
  )
}

function Textarea(props: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  const { label, value, onChange, placeholder, required = false } = props
  return (
    <div>
      <label className="block text-sm font-semibold text-orange-800/90 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        required={required}
        className="w-full rounded-xl border bg-white/80 backdrop-blur p-3 text-sm outline-none
          border-orange-200 focus:ring-2 focus:ring-orange-300 focus:border-orange-300
          placeholder:text-slate-400"
      />
    </div>
  )
}

function Button({ loading, icon, text }: { loading: boolean; icon: React.ReactNode; text: string }) {
  return (
    <button
      type="submit"
      className="w-full h-10 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold
        shadow-lg hover:from-orange-700 hover:to-amber-600 transition-all
        flex items-center justify-center gap-2 disabled:opacity-60"
      disabled={loading}
    >
      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : icon}
      {loading ? 'กำลังดำเนินการ...' : text}
    </button>
  )
}
function FeatureCard({
  icon, title, desc,
}: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group rounded-2xl border border-orange-200 bg-white/70 p-4 hover:bg-white shadow-sm hover:shadow-md transition">
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-orange-50 text-orange-700 border border-orange-200">
        {icon}
      </div>
      <div className="mt-2 font-bold text-orange-800">{title}</div>
      <div className="text-sm text-slate-600">{desc}</div>
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/80 border border-orange-200 p-3 text-center shadow-sm">
      <div className="text-[11px] font-semibold text-slate-500">{label}</div>
      <div className="text-sm font-extrabold text-orange-700">{value}</div>
    </div>
  )
}
