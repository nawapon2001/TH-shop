"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
// seller manage uses a dedicated seller layout — do not include the main site Header
import Swal from 'sweetalert2'
import { CartManager } from '@/lib/cart-utils'
import { getSellerUsername, logoutSeller } from '@/lib/seller-auth'
import { PlusCircle, LogOut, Edit, Store, ShoppingCart, Package, Receipt, Printer, TrendingUp, Users, DollarSign } from 'lucide-react'

export default function SellerManagePage() {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [seller, setSeller] = useState<any | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [needsCreate, setNeedsCreate] = useState(false)
  // profile edit states
  const [profileImage, setProfileImage] = useState<string>('')
  const [profileFile, setProfileFile] = useState<File | null>(null)
  const [profileUploading, setProfileUploading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileShopName, setProfileShopName] = useState('')
  const [profileFullName, setProfileFullName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [profileProvince, setProfileProvince] = useState('')
  const [profileAddress, setProfileAddress] = useState('')
  // creation form fields
  const [shopNameInput, setShopNameInput] = useState('')
  const [ownerNameInput, setOwnerNameInput] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [phoneInput, setPhoneInput] = useState('')
  const [provinceInput, setProvinceInput] = useState('')
  const [addressInput, setAddressInput] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'profile'>('overview')
  const [statusMap, setStatusMap] = useState<Record<string,string>>({})
  const [shipMap, setShipMap] = useState<Record<string,string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const u = getSellerUsername()
      if (!u) {
        router.push('/seller/auth')
        return
      }
      setUsername(u)
      fetchData(u)
    } catch (err) {
      console.error(err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchData(u: string) {
    setLoading(true)
    try {
      const sRes = await fetch(`/api/seller-info?username=${encodeURIComponent(u)}`)
      if (sRes.status === 404) {
        // If the visitor navigated here from the homepage, show the seller's products
        // instead of prompting account owner to create a shop.
        try {
          const ref = typeof document !== 'undefined' ? document.referrer : ''
          let fromHomepage = false
          if (ref) {
            try {
              const ru = new URL(ref)
              if (ru.origin === window.location.origin && (ru.pathname === '/' || ru.pathname === '')) fromHomepage = true
            } catch {}
          }

          if (fromHomepage) {
            const pRes = await fetch(`/api/seller-products?username=${encodeURIComponent(u)}`)
            const p = pRes.ok ? await pRes.json().catch(() => []) : []
            const mapped = Array.isArray(p)
              ? p.map((item: any) => ({
                  ...item,
                  sellerUsername: u,
                  sellerShopName: (item.shopName || u),
                  sellerProductId: item._id
                }))
              : []
            setProducts(mapped)
            // leave seller as null (no profile) and do not show create prompt for public visitors
            setNeedsCreate(false)
            setLoading(false)
            return
          }
        } catch (err) {
          // fall back to create flow
        }

        // prompt creation inline instead of redirecting (default for owners)
        Swal.fire({ icon: 'info', title: 'ไม่พบร้านค้า', text: 'กรุณาสร้างหน้าร้านในหน้านี้' })
        setNeedsCreate(true)
        setLoading(false)
        return
      }
      if (!sRes.ok) throw new Error('ไม่สามารถโหลดข้อมูลผู้ขาย')
      const s = await sRes.json().catch(() => null)
  setSeller(s)
  // populate profile form
  setProfileImage(s?.image || '')
  setProfileShopName(s?.shopName || '')
  setProfileFullName(s?.fullName || '')
  setProfileEmail(s?.email || '')
  setProfilePhone(s?.phone || '')
  setProfileProvince(s?.province || '')
  setProfileAddress(s?.address || '')

      const pRes = await fetch(`/api/seller-products?username=${encodeURIComponent(u)}`)
      const p = pRes.ok ? await pRes.json().catch(() => []) : []
      const mapped = Array.isArray(p)
        ? p.map((item: any) => ({
            ...item,
            sellerUsername: u,
            sellerShopName: (seller?.shopName || u),
            sellerProductId: item._id
          }))
        : []
      setProducts(mapped)
      
      // Fetch orders for this seller
      await fetchOrders(u)
    } catch (err: any) {
      console.error('fetch seller manage', err)
      Swal.fire({ icon: 'error', title: 'โหลดข้อมูลไม่สำเร็จ', text: err?.message || '' })
    } finally {
      setLoading(false)
    }
  }

  const handleProfileImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) return Swal.fire({ icon: 'warning', title: 'ไฟล์ใหญ่เกินไป', text: 'กรุณาเลือกรูปภาพที่มีขนาดไม่เกิน 5MB' })
    try {
      setProfileUploading(true)
      const fd = new FormData()
      fd.append('file', file)
      const up = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!up.ok) throw new Error('upload failed')
      const j = await up.json().catch(()=>({}))
      const url = j.url || (Array.isArray(j.urls) ? j.urls[0] : '')
      if (!url) throw new Error('no url')
      setProfileImage(url)
      setProfileFile(file)
      Swal.fire({ icon: 'success', title: 'อัปโหลดสำเร็จ', timer: 900, showConfirmButton: false })
      // auto-save uploaded image to seller profile in DB
      try {
        if (!username) throw new Error('ไม่พบผู้ใช้งาน')
        setProfileSaving(true)
        const payload: any = { username, shopImage: url }
        const res = await fetch('/api/seller-info', { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
        if (!res.ok) {
          const err = await res.json().catch(()=>({})); throw new Error(err?.error || err?.message || 'save failed')
        }
        const updated = await res.json().catch(()=>null)
        if (updated) setSeller(updated)
        // update localStorage copy
        try {
          const raw = localStorage.getItem('sellerProfile')
          const cur = raw ? JSON.parse(raw) : {}
          cur.shopImage = url || ''
          localStorage.setItem('sellerProfile', JSON.stringify(cur))
        } catch {}
        Swal.fire({ icon: 'success', title: 'บันทึกรูปเรียบร้อย', timer: 900, showConfirmButton: false })
      } catch (err:any) {
        console.error('auto-save profile image', err)
        Swal.fire({ icon: 'error', title: 'บันทึกรูปไม่สำเร็จ', text: err?.message || '' })
      } finally { setProfileSaving(false) }
    } catch (err:any) {
      console.error('upload profile image', err)
      Swal.fire({ icon: 'error', title: 'อัปโหลดไม่สำเร็จ', text: err?.message || '' })
    } finally { setProfileUploading(false) }
  }

  const handleRemoveProfileImage = async () => {
    if (!username) return Swal.fire({ icon: 'warning', title: 'ต้องล็อกอิน' })
    const c = await Swal.fire({ title: 'ยืนยันการลบรูป?', text: 'เมื่อลบแล้ว รูปโปรไฟล์จะหายไปจากหน้าร้าน', icon: 'warning', showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก' })
    if (!c.isConfirmed) return
    try {
      setProfileSaving(true)
      const payload: any = { username, shopImage: '' }
      const res = await fetch('/api/seller-info', { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const err = await res.json().catch(()=>({})); throw new Error(err?.error || err?.message || 'remove failed')
      }
      const updated = await res.json().catch(()=>null)
      setSeller(updated || seller)
      setProfileImage('')
      setProfileFile(null)
      try { const raw = localStorage.getItem('sellerProfile'); const cur = raw ? JSON.parse(raw) : {}; cur.shopImage = ''; localStorage.setItem('sellerProfile', JSON.stringify(cur)) } catch {}
      Swal.fire({ icon: 'success', title: 'ลบเรียบร้อย', timer: 1000, showConfirmButton: false })
    } catch (err:any) {
      console.error('remove profile image', err)
      Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ', text: err?.message || '' })
    } finally { setProfileSaving(false) }
  }

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!username) return Swal.fire({ icon: 'warning', title: 'ต้องล็อกอิน' })
    setProfileSaving(true)
    try {
      const payload: any = {
        username,
        shopName: profileShopName || undefined,
        fullName: profileFullName || undefined,
        email: profileEmail || undefined,
        phone: profilePhone || undefined,
        province: profileProvince || undefined,
        address: profileAddress || undefined,
        shopImage: profileImage || undefined
      }
      const res = await fetch('/api/seller-info', { method: 'PUT', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const err = await res.json().catch(()=>({})); throw new Error(err?.error || err?.message || 'save failed')
      }
      const updated = await res.json().catch(()=>null)
      setSeller(updated || seller)
      // persist locally
      try { localStorage.setItem('sellerProfile', JSON.stringify({ username, shopName: payload.shopName || '', fullName: payload.fullName || '', phone: payload.phone || '', email: payload.email || '', province: payload.province || '', address: payload.address || '', shopImage: payload.shopImage || '' })) } catch {}
      Swal.fire({ icon: 'success', title: 'บันทึกข้อมูลเรียบร้อย', timer: 1200, showConfirmButton: false })
    } catch (err:any) {
      console.error('save profile', err)
      Swal.fire({ icon: 'error', title: 'บันทึกไม่สำเร็จ', text: err?.message || '' })
    } finally { setProfileSaving(false) }
  }

  async function fetchOrders(u: string) {
    try {
      const res = await fetch(`/api/orders?seller=${encodeURIComponent(u)}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('ไม่สามารถโหลดคำสั่งซื้อได้')
      const d = await res.json().catch(() => [])
      const arr = Array.isArray(d) ? d : []
      setOrders(arr)
      const sMap: Record<string,string> = {}
      const shMap: Record<string,string> = {}
      arr.forEach((o:any) => { sMap[o._id] = o.status || 'pending'; shMap[o._id] = o.shippingNumber || '' })
      setStatusMap(sMap)
      setShipMap(shMap)
    } catch (err:any) {
      console.error('fetch orders', err)
      Swal.fire({ icon: 'error', title: 'โหลดคำสั่งซื้อไม่สำเร็จ', text: err?.message || '' })
    }
  }

  const handleUpdateOrder = async (orderId: string) => {
    try {
      const payload: any = { id: orderId }
      if (statusMap[orderId]) payload.status = statusMap[orderId]
      if (shipMap[orderId] !== undefined) payload.shippingNumber = shipMap[orderId]
      const res = await fetch('/api/orders', { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const err = await res.json().catch(()=>({})); throw new Error(err?.error || err?.message || 'update failed')
      }
      Swal.fire({ icon: 'success', title: 'อัปเดตสถานะแล้ว', timer: 900, showConfirmButton: false })
      if (username) await fetchOrders(username)
    } catch (err:any) {
      console.error('update order', err)
      Swal.fire({ icon: 'error', title: 'อัปเดตไม่สำเร็จ', text: err?.message || '' })
    }
  }

  const handlePrintShippingLabel = (order: any) => {
    const printUrl = `/seller/print-shipping/${order._id}`
    window.open(printUrl, '_blank')
  }

  // create seller inline
  const createSeller = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!username) return Swal.fire({ icon: 'warning', title: 'ไม่พบข้อมูลผู้ใช้' })
    const payload = {
      username,
      shopName: shopNameInput || username,
      fullName: ownerNameInput || username,
      email: emailInput || '',
      phone: phoneInput || '',
      province: provinceInput || '',
      address: addressInput || ''
    }
    try {
      setLoading(true)
      const res = await fetch('/api/seller-info', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const err = await res.json().catch(()=>({})); throw new Error(err?.error || err?.message || 'create failed')
      }
      const created = await res.json().catch(()=>null)
      setSeller(created)
      setNeedsCreate(false)
      Swal.fire({ icon: 'success', title: 'สร้างหน้าร้านสำเร็จ', timer: 1200, showConfirmButton: false })
      // refresh products
      await fetchData(username)
    } catch (err:any) {
      console.error('create seller', err)
      Swal.fire({ icon: 'error', title: 'สร้างหน้าร้านไม่สำเร็จ', text: err?.message || '' })
    } finally { setLoading(false) }
  }

  // product upload (allow adding a product directly from manage page)
  const [pName, setPName] = useState('')
  const [pPrice, setPPrice] = useState<number|''>('')
  const [pDesc, setPDesc] = useState('')
  const [pCategory, setPCategory] = useState('')
  const [pImageFile, setPImageFile] = useState<File|null>(null)
  const handleProductUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username) return Swal.fire({ icon: 'warning', title: 'ต้องล็อกอินเป็นผู้ขายก่อน' })
    if (!pName || !pPrice || !pCategory || !pImageFile) return Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
    try {
      setLoading(true)
      const fd = new FormData()
      fd.append('files', pImageFile)
      const up = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!up.ok) throw new Error('upload failed')
      const upJson = await up.json().catch(()=>({}))
      const imageUrls: string[] = Array.isArray(upJson?.urls) ? upJson.urls : []
      const imageUrl = imageUrls[0] || ''
      const payload = { username, item: { name: pName, price: Number(pPrice), desc: pDesc, image: imageUrl } }
      const res = await fetch('/api/seller-products', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const errJson = await res.json().catch(()=>null)
        throw new Error(errJson?.error || errJson?.message || `create product failed (status ${res.status})`)
      }
      // success — refresh list
      setPName(''); setPPrice(''); setPDesc(''); setPCategory(''); setPImageFile(null)
      await fetchData(username)
      Swal.fire({ icon: 'success', title: 'เพิ่มสินค้าสำเร็จ', timer: 1200, showConfirmButton: false })
    } catch (err:any) {
      console.error('product upload/create error', err)
      Swal.fire({ icon: 'error', title: 'เพิ่มสินค้าไม่สำเร็จ', text: err?.message || '' })
    } finally { setLoading(false) }
  }

  const handleLogout = () => {
    logoutSeller()
    router.push('/')
  }

  const handleAddToCart = (product: any) => {
    try {
      CartManager.addProduct(product, 1)
      Swal.fire({ icon: 'success', title: 'เพิ่มลงตะกร้าแล้ว', timer: 900, showConfirmButton: false })
    } catch (err:any) {
      console.error('add to cart', err)
      Swal.fire({ icon: 'error', title: 'ไม่สามารถเพิ่มลงตะกร้าได้', text: err?.message || '' })
    }
  }

  const handleBuyNow = (product: any) => {
    try {
      CartManager.addProduct(product, 1)
      router.push('/checkout')
    } catch (err:any) {
      console.error('buy now', err)
      Swal.fire({ icon: 'error', title: 'ไม่สามารถสั่งซื้อได้', text: err?.message || '' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-700 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-orange-100 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center overflow-hidden shadow-lg">
                  {seller?.image ? (
                    <img src={seller.image} alt={seller.shopName} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-10 h-10 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  {seller?.shopName || username}
                </div>
                <div className="text-slate-600 text-lg mt-1">ผู้ขาย: {seller?.fullName || username}</div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    ร้านค้าเปิดทำการ
                  </span>
                  <span className="text-slate-500 text-sm">{products.length} สินค้า</span>
                  <span className="text-slate-500 text-sm">{orders.length} คำสั่งซื้อ</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/seller/create" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white border-2 border-orange-200 text-slate-700 hover:border-orange-300 hover:shadow-lg transition-all duration-200">
                <Edit className="w-5 h-5" /> แก้ไขหน้าร้าน
              </Link>
              <button onClick={handleLogout} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl">
                <LogOut className="w-5 h-5" /> ออกจากระบบ
              </button>
            </div>
          </div>
        </div>

        {needsCreate ? (
          /* Create Shop Form */
          <div className="bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Store className="w-6 h-6 text-white" />
                สร้างร้านค้า
              </h2>
              <p className="text-orange-100 mt-2">สร้างหน้าร้านของคุณ</p>
            </div>
            
            <div className="p-8">
              <form onSubmit={createSeller} className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="text-blue-800 font-medium">ยังไม่มีหน้าร้านสำหรับบัญชีนี้</div>
                  <div className="text-blue-600 text-sm mt-1">กรอกข้อมูลด้านล่างเพื่อสร้างร้านค้าของคุณ</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อร้าน</label>
                    <input
                      type="text"
                      value={shopNameInput}
                      onChange={(e) => setShopNameInput(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder={`ร้าน ${username}`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อเจ้าของร้าน</label>
                    <input
                      type="text"
                      value={ownerNameInput}
                      onChange={(e) => setOwnerNameInput(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="ชื่อ-นามสกุล"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">อีเมล</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="email@example.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">เบอร์โทร</label>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="09x-xxx-xxxx"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">จังหวัด</label>
                    <input
                      type="text"
                      value={provinceInput}
                      onChange={(e) => setProvinceInput(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="จังหวัด"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ที่อยู่</label>
                    <textarea
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="ที่อยู่ร้านค้า"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'กำลังสร้าง...' : 'สร้างร้านค้า'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="bg-white rounded-3xl shadow-xl border border-orange-100 mb-8">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-4 font-medium text-sm rounded-tl-3xl ${
                    activeTab === 'overview'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 inline mr-2" />
                  ภาพรวม
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-6 py-4 font-medium text-sm ${
                    activeTab === 'orders'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Receipt className="w-4 h-4 inline mr-2" />
                  คำสั่งซื้อ ({orders.length})
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`px-6 py-4 font-medium text-sm rounded-tr-3xl ${
                    activeTab === 'products'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Package className="w-4 h-4 inline mr-2" />
                  จัดการสินค้า ({products.length})
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-6 py-4 font-medium text-sm ${
                    activeTab === 'profile'
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  โปรไฟล์ร้าน
                </button>
              </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-2xl shadow-lg border border-blue-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm">คำสั่งซื้อทั้งหมด</p>
                          <p className="text-white text-2xl font-bold">{orders.length}</p>
                        </div>
                        <Receipt className="w-8 h-8 text-blue-200" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-lg border border-green-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm">สินค้าทั้งหมด</p>
                          <p className="text-white text-2xl font-bold">{products.length}</p>
                        </div>
                        <Package className="w-8 h-8 text-green-200" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm">ยอดขายรวม</p>
                          <p className="text-white text-2xl font-bold">
                            ฿{orders.reduce((sum, order) => sum + (order.amounts?.total || 0), 0).toLocaleString()}
                          </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-purple-200" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Orders Preview */}
                <div className="bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Receipt className="w-6 h-6 text-white" />
                      คำสั่งซื้อล่าสุด
                    </h2>
                  </div>
                  <div className="p-6">
                    {orders.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">ยังไม่มีคำสั่งซื้อ</div>
                    ) : (
                      <div className="space-y-4">
                        {orders.slice(0, 5).map((order) => (
                          <div key={order._id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50">
                            <div>
                              <div className="font-semibold">#{(order._id||'').toString().slice(-8)}</div>
                              <div className="text-sm text-gray-600">{order.name} • {order.phone}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600">฿{(order.amounts?.total||0).toLocaleString()}</div>
                              <div className="text-sm text-gray-500">{new Date(order.createdAt||'').toLocaleDateString()}</div>
                            </div>
                          </div>
                        ))}
                        {orders.length > 5 && (
                          <button 
                            onClick={() => setActiveTab('orders')}
                            className="w-full py-2 text-orange-600 hover:text-orange-700 font-medium"
                          >
                            ดูทั้งหมด ({orders.length} รายการ)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-violet-600 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Users className="w-6 h-6 text-white" />
                    โปรไฟล์ร้าน
                  </h2>
                </div>
                <div className="p-6">
                  <div className="max-w-2xl mx-auto">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-48 h-48 rounded-2xl overflow-hidden bg-gray-100 border">
                        {profileImage ? (
                          <img src={profileImage} alt="shop" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">ไม่มีรูปโปรไฟล์</div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg cursor-pointer">
                          {profileImage ? 'เปลี่ยนรูป' : 'อัปโหลดรูป'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageSelect} disabled={profileUploading} />
                        </label>
                        {profileImage && (
                          <button type="button" onClick={handleRemoveProfileImage} className="px-4 py-2 border rounded text-sm text-red-600">ลบรูป</button>
                        )}
                      </div>

                      <p className="text-sm text-gray-500 text-center">รูปโปรไฟล์จะแสดงบนหน้าร้านและผลการค้นหา (ขนาดแนะนำ: สี่เหลี่ยม 500x500px)</p>

                      <div className="w-full text-right">
                        <button onClick={handleSaveProfile} disabled={profileSaving} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg">
                          {profileSaving ? 'กำลังบันทึก...' : 'บันทึกรูปโปรไฟล์'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Receipt className="w-6 h-6 text-white" />
                    คำสั่งซื้อทั้งหมด
                  </h2>
                </div>
                <div className="p-6">
                  {orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">ยังไม่มีคำสั่งซื้อสำหรับร้านนี้</div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order._id} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <div className="font-semibold">คำสั่งซื้อ: #{(order._id||'').toString().slice(-8)}</div>
                              <div className="text-sm text-slate-600">ลูกค้า: {order.name} • {order.phone}</div>
                              <div className="text-sm text-slate-500 mt-1">ที่อยู่: {order.address}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-green-600 font-bold">฿{(order.amounts?.total||0).toLocaleString()}</div>
                              <div className="text-sm text-slate-600">{new Date(order.createdAt||'').toLocaleString()}</div>
                            </div>
                          </div>

                          {Array.isArray(order.items) && order.items.length > 0 && (
                            <div className="mb-4 grid grid-cols-1 gap-2">
                              {order.items.slice(0, 3).map((it:any, i:number) => (
                                <div key={i} className="flex items-center gap-3 rounded-md p-2 bg-slate-50 border border-slate-100">
                                  {it.image ? <img src={it.image} alt={it.name} className="w-12 h-12 object-cover rounded-md" /> : <div className="w-12 h-12 bg-slate-100 rounded-md" />}
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{it.name}</div>
                                    <div className="text-xs text-slate-600">จำนวน: {it.qty || it.quantity || 1}</div>
                                  </div>
                                </div>
                              ))}
                              {order.items.length > 3 && (
                                <div className="text-sm text-gray-500 text-center py-2">และอีก {order.items.length - 3} รายการ</div>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-3 flex-wrap">
                            <select 
                              value={statusMap[order._id]||'pending'} 
                              onChange={e=>setStatusMap(prev=>({...prev,[order._id]:e.target.value}))} 
                              className="px-3 py-2 border rounded text-sm"
                            >
                              <option value="pending">รอดำเนินการ</option>
                              <option value="processing">กำลังจัดการ</option>
                              <option value="paid">ชำระเงินแล้ว</option>
                              <option value="shipped">จัดส่งแล้ว</option>
                              <option value="completed">สำเร็จ</option>
                              <option value="cancelled">ยกเลิก</option>
                            </select>

                            <input 
                              value={shipMap[order._id]||''} 
                              onChange={e=>setShipMap(prev=>({...prev,[order._id]:e.target.value}))} 
                              placeholder="เลขขนส่ง" 
                              className="px-3 py-2 border rounded text-sm flex-1 max-w-[200px]" 
                            />

                            <button 
                              onClick={() => handlePrintShippingLabel(order)}
                              className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2 text-sm"
                            >
                              <Printer className="w-4 h-4" />
                              พิมพ์ใบจัดส่ง
                            </button>

                            <button 
                              onClick={()=>handleUpdateOrder(order._id)} 
                              className="ml-auto px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700 text-sm"
                            >
                              บันทึก
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-8">
                {/* Add Product Form */}
                <div className="bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <PlusCircle className="w-6 h-6 text-white" />
                      เพิ่มสินค้าใหม่
                    </h2>
                  </div>
                  <div className="p-6">
                    <form onSubmit={handleProductUpload} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อสินค้า</label>
                        <input
                          type="text"
                          value={pName}
                          onChange={(e) => setPName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="ระบุชื่อสินค้า"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">ราคา (บาท)</label>
                        <input
                          type="number"
                          value={pPrice}
                          onChange={(e) => setPPrice(e.target.value ? Number(e.target.value) : '')}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="0"
                          min="0"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">หมวดหมู่</label>
                        <select
                          value={pCategory}
                          onChange={(e) => setPCategory(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          required
                        >
                          <option value="">เลือกหมวดหมู่</option>
                          <option value="electronics">อิเล็กทรอนิกส์</option>
                          <option value="clothing">เสื้อผ้า</option>
                          <option value="home">บ้านและสวน</option>
                          <option value="beauty">ความงาม</option>
                          <option value="sports">กีฬา</option>
                          <option value="books">หนังสือ</option>
                          <option value="other">อื่นๆ</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพสินค้า</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setPImageFile(e.target.files?.[0] || null)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          required
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียดสินค้า</label>
                        <textarea
                          value={pDesc}
                          onChange={(e) => setPDesc(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="อธิบายรายละเอียดสินค้า..."
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50"
                        >
                          {loading ? 'กำลังเพิ่มสินค้า...' : 'เพิ่มสินค้า'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Products List */}
                <div className="bg-white rounded-3xl shadow-xl border border-orange-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Package className="w-6 h-6 text-white" />
                      สินค้าของฉัน ({products.length})
                    </h2>
                  </div>
                  <div className="p-6">
                    {products.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">ยังไม่มีสินค้า เพิ่มสินค้าแรกของคุณเลย!</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product, idx) => (
                          <div key={product._id || idx} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="aspect-square relative overflow-hidden bg-gray-100">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Package className="w-12 h-12" />
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                              <p className="text-orange-600 font-bold text-lg">฿{(product.price || 0).toLocaleString()}</p>
                              {product.desc && (
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.desc}</p>
                              )}
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => handleAddToCart(product)}
                                  className="flex-1 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm font-medium"
                                >
                                  เพิ่มลงตะกร้า
                                </button>
                                <button
                                  onClick={() => handleBuyNow(product)}
                                  className="flex-1 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
                                >
                                  ซื้อเลย
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
