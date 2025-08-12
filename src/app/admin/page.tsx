'use client'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import Swal from 'sweetalert2'

type Product = {
  _id: string
  name: string
  price: number
  image?: string
  images?: string[]
  description?: string
  category?: string
}

type Banner = { _id: string; url: string }
type ProductOption = { name: string; values: string[] }
type Category = { name: string; icon?: string }

type TabKey = 'banner' | 'category' | 'product' | 'list' | 'orders'

export default function AdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [name, setName] = useState('')
  const [price, setPrice] = useState<number | ''>('')
  const [description, setDescription] = useState('')
  const [adminUser, setAdminUser] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [isAuth, setIsAuth] = useState(false)
  const [authError, setAuthError] = useState('')

  const [banners, setBanners] = useState<Banner[]>([])
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerUploadError, setBannerUploadError] = useState('')
  const [isSmallBanner, setIsSmallBanner] = useState(false)

  const [category, setCategory] = useState('')
  const [categoryIcon, setCategoryIcon] = useState<File | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState('')

  const [productFiles, setProductFiles] = useState<File[]>([])
  const [options, setOptions] = useState<ProductOption[]>([])
  const [optionName, setOptionName] = useState('')
  const [optionValue, setOptionValue] = useState('')
  const [optionEditIdx, setOptionEditIdx] = useState<number | null>(null)

  const [tab, setTab] = useState<TabKey>('banner')
  const dropRef = useRef<HTMLLabelElement>(null)

  const [orders, setOrders] = useState<any[]>([])

  // *** DEMO ADMIN ***
  const ADMIN_USERNAME = 'nawapon1200'
  const ADMIN_PASSWORD = '055030376'

  // ---------------- API
  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(Array.isArray(data) ? data : [])
    } catch {
      setProducts([])
    }
  }
  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/banners')
      const data = await res.json()
      setBanners(Array.isArray(data) ? data : [])
    } catch {
      setBanners([])
    }
  }
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      if (Array.isArray(data) && typeof data[0] === 'string') {
        setCategories(data.map((name: string) => ({ name })))
      } else if (Array.isArray(data)) {
        setCategories(data)
      } else setCategories([])
    } catch {
      setCategories([])
    }
  }
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      setOrders([])
    }
  }

  // ---------------- Auth
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (adminUser === ADMIN_USERNAME && adminPass === ADMIN_PASSWORD) {
      setIsAuth(true)
      setAuthError('')
      Swal.fire({ icon: 'success', title: 'เข้าสู่ระบบสำเร็จ', timer: 1200, showConfirmButton: false })
    } else {
      setAuthError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
      Swal.fire({ icon: 'error', title: 'เข้าสู่ระบบไม่สำเร็จ', text: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' })
    }
  }

  // ---------------- Banner
  const handleBannerUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBannerUploadError('')
    if (!bannerFile) return setBannerUploadError('กรุณาเลือกไฟล์แบนเนอร์')
    const formData = new FormData()
    formData.append('banner', bannerFile)
    formData.append('isSmall', isSmallBanner ? '1' : '0')
    const res = await fetch('/api/banner', { method: 'POST', body: formData })
    if (!res.ok) {
      setBannerUploadError('อัปโหลดแบนเนอร์ไม่สำเร็จ')
    } else {
      setBannerFile(null)
      setIsSmallBanner(false)
      fetchBanners()
      Swal.fire({ icon: 'success', title: 'อัปโหลดแล้ว', timer: 1200, showConfirmButton: false })
    }
  }
  const handleDeleteBanner = async (id: string) => {
    const result = await Swal.fire({ title: 'ยืนยันการลบแบนเนอร์?', icon: 'warning', showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก' })
    if (result.isConfirmed) {
      // Delete from MongoDB via /api/banners
      await fetch(`/api/banners?id=${id}`, { method: 'DELETE' })
      setBanners(arr => arr.filter(b => b._id !== id))
      Swal.fire({ icon: 'success', title: 'ลบแล้ว', timer: 1200, showConfirmButton: false })
    }
  }

  // ---------------- Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    setCategoryError('')
    if (!category.trim()) {
      setCategoryError('กรุณากรอกชื่อหมวดหมู่')
      return Swal.fire({ icon: 'warning', title: 'กรุณากรอกชื่อหมวดหมู่' })
    }
    setIsAddingCategory(true)
    const formData = new FormData()
    formData.append('name', category.trim())
    if (categoryIcon) formData.append('icon', categoryIcon)
    try {
      const res = await fetch('/api/categories', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setCategoryError(err?.message || 'เพิ่มหมวดหมู่ไม่สำเร็จ')
        Swal.fire({ icon: 'error', title: 'เพิ่มหมวดหมู่ไม่สำเร็จ', text: err?.message || '' })
      } else {
        setCategory(''); setCategoryIcon(null)
        fetchCategories()
        Swal.fire({ icon: 'success', title: 'เพิ่มหมวดหมู่สำเร็จ', timer: 1200, showConfirmButton: false })
      }
    } finally {
      setIsAddingCategory(false)
    }
  }

  // ---------------- Products
  const handleDeleteProduct = async (id: string) => {
    const result = await Swal.fire({ title: 'ยืนยันการลบสินค้า?', icon: 'warning', showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก' })
    if (result.isConfirmed) {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      fetchProducts()
      Swal.fire({ icon: 'success', title: 'ลบสินค้าสำเร็จ', timer: 1200, showConfirmButton: false })
    }
  }

  const handleProductUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price || !selectedCategory || productFiles.length === 0) {
      return Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณากรอกข้อมูลให้ครบถ้วนและเลือกรูปภาพ' })
    }
    const formData = new FormData()
    formData.append('name', name)
    formData.append('price', String(price))
    formData.append('category', selectedCategory)
    formData.append('description', description)
    productFiles.forEach(f => formData.append('images', f))
    formData.append('options', JSON.stringify(options))
    const res = await fetch('/api/products', { method: 'POST', body: formData })
    if (res.ok) {
      setName(''); setPrice(''); setSelectedCategory(''); setDescription('')
      setProductFiles([]); setOptions([])
      fetchProducts()
      Swal.fire({ icon: 'success', title: 'เพิ่มสินค้าสำเร็จ', timer: 1500, showConfirmButton: false })
    } else {
      const err = await res.json().catch(() => ({}))
      Swal.fire({ icon: 'error', title: 'เพิ่มสินค้าไม่สำเร็จ', text: err?.message || 'เพิ่มสินค้าไม่สำเร็จ' })
    }
  }

  // ---- Product options
  const addOption = () => {
    if (!optionName.trim()) return
    setOptions(prev => [...prev, { name: optionName.trim(), values: [] }])
    setOptionName('')
  }
  const removeOption = (idx: number) => setOptions(prev => prev.filter((_, i) => i !== idx))
  const addOptionValue = (idx: number) => {
    if (!optionValue.trim()) return
    setOptions(prev => prev.map((o, i) => i === idx ? { ...o, values: [...o.values, optionValue.trim()] } : o))
    setOptionValue(''); setOptionEditIdx(null)
  }
  const removeOptionValue = (optIdx: number, valIdx: number) =>
    setOptions(prev => prev.map((o, i) => i === optIdx ? { ...o, values: o.values.filter((_, vi) => vi !== valIdx) } : o))

  // ---- Dropzone helpers
  const onDropFiles = (files: FileList | null) => {
    if (!files || !files.length) return
    const list = Array.from(files)
    setProductFiles(prev => [
      ...prev,
      ...list.filter(f => !prev.some(p => p.name === f.name && p.size === f.size))
    ])
  }

  // ---- Selected category
  const [selectedCategory, setSelectedCategory] = useState('')

  // ---- bootstrap
  useEffect(() => { fetchProducts(); fetchBanners(); fetchCategories(); fetchOrders() }, [])

  // ---- Derived
  const productCount = products.length
  const bannerCount = banners.length
  const categoryCount = categories.length

  // ---- Shipping input state for orders
  const [shippingInputs, setShippingInputs] = useState<{ [orderId: string]: string }>({})
  const [statusInputs, setStatusInputs] = useState<{ [orderId: string]: string }>({})

  // Update shippingInputs and statusInputs when orders change (initialize values)
  useEffect(() => {
    if (orders.length) {
      setShippingInputs(inputs => {
        const updated: { [orderId: string]: string } = { ...inputs }
        orders.forEach(order => {
          if (order._id && !(order._id in updated)) {
            updated[order._id] = order.shippingNumber || ''
          }
        })
        return updated
      })
      setStatusInputs(inputs => {
        const updated: { [orderId: string]: string } = { ...inputs }
        orders.forEach(order => {
          if (order._id && !(order._id in updated)) {
            updated[order._id] = order.status || 'pending'
          }
        })
        return updated
      })
    }
  }, [orders])

  // Update status
  const handleUpdateStatus = async (orderId: string, status: string) => {
    if (!orderId || !status) return
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status }),
      })
      // Handle error response (400)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        Swal.fire({ icon: 'error', title: 'อัปเดตสถานะไม่สำเร็จ', text: err?.message || 'เกิดข้อผิดพลาด' })
        return
      }
      fetchOrders()
      Swal.fire({ icon: 'success', title: 'อัปเดตสถานะแล้ว', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'อัปเดตสถานะไม่สำเร็จ' })
    }
  }

  // Update shipping number
  const handleUpdateShipping = async (orderId: string, shippingNumber: string) => {
    if (!orderId || !shippingNumber) return
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, shippingNumber }),
      })
      // Handle error response (400)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        Swal.fire({ icon: 'error', title: 'บันทึกเลขขนส่งไม่สำเร็จ', text: err?.message || 'เกิดข้อผิดพลาด' })
        return
      }
      fetchOrders()
      Swal.fire({ icon: 'success', title: 'บันทึกเลขขนส่งแล้ว', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'บันทึกเลขขนส่งไม่สำเร็จ' })
    }
  }

  // Add delete order function
  const handleDeleteOrder = async (orderId: string) => {
    if (!orderId) return
    const result = await Swal.fire({
      title: 'ยืนยันการลบคำสั่งซื้อ?',
      text: 'การลบนี้จะไม่สามารถย้อนกลับได้',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    })
    if (result.isConfirmed) {
      await fetch(`/api/orders?id=${orderId}`, { method: 'DELETE' })
      fetchOrders()
      Swal.fire({ icon: 'success', title: 'ลบคำสั่งซื้อแล้ว', timer: 1200, showConfirmButton: false })
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-50 to-amber-50">
      {!isAuth ? (
        <div className="max-w-md mx-auto px-6 pt-20 pb-16">
          <div className="rounded-2xl border border-orange-200 bg-white/90 backdrop-blur shadow-xl p-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-orange-700 text-center">เข้าสู่ระบบผู้ดูแล</h2>
            <p className="text-sm text-slate-600 text-center mt-1 mb-6">กรอกชื่อผู้ใช้และรหัสผ่านเพื่อจัดการระบบ</p>
            <form onSubmit={handleAuth} className="grid gap-3">
              <input
                type="text"
                placeholder="Admin Username"
                className="border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={adminUser}
                onChange={e => setAdminUser(e.target.value)}
                autoComplete="username"
              />
              <input
                type="password"
                placeholder="Admin Password"
                className="border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                autoComplete="current-password"
              />
              <button
                className="mt-2 h-11 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-white font-semibold shadow hover:from-orange-600 hover:to-amber-500 transition-all"
                type="submit"
              >
                เข้าสู่ระบบ
              </button>
            </form>
            {authError && <div className="text-red-600 text-center font-medium mt-3">{authError}</div>}
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Top heading */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-orange-700 tracking-tight">Admin Console</h1>
              <p className="text-slate-600">จัดการแบนเนอร์ หมวดหมู่ และสินค้า</p>
            </div>
            <div className="flex gap-2">
              <StatPill label="แบนเนอร์" value={bannerCount} />
              <StatPill label="หมวดหมู่" value={categoryCount} />
              <StatPill label="สินค้า" value={productCount} />
            </div>
          </div>

          {/* Tabs */}
          <div className="sticky top-0 z-10 bg-orange-50/60 backdrop-blur pb-3 -mx-4 px-4">
            <div className="inline-flex gap-2 p-1 rounded-full border border-orange-200 bg-white shadow-sm">
              <TabButton active={tab === 'banner'} onClick={() => setTab('banner')}>แบนเนอร์</TabButton>
              <TabButton active={tab === 'category'} onClick={() => setTab('category')}>หมวดหมู่</TabButton>
              <TabButton active={tab === 'product'} onClick={() => setTab('product')}>เพิ่มสินค้า</TabButton>
              <TabButton active={tab === 'list'} onClick={() => setTab('list')}>รายการสินค้า</TabButton>
              <TabButton active={tab === 'orders'} onClick={() => setTab('orders')}>คำสั่งซื้อใหม่</TabButton>
            </div>
          </div>

          {/* Content */}
          <div className="mt-6 grid gap-8">
            {tab === 'banner' && (
              <SectionCard title="อัปโหลดแบนเนอร์" subtitle="รองรับรูปภาพทุกขนาด (แนะนำ 16:9 หรือ 21:9)">
                <form onSubmit={handleBannerUpload} className="grid gap-4">
                  <label
                    ref={dropRef}
                    onDragOver={(e) => { e.preventDefault(); dropRef.current?.classList.add('ring-2') }}
                    onDragLeave={() => dropRef.current?.classList.remove('ring-2')}
                    onDrop={(e) => { e.preventDefault(); dropRef.current?.classList.remove('ring-2'); onDropFiles(e.dataTransfer.files) }}
                    className="grid place-items-center h-40 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 text-orange-700 cursor-pointer hover:bg-orange-50 transition ring-orange-300"
                  >
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} />
                    {bannerFile ? (
                      <div className="text-center">
                        <div className="text-sm font-semibold">เลือกไฟล์แล้ว</div>
                        <div className="text-xs text-slate-600">{bannerFile.name}</div>
                      </div>
                    ) : (
                      <div className="text-center text-sm">
                        <div className="font-semibold">ลากรูปมาวาง หรือคลิกเพื่อเลือก</div>
                        <div className="text-slate-600 mt-1">ขนาดไฟล์ไม่ควรใหญ่เกินไปเพื่อความเร็ว</div>
                      </div>
                    )}
                  </label>

                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" checked={isSmallBanner} onChange={e => setIsSmallBanner(e.target.checked)} />
                    ใช้เป็นแบนเนอร์เล็ก (วางด้านล่าง)
                  </label>

                  <div className="flex flex-wrap items-center gap-3">
                    <button type="submit" className="h-11 px-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold shadow hover:from-blue-600 hover:to-cyan-500">
                      อัปโหลด
                    </button>
                    {bannerUploadError && <span className="text-red-600 font-medium">{bannerUploadError}</span>}
                  </div>
                </form>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {banners.map(b => {
                    let imgSrc = '';
                    if (b.url) {
                      // If url is base64 (starts with "data:"), use directly
                      imgSrc = b.url.startsWith('data:') ? b.url
                        : b.url.startsWith('http') ? b.url
                        : b.url.startsWith('/uploads/') ? b.url
                        : b.url.startsWith('/banners/') ? b.url
                        : `/banners/${b.url.replace(/^\/?banners\//, '')}`;
                    } else if ((b as any).icon) {
                      imgSrc = b.url.startsWith('data:') ? b.url
                        : b.url.startsWith('http') ? b.url
                        : b.url.startsWith('/uploads/') ? b.url
                        : b.url.startsWith('/banners/') ? b.url
                        : `/banners/${b.url.replace(/^\/?banners\//, '')}`;
                    } else if ((b as any).icon) {
                      imgSrc = (b as any).icon.startsWith('data:') ? (b as any).icon
                        : (b as any).icon.startsWith('http') ? (b as any).icon
                        : (b as any).icon.startsWith('/uploads/') ? (b as any).icon
                        : (b as any).icon.startsWith('/banners/') ? (b as any).icon
                        : `/banners/${(b as any).icon.replace(/^\/?banners\//, '')}`;
                    }
                    return (
                      <div key={b._id} className="group rounded-xl border border-orange-200 overflow-hidden bg-white shadow-sm">
                        {imgSrc ? (
                          <img src={imgSrc} alt="banner" className="h-28 w-full object-cover" />
                        ) : (
                          <div className="h-28 w-full grid place-items-center text-slate-400 text-sm border rounded">ไม่มีรูป</div>
                        )}
                        <div className="p-2 flex justify-end">
                          <button onClick={() => handleDeleteBanner(b._id)} className="text-xs text-red-600 hover:underline">ลบ</button>
                        </div>
                      </div>
                    );
                  })}
                  {banners.length === 0 && <div className="text-slate-500 text-sm">ยังไม่มีแบนเนอร์</div>}
                </div>
              </SectionCard>
            )}

            {tab === 'category' && (
              <SectionCard title="จัดการหมวดหมู่สินค้า" subtitle="เพิ่ม/ลบหมวดหมู่และไอคอนได้">
                <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-2">
                  <input
                    className="flex-1 border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="เพิ่มหมวดหมู่ใหม่"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    className="border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    onChange={e => setCategoryIcon(e.target.files?.[0] || null)}
                  />
                  <button type="submit" disabled={isAddingCategory} className="h-11 px-5 rounded-full bg-gradient-to-r from-green-500 to-lime-400 text-white font-semibold shadow hover:from-green-600 hover:to-lime-500">
                    {isAddingCategory ? 'กำลังเพิ่ม...' : 'เพิ่มหมวดหมู่'}
                  </button>
                </form>
                {categoryError && <div className="text-red-600 mt-2">{categoryError}</div>}

                <div className="mt-5 flex flex-wrap gap-3">
                  {categories.length ? categories.map((cat, idx) => (
                    <span key={cat.name || String(idx)} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 shadow-sm">
                      {cat.icon && <img src={cat.icon} alt={cat.name || 'icon'} className="w-6 h-6 rounded-full object-cover border" />}
                      {cat.name || <em className="text-slate-400">ไม่มีชื่อ</em>}
                      <button
                        type="button"
                        className="ml-1 text-xs text-red-600 hover:underline"
                        onClick={async () => {
                          if (cat.name && confirm(`ต้องการลบหมวดหมู่ "${cat.name}" หรือไม่?`)) {
                            await fetch(`/api/categories?name=${encodeURIComponent(cat.name)}`, { method: 'DELETE' })
                            setCategories(arr => arr.filter(c => c.name !== cat.name))
                          }
                        }}
                      >
                        ลบ
                      </button>
                    </span>
                  )) : <span className="text-slate-500">ยังไม่มีหมวดหมู่</span>}
                </div>
              </SectionCard>
            )}

            {tab === 'product' && (
              <SectionCard title="เพิ่มสินค้าใหม่" subtitle="กรอกข้อมูลและอัปโหลดรูปภาพหลายรูปได้">
                <form onSubmit={handleProductUpload} encType="multipart/form-data" className="grid gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      className="border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="ชื่อสินค้า"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                    <input
                      type="number"
                      className="border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="ราคาสินค้า"
                      value={price}
                      onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                    />
                    <textarea
                      className="md:col-span-2 border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="รายละเอียดสินค้า"
                      rows={3}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                    <select
                      className="border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value)}
                      required
                    >
                      <option value="">เลือกหมวดหมู่</option>
                      {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                    </select>
                  </div>

                  {/* Dropzone + preview */}
                  <div>
                    <label
                      className="grid place-items-center h-40 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 text-orange-700 cursor-pointer hover:bg-orange-50 transition"
                      onDragOver={(e) => { e.preventDefault() }}
                      onDrop={(e) => { e.preventDefault(); onDropFiles(e.dataTransfer.files) }}
                    >
                      <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onDropFiles(e.target.files)} />
                      <div className="text-center text-sm">
                        <div className="font-semibold">ลากรูปมาวาง หรือคลิกเพื่อเลือก</div>
                        <div className="text-slate-600 mt-1">รองรับหลายรูปพร้อมกัน</div>
                      </div>
                    </label>

                    {productFiles.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-3">
                        {productFiles.map((file, idx) => (
                          <div key={idx} className="relative group">
                            <img src={URL.createObjectURL(file)} alt={`preview-${idx}`} className="h-24 w-24 object-contain bg-white rounded border shadow" />
                            <button
                              type="button"
                              className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 grid place-items-center text-xs opacity-90 hover:opacity-100"
                              onClick={() => setProductFiles(arr => arr.filter((_, i) => i !== idx))}
                              title="ลบรูปนี้"
                            >×</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product options */}
                  <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
                    <div className="flex gap-2 mb-3">
                      <input
                        className="border border-orange-200 rounded-xl p-2 flex-1 focus:outline-none focus:ring-2 focus:ring-orange-400"
                        placeholder="ชื่อตัวเลือก (เช่น สี, ขนาด)"
                        value={optionName}
                        onChange={e => setOptionName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOption() } }}
                      />
                      <button type="button" className="px-4 rounded-full bg-orange-600 text-white font-semibold hover:bg-orange-700" onClick={addOption}>
                        เพิ่มตัวเลือก
                      </button>
                    </div>

                    {options.map((opt, idx) => (
                      <div key={idx} className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-orange-700">{opt.name}</span>
                          <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => removeOption(idx)}>
                            ลบตัวเลือก
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {opt.values.map((val, vIdx) => (
                            <span key={vIdx} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border shadow-sm">
                              {val}
                              <button type="button" className="text-xs text-red-500 hover:underline" onClick={() => removeOptionValue(idx, vIdx)}>
                                ลบ
                              </button>
                            </span>
                          ))}

                          {optionEditIdx === idx ? (
                            <>
                              <input
                                className="border border-orange-200 rounded-lg p-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                                placeholder="เพิ่มค่า"
                                value={optionValue}
                                onChange={e => setOptionValue(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOptionValue(idx) } }}
                              />
                              <button type="button" className="px-2 py-1 rounded bg-green-600 text-white text-xs" onClick={() => addOptionValue(idx)}>เพิ่ม</button>
                              <button type="button" className="text-xs text-slate-500" onClick={() => { setOptionEditIdx(null); setOptionValue('') }}>ยกเลิก</button>
                            </>
                          ) : (
                            <button type="button" className="text-xs text-blue-600 underline" onClick={() => { setOptionEditIdx(idx); setOptionValue('') }}>
                              + เพิ่มค่า
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      className="h-12 px-8 rounded-full bg-gradient-to-r from-green-500 to-lime-400 text-white font-bold shadow-lg hover:from-green-600 hover:to-lime-500 transition-all"
                      disabled={productFiles.length === 0}
                    >
                      เพิ่มสินค้า
                    </button>
                    {productFiles.length === 0 && <span className="text-slate-500 text-sm">* กรุณาเลือกรูปอย่างน้อย 1 รูป</span>}
                  </div>
                </form>
              </SectionCard>
            )}

            {tab === 'list' && (
              <SectionCard title="รายการสินค้า" subtitle="แก้ไข/ลบสินค้าได้จากที่นี่">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {products.map(p => (
                    <div key={p._id} className="rounded-2xl border border-orange-200 bg-white shadow-sm p-5 hover:shadow-md transition">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-orange-700">{p.name}</h3>
                          <div className="text-green-700 font-semibold">{p.price.toLocaleString()} บาท</div>
                          <div className="text-xs text-slate-500 mt-1">หมวดหมู่: {p.category || '-'}</div>
                        </div>
                        <button onClick={() => handleDeleteProduct(p._id)} className="px-3 h-9 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700">
                          ลบ
                        </button>
                      </div>

                      {/* images */}
                      <div className="mt-3">
                        {p.images?.length ? (
                          <div className="flex gap-2 overflow-x-auto">
                            {p.images.map((img, idx) => (
                              <img key={idx} src={img} alt={`${p.name}-${idx}`} className="h-20 w-20 object-contain rounded border bg-white shadow-sm" />
                            ))}
                          </div>
                        ) : p.image ? (
                          <img src={p.image} alt={p.name} className="h-40 w-full object-contain rounded border bg-white shadow-sm" />
                        ) : (
                          <div className="h-20 grid place-items-center text-slate-400 text-sm border rounded">ไม่มีรูป</div>
                        )}
                      </div>

                      {p.description && <p className="mt-3 text-sm text-slate-700 line-clamp-3">{p.description}</p>}
                    </div>
                  ))}
                </div>
                {products.length === 0 && <div className="text-slate-500">ยังไม่มีสินค้า</div>}
              </SectionCard>
            )}

            {tab === 'orders' && (
              <SectionCard title="คำสั่งซื้อใหม่" subtitle="รายการคำสั่งซื้อจากลูกค้า">
                {orders.length === 0 ? (
                  <div className="text-slate-500">ยังไม่มีคำสั่งซื้อ</div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order, idx) => {
                      const orderId = order._id ?? String(idx)
                      // Status badge
                      const statusBadge = (status: string) => {
                        switch (status) {
                          case 'pending':
                            return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-bold">รอดำเนินการ</span>
                          case 'processing':
                            return <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 font-bold">ดำเนินการอยู่</span>
                          case 'shipped':
                            return <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-bold">จัดส่งแล้ว</span>
                          case 'paid':
                            return <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 font-bold">ชำระเงินแล้ว</span>
                          case 'completed':
                            return <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">สำเร็จ</span>
                          case 'cancelled':
                            return <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 font-bold">ยกเลิก</span>
                          default:
                            return <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-bold">{status}</span>
                        }
                      }
                      return (
                        <div key={orderId} className="bg-white rounded-xl shadow border border-orange-100 p-5">
                          <div className="font-semibold text-orange-700 mb-2">ชื่อผู้รับ: {order.name}</div>
                          <div className="mb-1">ที่อยู่: {order.address}</div>
                          <div className="mb-1">เบอร์โทร: {order.phone}</div>
                          <div className="mb-2">วันที่สั่งซื้อ: {order.createdAt ? new Date(order.createdAt).toLocaleString() : '-'}</div>
                          <div className="mb-2 flex items-center gap-2">
                            <span className="font-semibold">สถานะ:</span>
                            {statusBadge(order.status)}
                            <select
                              className="ml-2 px-2 py-1 rounded border bg-orange-50 text-orange-800 font-semibold"
                              value={statusInputs[orderId] ?? order.status ?? 'pending'}
                              onChange={e => {
                                setStatusInputs(inputs => ({ ...inputs, [orderId]: e.target.value }))
                                handleUpdateStatus(order._id, e.target.value)
                              }}
                            >
                              <option value="pending">รอดำเนินการ</option>
                              <option value="processing">ดำเนินการอยู่</option>
                              <option value="shipped">จัดส่งแล้ว</option>
                            </select>
                            {/* Delete order button */}
                            <button
                              className="ml-2 px-3 py-1 rounded bg-red-600 text-white font-semibold"
                              onClick={() => handleDeleteOrder(order._id)}
                              type="button"
                            >
                              ลบคำสั่งซื้อ
                            </button>
                          </div>
                          <div className="font-semibold mb-1">รายการสินค้า:</div>
                          <ul className="bg-orange-50 rounded p-3 mb-3">
                            {order.items.map((item: any, i: number) => (
                              <li key={i} className="flex justify-between py-1">
                                <span>{item.name}</span>
                                <span>{item.price.toLocaleString()} บาท</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 flex flex-col gap-2">
                            <div>
                              <label className="font-semibold mr-2">เลขขนส่ง:</label>
                              <input
                                type="text"
                                value={shippingInputs[orderId] ?? ''}
                                onChange={e => setShippingInputs(inputs => ({ ...inputs, [orderId]: e.target.value }))}
                                className="border rounded px-2 py-1 mr-2"
                                placeholder="กรอกเลขขนส่ง"
                              />
                              <button
                                className="px-4 py-1 rounded bg-green-600 text-white font-semibold"
                                onClick={() => handleUpdateShipping(order._id, shippingInputs[orderId] ?? '')}
                                type="button"
                              >
                                บันทึกเลขขนส่ง
                              </button>
                            </div>
                            {order.shippingNumber && (
                              <div className="flex items-center gap-2 mt-1 text-green-700 font-bold">
                                <span>เลขขนส่งล่าสุด:</span>
                                <span className="bg-green-100 px-3 py-1 rounded-full">{order.shippingNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </SectionCard>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------ UI atoms ------------------------------ */
function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-orange-200 bg-white/90 backdrop-blur shadow-xl p-6">
      <h2 className="text-2xl font-bold text-orange-700">{title}</h2>
      {subtitle && <p className="text-slate-600 text-sm mt-1">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}
function TabButton({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-10 px-5 rounded-full text-sm font-semibold transition ${active
        ? 'bg-orange-600 text-white shadow'
        : 'bg-white text-orange-700 hover:bg-orange-50 border border-orange-200'}`}
    >
      {children}
    </button>
  )
}
function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-white border border-orange-200 text-orange-800 shadow-sm">
      <span className="text-sm">{label}</span>
      <span className="text-sm font-bold bg-orange-600 text-white rounded-full px-2">{value}</span>
    </div>
  )
}
