'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Header from '@/components/Header'
import { CheckCircle2, AlertCircle, Phone, Mail, User, Save, Loader2 } from 'lucide-react'

// -------------------------------
// Types
// -------------------------------
export type UserProfile = {
  name: string
  phone: string
  email?: string
  address?: string
}

// Simplified profile for database storage
const emptyProfile: UserProfile = {
  name: '',
  phone: '',
  email: '',
  address: '',
}

// -------------------------------
// Validation helpers
// -------------------------------
const isPhoneTH = (v: string) => /^0\d{9}$/.test(v.trim())
const isEmail = (v = '') => !v || /.+@.+\..+/.test(v.trim())

// -------------------------------
// Component
// -------------------------------
export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(emptyProfile)
  const [originalProfile, setOriginalProfile] = useState<UserProfile>(emptyProfile)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [userEmail, setUserEmail] = useState<string>('')

  // Get user email from localStorage (assuming login system sets this)
  useEffect(() => {
    // Try to get email from different possible sources
    const storedEmail = 
      localStorage.getItem('currentUserEmail') || 
      localStorage.getItem('userEmail') ||
      localStorage.getItem('user')?.email ||
      'profiletest@example.com' // fallback for testing
    
    setUserEmail(storedEmail)
    
    // Load user profile from database
    if (storedEmail) {
      loadUserProfile(storedEmail)
    }
  }, [])

  const loadUserProfile = async (email: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/profile?email=${encodeURIComponent(email)}`)
      
      if (response.ok) {
        const userData = await response.json()
        const profileData: UserProfile = {
          name: userData.name || '',
          phone: userData.phone || '',
          email: userData.email || '',
          address: userData.address || '',
        }
        setProfile(profileData)
        setOriginalProfile(profileData)
      } else if (response.status === 404) {
        // User not found, keep empty profile
        console.log('User not found, using empty profile')
      } else {
        console.error('Failed to load profile')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  // Update document title
  useEffect(() => {
    document.title = 'โปรไฟล์ของฉัน | TH-THAI SHOP'
  }, [])

  const errors = useMemo(() => {
    const e: Partial<Record<keyof UserProfile, string>> = {}
    if (!profile.name.trim()) e.name = 'กรุณากรอกชื่อ-นามสกุล'
    if (!isPhoneTH(profile.phone)) e.phone = 'กรุณากรอกเบอร์โทร 10 หลัก (ขึ้นต้นด้วย 0)'
    if (!isEmail(profile.email)) e.email = 'อีเมลไม่ถูกต้อง'
    return e
  }, [profile])

  const hasError = Object.keys(errors).length > 0
  const hasChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile)

  const handleChange = (name: keyof UserProfile, value: any) => {
    setProfile((prev) => ({ ...prev, [name]: value }))
    setTouched((t) => ({ ...t, [name]: true }))
  }

  const saveProfile = async () => {
    if (hasError) {
      // touch all
      const all: Record<string, boolean> = {}
      Object.keys(profile).forEach((k) => (all[k] = true))
      setTouched(all)
      return
    }

    if (!hasChanges) {
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          name: profile.name,
          phone: profile.phone,
          address: profile.address,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setOriginalProfile(profile) // Update original to current
        setSaved(true)
        setTimeout(() => setSaved(false), 1800)
        console.log('Profile saved:', result)
      } else {
        const error = await response.json()
        console.error('Failed to save profile:', error)
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + (error.error || 'ไม่ทราบสาเหตุ'))
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-black mb-1">ข้อมูลส่วนตัว</h1>
        <p className="text-black mb-6">จัดการข้อมูลส่วนตัวของคุณ</p>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
            <span className="ml-2 text-slate-600">กำลังโหลด...</span>
          </div>
        )}

        {!loading && (
          <>
            {/* Contact Card */}
            <section className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 mb-5">
              <h2 className="text-lg font-semibold text-black mb-3 flex items-center gap-2">
                <User className="w-5 h-5" /> ข้อมูลติดต่อ
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <Field
                  label="ชื่อ-นามสกุล"
                  name="name"
                  value={profile.name}
                  onChange={(v) => handleChange('name', v)}
                  icon={<User className="w-4 h-4" />}
                  error={touched.name ? errors.name : ''}
                  placeholder="เช่น สมชาย ใจดี"
                />
                <Field
                  label="เบอร์โทร"
                  name="phone"
                  value={profile.phone}
                  onChange={(v) => handleChange('phone', v)}
                  icon={<Phone className="w-4 h-4" />}
                  error={touched.phone ? errors.phone : ''}
                  placeholder="0XXXXXXXXX"
                  inputMode="tel"
                />
                <Field
                  label="อีเมล"
                  name="email"
                  value={profile.email || ''}
                  onChange={(v) => handleChange('email', v)}
                  icon={<Mail className="w-4 h-4" />}
                  error={touched.email ? errors.email : ''}
                  placeholder="name@example.com"
                  disabled={true} // Email cannot be changed
                />
                <Textarea
                  label="ที่อยู่"
                  name="address"
                  value={profile.address || ''}
                  onChange={(v) => handleChange('address', v)}
                  placeholder="ที่อยู่ของคุณ"
                />
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                className={`flex-1 h-12 rounded-xl text-white font-semibold shadow flex items-center justify-center gap-2 ${
                  hasError || loading
                    ? 'bg-gray-300 cursor-not-allowed'
                    : hasChanges
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                onClick={saveProfile}
                disabled={hasError || loading}
                type="button"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {hasChanges ? 'บันทึกการเปลี่ยนแปลง' : 'ข้อมูลล่าสุด'}
                  </>
                )}
              </button>
            </div>

            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-3 bg-gray-50 border rounded text-xs">
                <div>Current user: {userEmail}</div>
                <div>Has changes: {hasChanges.toString()}</div>
                <div>Profile: {JSON.stringify(profile)}</div>
              </div>
            )}

            {/* Saved toast */}
            {saved && (
              <div className="mt-4 flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                <CheckCircle2 className="w-5 h-5" /> บันทึกข้อมูลเรียบร้อยแล้ว
              </div>
            )}

            {/* Inline errors summary */}
            {hasError && (
              <div className="mt-6 text-red-700 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <div className="font-semibold mb-1">กรอกข้อมูลให้ถูกต้องก่อนบันทึก</div>
                  <ul className="list-disc list-inside text-sm">
                    {Object.values(errors).map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// -------------------------------
// Reusable inputs
// -------------------------------
function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  icon,
  className,
  inputMode,
  disabled = false,
}: {
  label: string
  name: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: string
  icon?: React.ReactNode
  className?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  disabled?: boolean
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1 text-black">{label}</label>
      <div className={`flex items-center gap-2 h-11 px-3 rounded-xl border ${
        error ? 'border-red-300 bg-red-50/40' : 
        disabled ? 'border-gray-200 bg-gray-50' : 'border-orange-200 bg-white'
      } focus-within:ring-2 focus-within:ring-orange-300`}>
        {icon && <span className={disabled ? 'text-gray-400' : 'text-orange-700'}>{icon}</span>}
        <input
          id={name}
          name={name}
          value={value}
          onChange={(e) => !disabled && onChange(e.target.value)}
          placeholder={placeholder}
          className={`flex-1 bg-transparent outline-none text-sm ${disabled ? 'text-gray-500 cursor-not-allowed' : ''}`}
          inputMode={inputMode}
          disabled={disabled}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function Textarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string
  name: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1 text-black">{label}</label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl border border-orange-200 bg-white px-3 py-2 outline-none text-sm focus:ring-2 focus:ring-orange-300"
      />
    </div>
  )
}
