'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Header from '@/components/Header'
import { CheckCircle2, AlertCircle, Phone, MapPin, Mail, User, Printer, PackageCheck } from 'lucide-react'

// -------------------------------
// Types
// -------------------------------
export type UserProfile = {
  name: string
  phone: string
  email?: string
  addressLine1: string
  addressLine2?: string
  subdistrict: string // ตำบล/แขวง
  district: string // อำเภอ/เขต
  province: string // จังหวัด
  postalCode: string // รหัสไปรษณีย์ 5 หลัก
  country: string
  addressType?: 'home' | 'condo' | 'office' | 'other'
  deliveryNotes?: string
  preferredSlot?: 'any' | 'morning' | 'afternoon' | 'evening'
  cod?: boolean
  taxId?: string
}

// -------------------------------
// Constants
// -------------------------------
const PROVINCES_TH = [
  'กรุงเทพมหานคร','กระบี่','กาญจนบุรี','กาฬสินธุ์','กำแพงเพชร','ขอนแก่น','จันทบุรี','ฉะเชิงเทรา','ชลบุรี','ชัยนาท','ชัยภูมิ','ชุมพร','เชียงราย','เชียงใหม่','ตรัง','ตราด','ตาก','นครนายก','นครปฐม','นครพนม','นครราชสีมา','นครศรีธรรมราช','นครสวรรค์','นนทบุรี','นราธิวาส','น่าน','บึงกาฬ','บุรีรัมย์','ปทุมธานี','ประจวบคีรีขันธ์','ปราจีนบุรี','ปัตตานี','พระนครศรีอยุธยา','พังงา','พัทลุง','พิจิตร','พิษณุโลก','เพชรบุรี','เพชรบูรณ์','แพร่','พะเยา','ภูเก็ต','มหาสารคาม','มุกดาหาร','แม่ฮ่องสอน','ยโสธร','ยะลา','ร้อยเอ็ด','ระนอง','ระยอง','ราชบุรี','ลพบุรี','ลำปาง','ลำพูน','ศรีสะเกษ','สกลนคร','สงขลา','สตูล','สมุทรปราการ','สมุทรสงคราม','สมุทรสาคร','สระแก้ว','สระบุรี','สิงห์บุรี','สุโขทัย','สุพรรณบุรี','สุราษฎร์ธานี','สุรินทร์','หนองคาย','หนองบัวลำภู','อ่างทอง','อำนาจเจริญ','อุดรธานี','อุตรดิตถ์','อุทัยธานี','อุบลราชธานี'
]

const emptyProfile: UserProfile = {
  name: '',
  phone: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  subdistrict: '',
  district: '',
  province: '',
  postalCode: '',
  country: 'ประเทศไทย',
  addressType: 'home',
  deliveryNotes: '',
  preferredSlot: 'any',
  cod: false,
  taxId: '',
}

// -------------------------------
// Validation helpers
// -------------------------------
const isPhoneTH = (v: string) => /^0\d{9}$/.test(v.trim())
const isPostalTH = (v: string) => /^\d{5}$/.test(v.trim())
const isEmail = (v = '') => !v || /.+@.+\..+/.test(v.trim())

function useProfileStorage(key = 'userProfile') {
  const [value, setValue] = useState<UserProfile>(emptyProfile)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) setValue({ ...emptyProfile, ...JSON.parse(raw) })
    } catch {}
  }, [key])
  const save = (v: UserProfile) => {
    setValue(v)
    localStorage.setItem(key, JSON.stringify(v))
  }
  return { value, save }
}

// -------------------------------
// Component
// -------------------------------
export default function ProfilePage() {
  const { value, save } = useProfileStorage()
  const [profile, setProfile] = useState<UserProfile>(value)
  const [saved, setSaved] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => setProfile(value), [value])

  // Update document title
  useEffect(() => {
    document.title = 'โปรไฟล์ของฉัน | TH-THAI SHOP'
  }, [])

  const errors = useMemo(() => {
    const e: Partial<Record<keyof UserProfile, string>> = {}
    if (!profile.name.trim()) e.name = 'กรุณากรอกชื่อ-นามสกุล'
    if (!isPhoneTH(profile.phone)) e.phone = 'กรุณากรอกเบอร์โทร 10 หลัก (ขึ้นต้นด้วย 0)'
    if (!isEmail(profile.email)) e.email = 'อีเมลไม่ถูกต้อง'
    if (!profile.addressLine1.trim()) e.addressLine1 = 'กรอกที่อยู่บรรทัดแรก'
    if (!profile.subdistrict.trim()) e.subdistrict = 'กรอกตำบล/แขวง'
    if (!profile.district.trim()) e.district = 'กรอกอำเภอ/เขต'
    if (!profile.province.trim()) e.province = 'เลือกจังหวัด'
    if (!isPostalTH(profile.postalCode)) e.postalCode = 'รหัสไปรษณีย์ 5 หลัก'
    return e
  }, [profile])

  const hasError = Object.keys(errors).length > 0

  const handleChange = (name: keyof UserProfile, value: any) => {
    setProfile((prev) => ({ ...prev, [name]: value }))
    setTouched((t) => ({ ...t, [name]: true }))
  }

  const saveProfile = () => {
    if (hasError) {
      // touch all
      const all: Record<string, boolean> = {}
      Object.keys(profile).forEach((k) => (all[k] = true))
      setTouched(all)
      return
    }
    save(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-black mb-1">ข้อมูลผู้รับสำหรับขนส่ง</h1>
        <p className="text-black mb-6">กรอกข้อมูลให้ครบถ้วนเพื่อพิมพ์ที่อยู่และป้ายจัดส่งได้อย่างถูกต้อง</p>

        {/* Contact Card */}
        <section className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 mb-5">
          <h2 className="text-lg font-semibold text-black mb-3 flex items-center gap-2">
            <User className="w-5 h-5" /> ข้อมูลติดต่อ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              label="อีเมล (ไม่บังคับ)"
              name="email"
              value={profile.email || ''}
              onChange={(v) => handleChange('email', v)}
              icon={<Mail className="w-4 h-4" />}
              error={touched.email ? errors.email : ''}
              placeholder="name@example.com"
              className="md:col-span-2"
            />
          </div>
        </section>

        {/* Address Card */}
        <section className="bg-white rounded-2xl border border-orange-100 shadow-sm p-5 mb-5">
          <h2 className="text-lg font-semibold text-black mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5" /> ที่อยู่จัดส่ง
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field
              label="ที่อยู่ (บรรทัดที่ 1)"
              name="addressLine1"
              value={profile.addressLine1}
              onChange={(v) => handleChange('addressLine1', v)}
              placeholder="บ้านเลขที่/อาคาร/หมู่บ้าน/ถนน"
              error={touched.addressLine1 ? errors.addressLine1 : ''}
              className="md:col-span-2"
            />
            <Field
              label="ที่อยู่ (บรรทัดที่ 2)"
              name="addressLine2"
              value={profile.addressLine2 || ''}
              onChange={(v) => handleChange('addressLine2', v)}
              placeholder="ห้อง/ชั้น/ซอย (ถ้ามี)"
              className="md:col-span-2"
            />

            <Field
              label="ตำบล/แขวง"
              name="subdistrict"
              value={profile.subdistrict}
              onChange={(v) => handleChange('subdistrict', v)}
              placeholder="ตำบล/แขวง"
              error={touched.subdistrict ? errors.subdistrict : ''}
            />
            <Field
              label="อำเภอ/เขต"
              name="district"
              value={profile.district}
              onChange={(v) => handleChange('district', v)}
              placeholder="อำเภอ/เขต"
              error={touched.district ? errors.district : ''}
            />

            <Select
              label="จังหวัด"
              name="province"
              value={profile.province}
              onChange={(v) => handleChange('province', v)}
              options={[{ label: 'เลือกจังหวัด', value: '' }, ...PROVINCES_TH.map((p) => ({ label: p, value: p }))]}
              error={touched.province ? errors.province : ''}
            />

            <Field
              label="รหัสไปรษณีย์"
              name="postalCode"
              value={profile.postalCode}
              onChange={(v) => handleChange('postalCode', v.replace(/[^0-9]/g, '').slice(0, 5))}
              placeholder="xxxxx"
              error={touched.postalCode ? errors.postalCode : ''}
              inputMode="numeric"
            />

            <Field
              label="ประเทศ"
              name="country"
              value={profile.country}
              onChange={(v) => handleChange('country', v)}
              placeholder="ประเทศ"
              className="md:col-span-2"
            />

            <Select
              label="ประเภทที่อยู่"
              name="addressType"
              value={profile.addressType || 'home'}
              onChange={(v) => handleChange('addressType', v as any)}
              options={[
                { label: 'บ้านพัก', value: 'home' },
                { label: 'คอนโด/อพาร์ตเมนต์', value: 'condo' },
                { label: 'ที่ทำงาน', value: 'office' },
                { label: 'อื่น ๆ', value: 'other' },
              ]}
            />

            <Select
              label="ช่วงเวลาส่งที่สะดวก"
              name="preferredSlot"
              value={profile.preferredSlot || 'any'}
              onChange={(v) => handleChange('preferredSlot', v as any)}
              options={[
                { label: 'ส่งได้ทุกเวลา', value: 'any' },
                { label: 'เช้า (09:00–12:00)', value: 'morning' },
                { label: 'บ่าย (12:00–17:00)', value: 'afternoon' },
                { label: 'เย็น (17:00–20:00)', value: 'evening' },
              ]}
            />

            <Toggle
              label="ชำระเงินปลายทาง (COD)"
              checked={!!profile.cod}
              onChange={(v) => handleChange('cod', v)}
            />

            <Field
              label="เลขประจำตัวผู้เสียภาษี (ถ้ามี)"
              name="taxId"
              value={profile.taxId || ''}
              onChange={(v) => handleChange('taxId', v.replace(/[^0-9-]/g, '').slice(0, 17))}
              placeholder="x-xxxx-xxxxx-xx-x"
            />

            <Textarea
              label="หมายเหตุถึงคนส่งของ"
              name="deliveryNotes"
              value={profile.deliveryNotes || ''}
              onChange={(v) => handleChange('deliveryNotes', v)}
              placeholder="เช่น ฝากไว้ที่ รปภ., โทรก่อนถึง, จุดสังเกตใกล้บ้าน"
              className="md:col-span-2"
            />
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className={`flex-1 h-12 rounded-xl text-white font-semibold shadow ${
              hasError ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
            }`}
            onClick={saveProfile}
            type="button"
          >
            บันทึกข้อมูล
          </button>
        </div>

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
              <div className="font-semibold mb-1">กรอกข้อมูลให้ครบก่อนบันทึก</div>
              <ul className="list-disc list-inside text-sm">
                {Object.values(errors).map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
              </ul>
            </div>
          </div>
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
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1 text-black">{label}</label>
      <div className={`flex items-center gap-2 h-11 px-3 rounded-xl border ${
        error ? 'border-red-300 bg-red-50/40' : 'border-orange-200 bg-white'
      } focus-within:ring-2 focus-within:ring-orange-300`}>
        {icon && <span className="text-orange-700">{icon}</span>}
        <input
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm"
          inputMode={inputMode}
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

function Select({
  label,
  name,
  value,
  onChange,
  options,
  error,
  className,
}: {
  label: string
  name: string
  value: string
  onChange: (v: string) => void
  options: { label: string; value: string }[]
  error?: string
  className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1 text-black">{label}</label>
      <div className={`h-11 rounded-xl border px-3 flex items-center ${
        error ? 'border-red-300 bg-red-50/40' : 'border-orange-200 bg-white'
      } focus-within:ring-2 focus-within:ring-orange-300`}>
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-black">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-12 h-7 rounded-full border transition relative ${
          checked ? 'bg-emerald-500 border-emerald-600' : 'bg-gray-200 border-gray-300'
        }`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
