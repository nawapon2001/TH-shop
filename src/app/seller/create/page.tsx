"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import Link from 'next/link'
import { MapPin, Phone, Mail, Store, User as UserIcon, Upload, Camera, X } from 'lucide-react'

// small provinces list (same as other pages)
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

export default function SellerCreatePage() {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [shopName, setShopName] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [province, setProvince] = useState('')
  const [address, setAddress] = useState('')
  const [shopImage, setShopImage] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    try {
      const u = localStorage.getItem('sellerUser')
      if (!u) {
        Swal.fire({ icon: 'info', title: 'โปรดเข้าสู่ระบบ', text: 'กรุณาเข้าสู่ระบบผู้ขายก่อนเปิดร้าน', timer: 1800, showConfirmButton: false })
        router.push('/seller/auth')
        return
      }
      let uname = u
      try {
        let cur = u
        for (let i = 0; i < 5; i++) {
          try { const next = decodeURIComponent(cur); if (next === cur) break; cur = next } catch { break }
        }
        uname = cur
      } catch {}
      setUsername(uname)
      const profileRaw = localStorage.getItem('sellerProfile')
      if (profileRaw) {
        const p = JSON.parse(profileRaw)
        setShopName(p.shopName || '')
        setFullName(p.fullName || '')
        setPhone(p.phone || '')
        setEmail(p.email || '')
        setProvince(p.province || '')
        setAddress(p.address || '')
        setShopImage(p.shopImage || '')
      }
    } catch (err) {
      // ignore
    }
  }, [router])

  const handleImageUpload = async (file: File) => {
    if (!file) return
    
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: 'warning', title: 'ไฟล์ใหญ่เกินไป', text: 'กรุณาเลือกรูปภาพที่มีขนาดไม่เกิน 5MB' })
      return
    }

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) throw new Error('Upload failed')
      
      const data = await res.json()
      setShopImage(data.url)
      setImageFile(file)
      
      Swal.fire({ 
        icon: 'success', 
        title: 'อัปโหลดสำเร็จ', 
        text: 'รูปภาพร้านของคุณถูกอัปโหลดแล้ว',
        timer: 1500, 
        showConfirmButton: false 
      })
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'อัปโหลดไม่สำเร็จ', text: 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  const removeImage = () => {
    setShopImage('')
    setImageFile(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username) return
    if (!shopName.trim() || !fullName.trim() || !phone.trim()) {
      Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบ', text: 'กรุณากรอก ชื่อร้าน, ชื่อ-นามสกุล, และเบอร์โทร' })
      return
    }
    setLoading(true)
    try {
      const payload = { 
        username, 
        shopName: shopName.trim(), 
        fullName: fullName.trim(), 
        phone: phone.trim(), 
        email: email.trim() || undefined, 
        province: province || undefined, 
        address: address || undefined,
        shopImage: shopImage || undefined
      }
      const res = await fetch('/api/seller-info', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        Swal.fire({ icon: 'error', title: 'ไม่สามารถบันทึกได้', text: err?.error || 'เกิดข้อผิดพลาด' })
        return
      }
      // persist profile locally
      try { 
        localStorage.setItem('sellerProfile', JSON.stringify({ 
          username, 
          shopName: payload.shopName, 
          fullName: payload.fullName, 
          phone: payload.phone, 
          email: payload.email || '', 
          province: payload.province || '', 
          address: payload.address || '',
          shopImage: payload.shopImage || ''
        })) 
      } catch {}
      Swal.fire({ icon: 'success', title: 'เปิดร้านเรียบร้อย', timer: 1200, showConfirmButton: false })
      router.push('/seller/manage')
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'ข้อผิดพลาด', text: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <Store className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">สมัครเปิดร้าน</h1>
          <p className="text-slate-600 max-w-md mx-auto">กรอกข้อมูลร้านของคุณเพื่อเริ่มขายบนแพลตฟอร์มและเข้าถึงลูกค้าหลายพันคน</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Shop Image Upload Section */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6">
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5" />
              รูปภาพร้าน
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                {shopImage ? (
                  <div className="relative group">
                    <img 
                      src={shopImage} 
                      alt="Shop" 
                      className="w-32 h-32 object-cover rounded-xl border-4 border-white shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-white/20 border-2 border-dashed border-white rounded-xl flex flex-col items-center justify-center text-white">
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-sm">ไม่มีรูป</span>
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <p className="text-white/90 text-sm mb-3">
                  อัปโหลดรูปภาพร้านเพื่อสร้างความน่าเชื่อถือให้กับลูกค้า
                </p>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-lg font-medium cursor-pointer hover:bg-orange-50 transition-colors">
                  <Upload className="w-4 h-4" />
                  {uploadingImage ? 'กำลังอัปโหลด...' : 'เลือกรูปภาพ'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
                <p className="text-white/70 text-xs mt-2">รองรับ JPG, PNG ขนาดไม่เกิน 5MB</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8 space-y-6">
            {/* Shop Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Store className="w-4 h-4 text-orange-600" />
                ชื่อร้าน *
              </label>
              <input 
                value={shopName} 
                onChange={(e)=>setShopName(e.target.value)} 
                className="w-full h-12 rounded-xl border border-slate-300 px-4 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                placeholder="กรอกชื่อร้านของคุณ"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-orange-600" />
                ชื่อ-นามสกุล *
              </label>
              <input 
                value={fullName} 
                onChange={(e)=>setFullName(e.target.value)} 
                className="w-full h-12 rounded-xl border border-slate-300 px-4 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                placeholder="กรอกชื่อ-นามสกุลของคุณ"
              />
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-orange-600" />
                  เบอร์โทร *
                </label>
                <input 
                  value={phone} 
                  onChange={(e)=>setPhone(e.target.value)} 
                  className="w-full h-12 rounded-xl border border-slate-300 px-4 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="08X-XXX-XXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  อีเมล
                </label>
                <input 
                  value={email} 
                  onChange={(e)=>setEmail(e.target.value)} 
                  className="w-full h-12 rounded-xl border border-slate-300 px-4 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="อีเมลของคุณ (ไม่บังคับ)"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-orange-600" />
                จังหวัด
              </label>
              <select 
                value={province} 
                onChange={(e)=>setProvince(e.target.value)} 
                className="w-full h-12 rounded-xl border border-slate-300 px-4 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white"
              >
                <option value="">เลือกจังหวัด</option>
                {THAI_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                ที่อยู่
              </label>
              <textarea 
                value={address} 
                onChange={(e)=>setAddress(e.target.value)} 
                className="w-full rounded-xl border border-slate-300 p-4 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all resize-none"
                rows={3}
                placeholder="ที่อยู่ของร้าน (ไม่บังคับ)"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center gap-4 justify-end pt-4 border-t border-slate-200">
              <Link 
                href="/seller/manage" 
                className="px-6 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors"
              >
                ยกเลิก
              </Link>
              <button 
                type="submit" 
                disabled={loading || uploadingImage} 
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'กำลังบันทึก...' : 'เปิดร้าน'}
              </button>
            </div>
          </div>
        </form>

        {/* Footer Note */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-500">
            การสมัครเปิดร้านจะต้องผ่านการตรวจสอบก่อนเริ่มขาย
          </p>
        </div>
      </main>
    </div>
  )
}
