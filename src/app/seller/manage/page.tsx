"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Swal from 'sweetalert2'
import { CartManager } from '@/lib/cart-utils'
import { getSellerUsername, logoutSeller } from '@/lib/seller-auth'
import { PlusCircle, LogOut, Edit, Store, ShoppingCart, Package, Receipt, Printer, TrendingUp, Users, DollarSign } from 'lucide-react'

// shared product option type used by OptionBuilder and product forms
type ProductOption = { name: string; values: string[] }

const ensureString = (v: unknown) => (v == null ? '' : String(v).trim())

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

  // Update document title based on active tab
  useEffect(() => {
    const shopName = seller?.shopName || username || 'ร้านค้า'
    const tabTitles = {
      overview: `${shopName} - ภาพรวม | TH-THAI SHOP`,
      orders: `${shopName} - คำสั่งซื้อ | TH-THAI SHOP`,
      products: `${shopName} - จัดการสินค้า | TH-THAI SHOP`,
      profile: `${shopName} - โปรไฟล์ร้าน | TH-THAI SHOP`
    }
    
    if (needsCreate) {
      document.title = 'สร้างร้านค้า | TH-THAI SHOP'
    } else {
      document.title = tabTitles[activeTab] || 'TH-THAI SHOP'
    }
  }, [activeTab, seller?.shopName, username, needsCreate])

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
  // support multiple images
  const [pImageFiles, setPImageFiles] = useState<File[]>([])
  // preview URLs for selected image files
  const [pImagePreviews, setPImagePreviews] = useState<string[]>([])
  const [previewIndex, setPreviewIndex] = useState(0)
  // product options like admin
  const [pOptions, setPOptions] = useState<ProductOption[]>([])
  const ensureString = (v: unknown) => (v == null ? '' : String(v).trim())
  function sanitizeOptions(raw: any): ProductOption[] {
    try {
      const parsed: any = Array.isArray(raw) ? raw : JSON.parse(String(raw || '[]'))
      const data: any[] = Array.isArray(parsed) ? parsed : []
      const seen = new Set<string>()
      const list = data
        .map((o: any) => {
          const name = ensureString(o?.name)
          const valuesRaw = Array.isArray(o?.values) ? o.values : []
          const values = Array.from(new Set(valuesRaw.map((v: any) => ensureString(v)).filter(Boolean)))
          return { name, values }
        })
        .filter((o: any) => o.name && Array.isArray(o.values) && o.values.length > 0)
        .map((o: any) => {
          let name = o.name as string
          let n = 2
          while (seen.has(name)) name = `${o.name} (${n++})`
          seen.add(name)
          return { name, values: o.values as string[] }
        })
      return list as ProductOption[]
    } catch {
      return []
    }
  }

  // generate object URLs for image previews and clean up on change
  useEffect(() => {
    if (!pImageFiles || pImageFiles.length === 0) {
      setPImagePreviews([])
      setPreviewIndex(0)
      return
    }
    const urls = pImageFiles.map(f => URL.createObjectURL(f))
    setPImagePreviews(urls)
    setPreviewIndex(0)
    return () => {
      urls.forEach(u => { try { URL.revokeObjectURL(u) } catch {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pImageFiles])

  const handleProductUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username) return Swal.fire({ icon: 'warning', title: 'ต้องล็อกอินเป็นผู้ขายก่อน' })
    if (!pName || !pPrice || !pCategory || pImageFiles.length === 0) return Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูลให้ครบถ้วน' })
    try {
      setLoading(true)
      const fd = new FormData()
      pImageFiles.forEach(f => fd.append('files', f))
      const up = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!up.ok) throw new Error('upload failed')
      const upJson = await up.json().catch(()=>({}))
      const imageUrls: string[] = Array.isArray(upJson?.urls) ? upJson.urls : []

      const payload = { username, item: { name: pName, price: Number(pPrice), desc: pDesc, images: imageUrls, options: sanitizeOptions(pOptions) } }
      const res = await fetch('/api/seller-products', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const errJson = await res.json().catch(()=>null)
        throw new Error(errJson?.error || errJson?.message || `create product failed (status ${res.status})`)
      }
      // success — refresh list
      setPName(''); setPPrice(''); setPDesc(''); setPCategory(''); setPImageFiles([]); setPOptions([])
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

  // delete a seller product by id (asks for confirmation)
  const handleDeleteProduct = async (productId?: string) => {
    if (!productId) return Swal.fire({ icon: 'warning', title: 'ไม่พบไอดีสินค้า' })
    if (!username) return Swal.fire({ icon: 'warning', title: 'ต้องล็อกอินเป็นผู้ขายก่อน' })
    const c = await Swal.fire({ title: 'ยืนยันการลบสินค้า?', text: 'เมื่อลบแล้วสินค้าจะหายจากหน้าร้าน', icon: 'warning', showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก' })
    if (!c.isConfirmed) return
    try {
      setLoading(true)
      const res = await fetch(`/api/seller-products?id=${encodeURIComponent(String(productId))}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(()=>null)
        throw new Error(err?.error || err?.message || `delete failed (status ${res.status})`)
      }
      // refresh products list
      if (username) await fetchData(username)
      Swal.fire({ icon: 'success', title: 'ลบสินค้าเรียบร้อย', timer: 1000, showConfirmButton: false })
    } catch (err:any) {
      console.error('delete product', err)
      Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ', text: err?.message || '' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    // Set loading title
    if (typeof document !== 'undefined') {
      document.title = 'กำลังโหลด... | TH-THAI SHOP'
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-2xl border border-white/20">
            <p className="text-orange-700 font-semibold text-lg mb-2">กำลังโหลดข้อมูล...</p>
            <p className="text-orange-600 text-sm">โปรดรอสักครู่</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 p-6 sm:p-8 mb-6 sm:mb-8 hover:shadow-3xl transition-all duration-300">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full lg:w-auto">
              <div className="relative group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-lg transform group-hover:scale-105 transition-transform duration-300">
                  {seller?.image ? (
                    <img src={seller.image} alt={seller.shopName} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 rounded-full border-3 sm:border-4 border-white flex items-center justify-center shadow-lg">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {seller?.shopName || username}
                </div>
                <div className="text-slate-600 text-base sm:text-lg mt-1">ผู้ขาย: {seller?.fullName || username}</div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-3">
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium shadow-sm">
                    🟢 ร้านค้าเปิดทำการ
                  </span>
                  <span className="text-slate-500 text-xs sm:text-sm bg-slate-100 px-3 py-1 rounded-full">{products.length} สินค้า</span>
                  <span className="text-slate-500 text-xs sm:text-sm bg-slate-100 px-3 py-1 rounded-full">{orders.length} คำสั่งซื้อ</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Link href="/seller/create" className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-white to-gray-50 border-2 border-orange-200 text-slate-700 hover:border-orange-300 hover:shadow-xl hover:scale-105 transition-all duration-300 font-medium">
                <Edit className="w-4 h-4 sm:w-5 sm:h-5" /> แก้ไขหน้าร้าน
              </Link>
              <button onClick={handleLogout} className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-lg font-medium">
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" /> ออกจากระบบ
              </button>
            </div>
          </div>
        </div>

        {needsCreate ? (
          /* Create Shop Form */
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden mb-6 sm:mb-8 hover:shadow-3xl transition-all duration-300">
            <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 p-6 sm:p-8">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                <Store className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                สร้างร้านค้า
              </h2>
              <p className="text-orange-100 mt-2 text-sm sm:text-base">สร้างหน้าร้านของคุณ</p>
            </div>
            
            <div className="p-6 sm:p-8">
              <form onSubmit={createSeller} className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 sm:p-6 mb-6">
                  <div className="text-blue-800 font-medium text-sm sm:text-base">✨ ยังไม่มีหน้าร้านสำหรับบัญชีนี้</div>
                  <div className="text-blue-600 text-xs sm:text-sm mt-1">กรอกข้อมูลด้านล่างเพื่อสร้างร้านค้าของคุณ</div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">ชื่อร้าน</label>
                    <input
                      type="text"
                      value={shopNameInput}
                      onChange={(e) => setShopNameInput(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                      placeholder={`ร้าน ${username}`}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">ชื่อเจ้าของร้าน</label>
                    <input
                      type="text"
                      value={ownerNameInput}
                      onChange={(e) => setOwnerNameInput(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                      placeholder="ชื่อ-นามสกุล"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">อีเมล</label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                      placeholder="email@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">เบอร์โทร</label>
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                      placeholder="09x-xxx-xxxx"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">จังหวัด</label>
                    <input
                      type="text"
                      value={provinceInput}
                      onChange={(e) => setProvinceInput(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                      placeholder="จังหวัด"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">ที่อยู่</label>
                    <textarea
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white resize-none"
                      placeholder="ที่อยู่ร้านค้า"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white rounded-xl hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 font-semibold text-lg shadow-lg hover:shadow-xl hover:scale-105 transform"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      กำลังสร้าง...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      ✨ สร้างร้านค้า
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 mb-6 sm:mb-8 overflow-hidden">
              <div className="flex flex-wrap border-b border-gray-100">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 min-w-0 px-4 sm:px-6 py-4 font-semibold text-sm transition-all duration-300 ${
                    activeTab === 'overview'
                      ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 inline mr-2" />
                  <span className="hidden sm:inline">ภาพรวม</span>
                  <span className="sm:hidden">📊</span>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex-1 min-w-0 px-4 sm:px-6 py-4 font-semibold text-sm transition-all duration-300 ${
                    activeTab === 'orders'
                      ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50'
                  }`}
                >
                  <Receipt className="w-4 h-4 inline mr-2" />
                  <span className="hidden sm:inline">คำสั่งซื้อ ({orders.length})</span>
                  <span className="sm:hidden">🛒 {orders.length}</span>
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex-1 min-w-0 px-4 sm:px-6 py-4 font-semibold text-sm transition-all duration-300 ${
                    activeTab === 'products'
                      ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50'
                  }`}
                >
                  <Package className="w-4 h-4 inline mr-2" />
                  <span className="hidden sm:inline">จัดการสินค้า ({products.length})</span>
                  <span className="sm:hidden">📦 {products.length}</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 min-w-0 px-4 sm:px-6 py-4 font-semibold text-sm transition-all duration-300 ${
                    activeTab === 'profile'
                      ? 'bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50'
                  }`}
                >
                  <Users className="w-4 h-4 inline mr-2" />
                  <span className="hidden sm:inline">โปรไฟล์ร้าน</span>
                  <span className="sm:hidden">👤</span>
                </button>
              </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6 sm:space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-100/50 overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 group">
                    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-xs sm:text-sm font-medium">คำสั่งซื้อทั้งหมด</p>
                          <p className="text-white text-xl sm:text-2xl font-bold mt-1">{orders.length}</p>
                        </div>
                        <Receipt className="w-6 h-6 sm:w-8 sm:h-8 text-blue-200 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-emerald-100/50 overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 group">
                    <div className="bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-emerald-100 text-xs sm:text-sm font-medium">สินค้าทั้งหมด</p>
                          <p className="text-white text-xl sm:text-2xl font-bold mt-1">{products.length}</p>
                        </div>
                        <Package className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-200 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-purple-100/50 overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 group sm:col-span-2 lg:col-span-1">
                    <div className="bg-gradient-to-br from-purple-500 via-violet-600 to-pink-600 p-4 sm:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-xs sm:text-sm font-medium">ยอดขายรวม</p>
                          <p className="text-white text-xl sm:text-2xl font-bold mt-1">
                            ฿{orders.reduce((sum, order) => sum + (order.amounts?.total || 0), 0).toLocaleString()}
                          </p>
                        </div>
                        <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-purple-200 group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Orders Preview */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden hover:shadow-3xl transition-all duration-300">
                  <div className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                      <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      คำสั่งซื้อล่าสุด
                    </h2>
                  </div>
                  <div className="p-4 sm:p-6">
                    {orders.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                          <Receipt className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-lg font-medium">ยังไม่มีคำสั่งซื้อ</p>
                        <p className="text-gray-400 text-sm mt-1">เมื่อมีลูกค้าสั่งซื้อจะแสดงที่นี่</p>
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {orders.slice(0, 5).map((order) => (
                          <div key={order._id} className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-purple-200 transition-all duration-300 cursor-pointer">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-800">#{(order._id||'').toString().slice(-8)}</div>
                              <div className="text-xs sm:text-sm text-gray-600 truncate">{order.name} • {order.phone}</div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-bold text-emerald-600 text-sm sm:text-base">฿{(order.amounts?.total||0).toLocaleString()}</div>
                              <div className="text-xs text-gray-500">{new Date(order.createdAt||'').toLocaleDateString()}</div>
                            </div>
                          </div>
                        ))}
                        {orders.length > 5 && (
                          <button 
                            onClick={() => setActiveTab('orders')}
                            className="w-full py-3 text-orange-600 hover:text-orange-700 font-semibold hover:bg-orange-50 rounded-xl transition-all duration-200"
                          >
                            ดูทั้งหมด ({orders.length} รายการ) →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden hover:shadow-3xl transition-all duration-300">
                <div className="bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    โปรไฟล์ร้าน
                  </h2>
                </div>
                <div className="p-6 sm:p-8">
                  <div className="max-w-2xl mx-auto">
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative group">
                        <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-3xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-white shadow-2xl group-hover:shadow-3xl transition-all duration-300">
                          {profileImage ? (
                            <img src={profileImage} alt="shop" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Store className="w-12 h-12 sm:w-16 sm:h-16" />
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <span className="text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                            แก้ไขรูปภาพ
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md">
                        <label className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-xl cursor-pointer hover:from-indigo-100 hover:to-purple-100 transition-all duration-200 border border-indigo-200 font-medium">
                          {profileImage ? '🔄 เปลี่ยนรูป' : '📷 อัปโหลดรูป'}
                          <input type="file" accept="image/*" className="hidden" onChange={handleProfileImageSelect} disabled={profileUploading} />
                        </label>
                        {profileImage && (
                          <button 
                            type="button" 
                            onClick={handleRemoveProfileImage} 
                            className="px-4 py-3 border border-red-200 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 font-medium"
                          >
                            🗑️ ลบรูป
                          </button>
                        )}
                      </div>

                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 w-full">
                        <p className="text-xs sm:text-sm text-blue-700 text-center font-medium">
                          💡 รูปโปรไฟล์จะแสดงบนหน้าร้านและผลการค้นหา
                        </p>
                        <p className="text-xs text-blue-600 text-center mt-1">
                          ขนาดแนะนำ: สี่เหลี่ยม 500x500px
                        </p>
                      </div>

                      <div className="w-full">
                        <button 
                          onClick={handleSaveProfile} 
                          disabled={profileSaving} 
                          className="w-full px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 hover:scale-105 transform"
                        >
                          {profileSaving ? (
                            <span className="flex items-center justify-center gap-3">
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              กำลังบันทึก...
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-2">
                              💾 บันทึกรูปโปรไฟล์
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden hover:shadow-3xl transition-all duration-300">
                <div className="bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 p-4 sm:p-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                    <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    คำสั่งซื้อทั้งหมด
                  </h2>
                </div>
                <div className="p-4 sm:p-6">
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                        <Receipt className="w-8 h-8 text-blue-400" />
                      </div>
                      <p className="text-gray-500 text-lg font-medium">ยังไม่มีคำสั่งซื้อสำหรับร้านนี้</p>
                      <p className="text-gray-400 text-sm mt-1">เมื่อมีลูกค้าสั่งซื้อจะแสดงที่นี่</p>
                    </div>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
                      {orders.map((order) => (
                        <div key={order._id} className="bg-gradient-to-r from-white to-blue-50/50 p-4 sm:p-6 rounded-2xl border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                            <div className="flex-1">
                              <div className="font-bold text-lg text-gray-800">คำสั่งซื้อ: #{(order._id||'').toString().slice(-8)}</div>
                              <div className="text-sm text-slate-600 mt-1">👤 ลูกค้า: {order.name} • 📞 {order.phone}</div>
                              <div className="text-sm text-slate-500 mt-1">📍 ที่อยู่: {order.address}</div>
                            </div>
                            <div className="text-right bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                              <div className="text-emerald-700 font-bold text-xl">฿{(order.amounts?.total||0).toLocaleString()}</div>
                              <div className="text-xs text-emerald-600">{new Date(order.createdAt||'').toLocaleString()}</div>
                            </div>
                          </div>

                          {Array.isArray(order.items) && order.items.length > 0 && (
                            <div className="mb-6">
                              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                รายการสินค้า
                              </h4>
                              <div className="grid grid-cols-1 gap-3">
                                {order.items.slice(0, 3).map((it:any, i:number) => (
                                  <div key={i} className="flex items-center gap-4 rounded-xl p-3 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                                    {it.image ? (
                                      <img src={it.image} alt={it.name} className="w-14 h-14 object-cover rounded-lg shadow-sm" />
                                    ) : (
                                      <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center">
                                        <Package className="w-6 h-6 text-gray-400" />
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <div className="font-semibold text-gray-800">{it.name}</div>
                                      <div className="text-sm text-gray-600 mt-1">🛒 จำนวน: {it.qty || it.quantity || 1}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold text-gray-700">฿{((it.price || 0) * (it.qty || it.quantity || 1)).toLocaleString()}</div>
                                    </div>
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <div className="text-sm text-blue-600 text-center py-3 bg-blue-50 rounded-xl border border-blue-200">
                                    และอีก {order.items.length - 3} รายการ...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-gray-50 rounded-xl p-4">
                            <div className="flex flex-col sm:flex-row gap-3 flex-1">
                              <select 
                                value={statusMap[order._id]||'pending'} 
                                onChange={e=>setStatusMap(prev=>({...prev,[order._id]:e.target.value}))} 
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                              >
                                <option value="pending">⏳ รอดำเนินการ</option>
                                <option value="processing">🔄 กำลังจัดการ</option>
                                <option value="paid">💰 ชำระเงินแล้ว</option>
                                <option value="shipped">🚚 จัดส่งแล้ว</option>
                                <option value="completed">✅ สำเร็จ</option>
                                <option value="cancelled">❌ ยกเลิก</option>
                              </select>

                              <input 
                                value={shipMap[order._id]||''} 
                                onChange={e=>setShipMap(prev=>({...prev,[order._id]:e.target.value}))} 
                                placeholder="🚛 เลขขนส่ง" 
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex-1 max-w-[250px]" 
                              />
                            </div>

                            <div className="flex gap-2">
                              <button 
                                onClick={() => handlePrintShippingLabel(order)}
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
                              >
                                <Printer className="w-4 h-4" />
                                <span className="hidden sm:inline">พิมพ์ใบจัดส่ง</span>
                                <span className="sm:hidden">🖨️</span>
                              </button>

                              <button 
                                onClick={()=>handleUpdateOrder(order._id)} 
                                className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-pink-600 text-white hover:from-orange-700 hover:to-pink-700 text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
                              >
                                💾 บันทึก
                              </button>
                            </div>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพสินค้า (เลือกได้หลายรูป)</label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => setPImageFiles(Array.from(e.target.files || []))}
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
                        {/* Option builder (same UX as admin) */}
                        <div className="mb-4">
                          <OptionBuilder value={pOptions} onChange={setPOptions} />
                        </div>

                        <div>
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50"
                          >
                            {loading ? 'กำลังเพิ่มสินค้า...' : 'เพิ่มสินค้า'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Product preview */}
                  <div className="mt-6">
                    <div className="bg-white rounded-2xl border border-orange-100 p-6">
                      <h3 className="text-lg font-bold mb-4">ตัวอย่างสินค้า (ก่อนเพิ่ม)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                          <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100">
                            {pImagePreviews && pImagePreviews.length > 0 ? (
                              <img src={pImagePreviews[previewIndex] || pImagePreviews[0]} alt={pName || 'preview'} className="w-full h-full object-cover" />
                            ) : (
                              <div className="text-sm text-slate-500">ยังไม่ได้เลือกภาพ</div>
                            )}
                          </div>

                          {pImagePreviews && pImagePreviews.length > 0 && (
                            <div className="mt-3 flex gap-2 overflow-x-auto">
                              {pImagePreviews.map((u, i) => (
                                <button key={i} type="button" onClick={() => setPreviewIndex(i)} className={`w-16 h-16 rounded-md overflow-hidden border ${i===previewIndex? 'border-orange-500':''}`}>
                                  <img src={u} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <div className="text-sm text-slate-600 mb-2">ชื่อสินค้า</div>
                          <div className="text-lg font-semibold mb-3">{pName || '—'}</div>

                          <div className="text-sm text-slate-600 mb-2">ราคา</div>
                          <div className="text-lg font-bold text-orange-600 mb-3">{pPrice !== '' ? `฿${Number(pPrice).toLocaleString()}` : '—'}</div>

                          <div className="text-sm text-slate-600 mb-2">หมวดหมู่</div>
                          <div className="mb-3">{pCategory || '—'}</div>

                          <div className="text-sm text-slate-600 mb-2">รายละเอียด</div>
                          <div className="text-sm text-slate-700 mb-3">{pDesc || '—'}</div>

                          <div className="text-sm text-slate-600 mb-2">ตัวเลือก</div>
                          {pOptions && pOptions.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {pOptions.map((o, i) => (
                                <div key={i} className="p-2 border rounded text-sm bg-orange-50">
                                  <div className="font-semibold text-orange-700">{o.name}</div>
                                  <div className="text-xs text-slate-700">{o.values.join(', ')}</div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500">ไม่ได้กำหนดตัวเลือก</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Products List */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden hover:shadow-3xl transition-all duration-300">
                  <div className="bg-gradient-to-r from-purple-500 via-violet-600 to-pink-600 p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
                      <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      สินค้าของฉัน ({products.length})
                    </h2>
                  </div>
                  <div className="p-4 sm:p-6">
                    {products.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-purple-400" />
                        </div>
                        <p className="text-gray-500 text-lg font-medium">ยังไม่มีสินค้า</p>
                        <p className="text-gray-400 text-sm mt-1">เพิ่มสินค้าแรกของคุณเลย!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {products.map((product, idx) => (
                          <div key={product._id || idx} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 transform">
                            <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                              {product.image ? (
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Package className="w-12 h-12" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <span className="text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                                  คลิกเพื่อดูรายละเอียด
                                </span>
                              </div>
                            </div>
                            <div className="p-4">
                              <h3 className="font-bold text-gray-800 truncate text-lg group-hover:text-purple-600 transition-colors duration-200">{product.name}</h3>
                              <p className="text-purple-600 font-bold text-xl mt-1">฿{(product.price || 0).toLocaleString()}</p>
                              {product.desc && (
                                <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">{product.desc}</p>
                              )}
                              <div className="flex flex-col gap-2 mt-4">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleAddToCart(product)}
                                    className="flex-1 px-3 py-2 bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700 rounded-lg hover:from-orange-200 hover:to-pink-200 text-sm font-semibold transition-all duration-200 border border-orange-200"
                                  >
                                    🛒 ลงตะกร้า
                                  </button>
                                  <button
                                    onClick={() => handleBuyNow(product)}
                                    className="flex-1 px-3 py-2 bg-gradient-to-r from-orange-600 to-pink-600 text-white rounded-lg hover:from-orange-700 hover:to-pink-700 text-sm font-semibold transition-all duration-200 shadow-md"
                                  >
                                    ⚡ ซื้อเลย
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleDeleteProduct(product._id)}
                                  className="w-full px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 text-sm font-semibold transition-all duration-200 shadow-md"
                                >
                                  🗑️ ลบสินค้า
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

    /* ---------- OptionBuilder (copied from admin) ---------- */
    function OptionBuilder({
      value, onChange
    }: {
      value: ProductOption[]
      onChange: (next: ProductOption[]) => void
    }) {
      const [optName, setOptName] = useState('')
      const [inputByIdx, setInputByIdx] = useState<Record<number, string>>({})

      const addOption = () => {
        const name = ensureString(optName)
        if (!name) return
        if (value.some(v => v.name.toLowerCase() === name.toLowerCase())) {
          Swal.fire({ icon: 'warning', title: 'ชื่อตัวเลือกซ้ำ', text: 'โปรดใช้ชื่ออื่น' }); return
        }
        onChange([...value, { name, values: [] }])
        setOptName('')
      }

      const removeOption = (idx: number) => {
        onChange(value.filter((_, i) => i !== idx))
        const next = { ...inputByIdx }; delete next[idx]; setInputByIdx(next)
      }

      const addValue = (idx: number) => {
        const raw = ensureString(inputByIdx[idx])
        if (!raw) return
        const tokens = raw.split(',').map(s => ensureString(s)).filter(Boolean)
        const curr = new Set(value[idx].values)
        let changed = false
        tokens.forEach(t => { if (!curr.has(t)) { curr.add(t); changed = true } })
        if (!changed) { setInputByIdx(prev => ({ ...prev, [idx]: '' })); return }
        const next = value.map((o, i) => i === idx ? { ...o, values: Array.from(curr) } : o)
        onChange(next)
        setInputByIdx(prev => ({ ...prev, [idx]: '' }))
      }

      const removeValue = (optIdx: number, vIdx: number) => {
        const next = value.map((o, i) =>
          i === optIdx ? { ...o, values: o.values.filter((_, j) => j !== vIdx) } : o
        )
        onChange(next)
      }

      const renameOption = (idx: number, name: string) => {
        const newName = ensureString(name)
        const dup = value.some((o, i) => i !== idx && o.name.toLowerCase() === newName.toLowerCase())
        if (dup) return Swal.fire({ icon: 'warning', title: 'ชื่อตัวเลือกซ้ำ' })
        const next = value.map((o, i) => i === idx ? { ...o, name: newName } : o)
        onChange(next)
      }

      const Preview = () => (
        <div className="mt-4 border-t border-orange-200 pt-3">
          <div className="text-sm text-slate-600 mb-2">พรีวิวการแสดงผล:</div>
          <div className="grid gap-3">
            {value.map((opt, i) => (
              <div key={i}>
                <div className="text-sm font-semibold mb-1">{opt.name}</div>
                <div className="flex flex-wrap gap-2">
                  {opt.values.map((v, j) => (
                    <span key={j} className="px-3 py-1 rounded-full border text-sm font-medium bg-orange-50 text-gray-700 border-orange-200 shadow">
                      {v}
                    </span>
                  ))}
                  {opt.values.length === 0 && <span className="text-xs text-slate-500">ยังไม่มีค่า</span>}
                </div>
              </div>
            ))}
            {!value.length && <div className="text-xs text-slate-500">ยังไม่ได้เพิ่มตัวเลือก</div>}
          </div>
        </div>
      )

      return (
        <div className="rounded-2xl border border-orange-200 p-4 bg-orange-50/40">
          <div className="flex flex-col md:flex-row gap-2 items-stretch">
            <input
              className="flex-1 border border-orange-200 rounded-xl p-2 focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="ชื่อตัวเลือก (เช่น สี, ขนาด)"
              value={optName}
              onChange={e => setOptName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
            />
            <button type="button" onClick={addOption}
              className="px-4 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700">
              เพิ่มตัวเลือก
            </button>
          </div>

          <div className="mt-4 grid gap-4">
            {value.map((opt, idx) => (
              <div key={idx} className="rounded-xl bg-white border border-orange-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={opt.name}
                    onChange={e => renameOption(idx, e.target.value)}
                    className="font-semibold text-orange-700 bg-transparent border-0 outline-none flex-1"
                  />
                  <button type="button" onClick={() => removeOption(idx)}
                    className="text-xs text-red-600 hover:underline">ลบตัวเลือก</button>
                </div>

                <div className="flex flex-wrap gap-2 mb-2">
                  {opt.values.map((val, vIdx) => (
                    <span key={vIdx} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200 shadow">
                      {val}
                      <button type="button" className="text-[10px] text-red-600" onClick={() => removeValue(idx, vIdx)}>✕</button>
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    value={inputByIdx[idx] ?? ''}
                    onChange={e => setInputByIdx(prev => ({ ...prev, [idx]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addValue(idx) } }}
                    className="flex-1 border border-orange-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="เพิ่มค่า (แยกหลายค่าด้วย , แล้วกด Enter)"
                  />
                  <button type="button" onClick={() => addValue(idx)}
                    className="h-9 px-3 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700">
                    เพิ่มค่า
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Preview />
        </div>
      )
    }
