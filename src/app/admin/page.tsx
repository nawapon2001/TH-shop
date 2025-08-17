'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Swal from 'sweetalert2'
import OrderChatPanel from '@/components/OrderChatPanel'
import { MessageCircle } from 'lucide-react'
import {
  Settings, LayoutGrid, Image as ImageIcon, Tag, PackagePlus, ListOrdered, Truck,
  RefreshCw, Upload, Trash2, LogIn, Search, CalendarClock,
  User, Phone, MapPin, Package, Filter, SortDesc, CheckCircle2, XCircle, BadgeCheck, Loader2, Copy
} from 'lucide-react'

/* ---------- Types ---------- */
type ProductOption = { name: string; values: string[] }
type Product = { _id: string; name: string; price: number; image?: string; images?: string[]; description?: string; category?: string; options?: ProductOption[] }
type Banner = { _id: string; url?: string; image?: string; isSmall?: boolean }

type Category = { name: string; icon?: string }
type TabKey = 'orders' | 'banner' | 'category' | 'product' | 'list'

type OrderItem = { name: string; price: number; image?: string }
type Amounts = { subtotal?: number; shipCost?: number; codFee?: number; total?: number }
type OrderStatus = 'pending'|'processing'|'paid'|'shipped'|'completed'|'cancelled'
type Order = {
  _id: string; name: string; address: string; phone: string; items: OrderItem[];
  status?: OrderStatus; shippingNumber?: string; createdAt?: string; amounts?: Amounts;
  delivery?: 'standard'|'express'; payment?: 'cod'|'transfer'|'card'
}

type AdminCred = { username: string; password: string }

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'รอดำเนินการ', processing: 'กำลังจัดการ', paid: 'ชำระเงินแล้ว',
  shipped: 'จัดส่งแล้ว', completed: 'สำเร็จ', cancelled: 'ยกเลิก',
}
const STATUS_ORDER: OrderStatus[] = ['pending','processing','paid','shipped','completed','cancelled']

/* ---------- Option helpers ---------- */
const ensureString = (v: unknown) => (v == null ? '' : String(v).trim())

function sanitizeOptions(options: ProductOption[]): ProductOption[] {
  const seenNames = new Set<string>()
  const cleaned = options
    .map(o => ({
      name: ensureString(o.name),
      values: Array.from(new Set((o.values || []).map(ensureString).filter(Boolean)))
    }))
    .filter(o => o.name && o.values.length > 0)

  return cleaned.map(o => {
    let name = o.name
    let n = 2
    while (seenNames.has(name)) { name = `${o.name} (${n++})` }
    seenNames.add(name)
    return { ...o, name }
  })
}

/* ---------- Admin storage helpers (demo only) ---------- */
const ADMIN_STORE_KEY = 'adminUsers'
const loadAdmins = (): AdminCred[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(ADMIN_STORE_KEY) : null
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((u: any) => u && typeof u.username === 'string' && typeof u.password === 'string')) {
      return parsed
    }
    return []
  } catch { return [] }
}
const saveAdmins = (list: AdminCred[]) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADMIN_STORE_KEY, JSON.stringify(list))
}

/* ---------- หน้า Admin ---------- */
export default function AdminPage() {
  /* ---------- Auth (demo) ---------- */
  const [adminUser, setAdminUser] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [isAuth, setIsAuth] = useState(false)
  const [authError, setAuthError] = useState('')

  const DEFAULT_ADMINS: AdminCred[] = [{ username: 'nawapon1200', password: '055030376' }]
  const [adminUsers, setAdminUsers] = useState<AdminCred[]>(DEFAULT_ADMINS)

  // Load/persist admins
  useEffect(() => {
    if (typeof window === 'undefined') return
    const existing = loadAdmins()
    if (existing.length === 0) {
      // seed defaults once
      saveAdmins(DEFAULT_ADMINS)
      setAdminUsers(DEFAULT_ADMINS)
    } else {
      setAdminUsers(existing)
    }
  }, [])

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    const found = adminUsers.find(u => u.username === adminUser && u.password === adminPass)
    if (found) {
      setIsAuth(true); setAuthError('')
      Swal.fire({ icon: 'success', title: 'เข้าสู่ระบบสำเร็จ', timer: 1200, showConfirmButton: false })
    } else {
      setAuthError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง')
      Swal.fire({ icon: 'error', title: 'เข้าสู่ระบบไม่สำเร็จ', text: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' })
    }
  }

  // Create new admin (persist to localStorage)
  const [newAdminUser, setNewAdminUser] = useState('')
  const [newAdminPass, setNewAdminPass] = useState('')
  const [addAdminError, setAddAdminError] = useState('')

  const handleAddAdminUser = (e: React.FormEvent) => {
    e.preventDefault()
    setAddAdminError('')
    const u = newAdminUser.trim(); const p = newAdminPass.trim()
    if (!u || !p) { setAddAdminError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน'); return }
    if (u.length < 4 || p.length < 4) { setAddAdminError('ความยาวอย่างน้อย 4 ตัวอักษร'); return }
    if (adminUsers.some(x => x.username.toLowerCase() === u.toLowerCase())) { setAddAdminError('ชื่อผู้ใช้ซ้ำ'); return }

    const next = [...adminUsers, { username: u, password: p }]
    setAdminUsers(next)
    saveAdmins(next)
    setNewAdminUser(''); setNewAdminPass('')
    Swal.fire({ icon: 'success', title: 'เพิ่มผู้ดูแลระบบแล้ว', timer: 1200, showConfirmButton: false })
  }

  const handleRemoveAdmin = async (username: string) => {
    if (adminUsers.length <= 1) {
      return Swal.fire({ icon: 'warning', title: 'ลบไม่ได้', text: 'ต้องมีผู้ดูแลอย่างน้อย 1 คน' })
    }
    const ok = await Swal.fire({ icon: 'warning', title: `ลบผู้ดูแล “${username}” ?`, showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก' })
    if (!ok.isConfirmed) return
    const next = adminUsers.filter(u => u.username !== username)
    setAdminUsers(next)
    saveAdmins(next)
    Swal.fire({ icon: 'success', title: 'ลบแล้ว', timer: 900, showConfirmButton: false })
  }

  /* ---------- Data ---------- */
  const [tab, setTab] = useState<TabKey>('orders')
  const [loading, setLoading] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  const productCount = products.length
  const bannerCount = banners.length
  const categoryCount = categories.length

  /* ---------- API helpers ---------- */
  const fetchProducts = async () => { try { const r = await fetch('/api/products'); const d = await r.json(); setProducts(Array.isArray(d)?d:[]) } catch { setProducts([]) } }
  const fetchBanners = async () => { try { const r = await fetch('/api/banners', { cache: 'no-store' }); const d = await r.json(); setBanners(Array.isArray(d)?d:[]) } catch { setBanners([]) } }
  const fetchCategories = async () => { try {
    const r = await fetch('/api/categories'); const d = await r.json()
    if (Array.isArray(d) && typeof d[0] === 'string') setCategories(d.map((name:string)=>({ name })))
    else setCategories(Array.isArray(d)?d:[])
  } catch { setCategories([]) } }
  const fetchOrders = async () => { try { const r = await fetch('/api/orders', { cache: 'no-store' }); const d = await r.json(); setOrders(Array.isArray(d)?d:[]) } catch { setOrders([]) } }
  const refreshAll = async () => { setLoading(true); await Promise.all([fetchProducts(), fetchBanners(), fetchCategories(), fetchOrders()]); setLoading(false) }
  useEffect(()=>{ refreshAll() }, [])

  /* ---------- Banner ops ---------- */
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [isSmallBanner, setIsSmallBanner] = useState(false)
  const [bannerUploadError, setBannerUploadError] = useState('')
  const bannerDropRef = useRef<HTMLLabelElement>(null)
  const handleBannerUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setBannerUploadError('')
    if (!bannerFile) return setBannerUploadError('กรุณาเลือกไฟล์แบนเนอร์')
    const form = new FormData()
    form.append('banner', bannerFile); form.append('isSmall', isSmallBanner ? '1' : '0')
    const res = await fetch('/api/banners', { method: 'POST', body: form })
    if (!res.ok) setBannerUploadError('อัปโหลดแบนเนอร์ไม่สำเร็จ')
    else { setBannerFile(null); setIsSmallBanner(false); await fetchBanners(); Swal.fire({ icon: 'success', title: 'อัปโหลดแล้ว', timer: 1200, showConfirmButton: false }) }
  }
  const handleDeleteBanner = async (id: string) => {
    const result = await Swal.fire({ title: 'ยืนยันการลบแบนเนอร์?', icon: 'warning', showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก' })
    if (!result.isConfirmed) return
    await fetch(`/api/banners?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    await fetchBanners()
    Swal.fire({ icon: 'success', title: 'ลบแล้ว', timer: 1200, showConfirmButton: false })
  }

  /* ---------- Category ops ---------- */
  const [category, setCategory] = useState('')
  const [categoryIcon, setCategoryIcon] = useState<File | null>(null)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [categoryError, setCategoryError] = useState('')
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault(); setCategoryError('')
    if (!category.trim()) { setCategoryError('กรุณากรอกชื่อหมวดหมู่'); return Swal.fire({ icon: 'warning', title: 'กรุณากรอกชื่อหมวดหมู่' }) }
    setIsAddingCategory(true)
    const form = new FormData(); form.append('name', category.trim()); if (categoryIcon) form.append('icon', categoryIcon)
    try {
      const res = await fetch('/api/categories', { method: 'POST', body: form })
      if (!res.ok) { const err = await res.json().catch(()=>({})); setCategoryError(err?.message || 'เพิ่มหมวดหมู่ไม่สำเร็จ'); Swal.fire({ icon: 'error', title: 'เพิ่มหมวดหมู่ไม่สำเร็จ', text: err?.message || '' }) }
      else { setCategory(''); setCategoryIcon(null); await fetchCategories(); Swal.fire({ icon: 'success', title: 'เพิ่มหมวดหมู่สำเร็จ', timer: 1200, showConfirmButton: false }) }
    } finally { setIsAddingCategory(false) }
  }

  /* ---------- Product ops (Option Builder) ---------- */
  const [name, setName] = useState(''); const [price, setPrice] = useState<number|''>(''); const [description, setDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(''); const [productFiles, setProductFiles] = useState<File[]>([])
  const [options, setOptions] = useState<ProductOption[]>([])

  const onDropProductFiles = (files: FileList | null) => {
    if (!files?.length) return; const list = Array.from(files)
    setProductFiles(prev => [...prev, ...list.filter(f => !prev.some(p => p.name===f.name && p.size===f.size))])
  }

  const handleProductUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !price || !selectedCategory || productFiles.length===0) {
      return Swal.fire({ icon: 'warning', title: 'ข้อมูลไม่ครบถ้วน', text: 'กรุณากรอกข้อมูลให้ครบถ้วนและเลือกรูปภาพ' })
    }
    const form = new FormData()
    form.append('name', name)
    form.append('price', String(price))
    form.append('category', selectedCategory)
    form.append('description', description)
    productFiles.forEach(f => form.append('images', f))

    const cleanOptions = sanitizeOptions(options)
    form.append('options', JSON.stringify(cleanOptions))

    const res = await fetch('/api/products', { method: 'POST', body: form })
    if (res.ok) {
      setName(''); setPrice(''); setSelectedCategory(''); setDescription(''); setProductFiles([]); setOptions([])
      await fetchProducts()
      Swal.fire({ icon: 'success', title: 'เพิ่มสินค้าสำเร็จ', timer: 1500, showConfirmButton: false })
    } else {
      const err = await res.json().catch(()=>({}))
      Swal.fire({ icon: 'error', title: 'เพิ่มสินค้าไม่สำเร็จ', text: err?.message || 'เพิ่มสินค้าไม่สำเร็จ' })
    }
  }

  /* ---------- Orders + chat ---------- */
  const [selectedOrderId, setSelectedOrderId] = useState<string|null>(null)
  const selectedOrder = useMemo(()=> orders.find(o=>o._id===selectedOrderId), [orders, selectedOrderId])

  const handleDeleteOrder = async (orderId: string) => {
    if (!orderId) return
    const result = await Swal.fire({ title: 'ยืนยันการลบคำสั่งซื้อ?', text: 'การลบนี้จะไม่สามารถย้อนกลับได้', icon: 'warning', showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก' })
    if (!result.isConfirmed) return
    try {
      const res = await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await fetchOrders()
      if (selectedOrderId === orderId) setSelectedOrderId(null)
      Swal.fire({ icon: 'success', title: 'ลบคำสั่งซื้อแล้ว', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'ลบคำสั่งซื้อไม่สำเร็จ' })
    }
  }
  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    try { const res = await fetch('/api/orders', { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ id, status }) }); if (!res.ok) throw new Error(); await fetchOrders(); Swal.fire({ icon: 'success', title: 'อัปเดตสถานะแล้ว', timer: 1000, showConfirmButton:false }) } catch { Swal.fire({ icon: 'error', title: 'อัปเดตสถานะไม่สำเร็จ' }) }
  }
  const updateShipping = async (id: string, shippingNumber: string) => {
    if (!shippingNumber.trim()) return
    try { const res = await fetch('/api/orders', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, shippingNumber }) }); if (!res.ok) throw new Error(); await fetchOrders(); Swal.fire({ icon: 'success', title: 'บันทึกเลขขนส่งแล้ว', timer: 1000, showConfirmButton:false }) } catch { Swal.fire({ icon: 'error', title: 'บันทึกเลขขนส่งไม่สำเร็จ' }) }
  }

  // ลบสินค้า
  const handleDeleteProduct = async (id: string) => {
    if (!id) return
    const result = await Swal.fire({ title: 'ยืนยันการลบสินค้า?', icon: 'warning', showCancelButton: true, confirmButtonText: 'ลบ', cancelButtonText: 'ยกเลิก' })
    if (!result.isConfirmed) return
    try {
      const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await fetchProducts()
      Swal.fire({ icon: 'success', title: 'ลบสินค้าแล้ว', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'ลบสินค้าไม่สำเร็จ' })
    }
  }

  if (!isAuth) {
    // แสดงเฉพาะฟอร์มล็อกอินเท่านั้น (ไม่ให้สร้าง admin ก่อนล็อกอิน)
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="w-full max-w-md rounded-2xl border border-orange-200 bg-white/90 backdrop-blur shadow-xl p-8">
          <div className="flex items-center gap-2 text-orange-700 mb-2"><LogIn className="w-5 h-5" /><h2 className="text-2xl font-extrabold tracking-tight">เข้าสู่ระบบผู้ดูแล</h2></div>
          <p className="text-sm text-slate-600 mb-6">กรอกชื่อผู้ใช้และรหัสผ่านเพื่อจัดการระบบ</p>
          <form onSubmit={handleAuth} className="grid gap-3">
            <input type="text" placeholder="Admin Username" className="border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400" value={adminUser} onChange={(e)=>setAdminUser(e.target.value)} />
            <input type="password" placeholder="Admin Password" className="border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400" value={adminPass} onChange={(e)=>setAdminPass(e.target.value)} />
            <button className="mt-2 h-11 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-white font-semibold shadow hover:from-orange-600 hover:to-amber-500 transition-all" type="submit">เข้าสู่ระบบ</button>
          </form>
          {authError && <div className="text-red-600 text-center font-medium mt-3">{authError}</div>}
        </div>
      </div>
    )
  }

  // หลังจากเข้าสู่ระบบแล้ว (isAuth = true) ให้แสดงฟอร์มสร้างผู้ดูแลระบบใหม่
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* ฟอร์มสร้างผู้ดูแลระบบใหม่ (แสดงเฉพาะหลังเข้าสู่ระบบ) */}
      <div className="max-w-xl mx-auto mt-8 mb-4 bg-white/90 rounded-2xl border border-orange-200 shadow p-6">
        <h3 className="text-lg font-bold text-orange-700 mb-2">สร้างผู้ดูแลระบบใหม่</h3>
        <form onSubmit={handleAddAdminUser} className="grid gap-2">
          <input type="text" placeholder="New Admin Username" className="border border-orange-200 rounded-xl p-3" value={newAdminUser} onChange={e=>setNewAdminUser(e.target.value)} />
          <input type="password" placeholder="New Admin Password" className="border border-orange-200 rounded-xl p-3" value={newAdminPass} onChange={e=>setNewAdminPass(e.target.value)} />
          <button type="submit" className="h-10 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-white font-semibold shadow">เพิ่มผู้ดูแลระบบ</button>
        </form>
        {addAdminError && <div className="text-red-600 text-center font-medium mt-2">{addAdminError}</div>}
        <div className="mt-4 text-xs text-slate-500">
          <div>รายชื่อผู้ดูแลระบบ:</div>
          <ul className="mt-1">
            {adminUsers.map((u, idx) => (
              <li key={u.username} className="mb-1 flex items-center justify-between">
                <span>{idx+1}. {u.username}</span>
                <button className="text-red-600 hover:underline" onClick={()=>handleRemoveAdmin(u.username)}>ลบ</button>
              </li>
            ))}
          </ul>
          <div className="mt-2">* เดโมนี้เก็บผู้ใช้ไว้ในเบราว์เซอร์ (localStorage)</div>
        </div>
      </div>
      <div className="mx-auto max-w-[1380px] grid lg:grid-cols-[280px_1fr_400px]">
        {/* Sidebar (left) */}
        <aside className="hidden lg:block sticky top-0 h-[100dvh] border-r border-orange-200 bg-white/70 backdrop-blur p-4">
          <div className="mb-4 flex items-center gap-2 text-orange-700"><LayoutGrid className="w-5 h-5" /><div className="font-extrabold">เมนูจัดการ</div></div>
          <nav className="grid gap-2">
            <NavButton icon={<Truck className="w-4 h-4" />} active={tab==='orders'} onClick={()=>setTab('orders')}>คำสั่งซื้อ</NavButton>
            <NavButton icon={<ImageIcon className="w-4 h-4" />} active={tab==='banner'} onClick={()=>setTab('banner')}>แบนเนอร์</NavButton>
            <NavButton icon={<Tag className="w-4 h-4" />} active={tab==='category'} onClick={()=>setTab('category')}>หมวดหมู่</NavButton>
            <NavButton icon={<PackagePlus className="w-4 h-4" />} active={tab==='product'} onClick={()=>setTab('product')}>เพิ่มสินค้า</NavButton>
            <NavButton icon={<ListOrdered className="w-4 h-4" />} active={tab==='list'} onClick={()=>setTab('list')}>รายการสินค้า</NavButton>
          </nav>
          <div className="mt-6 grid gap-2">
            <StatCard icon={<ImageIcon className='w-4 h-4' />} label="แบนเนอร์" value={bannerCount} />
            <StatCard icon={<Tag className='w-4 h-4' />} label="หมวดหมู่" value={categoryCount} />
            <StatCard icon={<PackagePlus className='w-4 h-4' />} label="สินค้า" value={productCount} />
          </div>
          <button onClick={refreshAll} className="mt-6 inline-flex w-full items-center justify-center gap-2 h-10 rounded-xl bg-white border border-orange-200 text-orange-700 hover:bg-orange-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} รีเฟรชทั้งหมด
          </button>
        </aside>

        {/* Main (center) */}
        <main className="px-4 py-6">
          {tab === 'orders' && (
            <OrdersSection
              loading={loading}
              orders={orders}
              selectedId={selectedOrderId}
              onSelect={(id)=>setSelectedOrderId(id)}
              onDelete={handleDeleteOrder}
              onUpdateStatus={updateOrderStatus}
              onUpdateShipping={updateShipping}
            />
          )}

          {tab === 'banner' && (
            <SectionCard title="อัปโหลดแบนเนอร์" subtitle="รองรับรูปทุกขนาด (แนะนำ 16:9 หรือ 21:9)">
              <form onSubmit={handleBannerUpload} className="grid gap-4">
                <label
                  ref={bannerDropRef}
                  onDragOver={(e)=>{ e.preventDefault(); bannerDropRef.current?.classList.add('ring-2') }}
                  onDragLeave={()=> bannerDropRef.current?.classList.remove('ring-2')}
                  onDrop={(e)=>{ e.preventDefault(); bannerDropRef.current?.classList.remove('ring-2'); const f=e.dataTransfer.files?.[0]; setBannerFile(f||null) }}
                  className="grid place-items-center h-44 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 text-orange-700 cursor-pointer hover:bg-orange-50 transition ring-orange-300"
                >
                  <input type="file" accept="image/*" className="hidden" onChange={(e)=>setBannerFile(e.target.files?.[0]||null)} />
                  {bannerFile ? (<div className="text-center"><div className="text-sm font-semibold">เลือกไฟล์แล้ว</div><div className="text-xs text-slate-600">{bannerFile.name}</div></div>)
                    : (<div className="text-center text-sm"><div className="font-semibold flex items-center justify-center gap-2"><Upload className='w-4 h-4'/> ลากรูปมาวาง หรือคลิกเพื่อเลือก</div><div className="text-slate-600 mt-1">ขนาดไฟล์ไม่ควรใหญ่เกินไปเพื่อความเร็ว</div></div>)}
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={isSmallBanner} onChange={(e)=>setIsSmallBanner(e.target.checked)} />ใช้เป็นแบนเนอร์เล็ก (วางด้านล่าง)</label>
                <div className="flex items-center gap-3"><button type="submit" className="h-11 px-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold shadow hover:from-blue-600 hover:to-cyan-500">อัปโหลด</button>{bannerUploadError && <span className="text-red-600 font-medium">{bannerUploadError}</span>}</div>
              </form>

              <div className="mt-6">
                <div className="text-sm text-slate-600 mb-2">ทั้งหมด {banners.length} รายการ</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {banners.map(b => {
                    const src = getBannerSrc(b)
                    return (
                      <div key={b._id} className="group rounded-xl border border-orange-200 overflow-hidden bg-white shadow-sm">
                        {src ? <img src={src} alt="banner" className="h-28 w-full object-cover" /> : <div className="h-28 grid place-items-center text-slate-400">ไม่มีรูป</div>}
                        <div className="p-2 flex items-center justify-between">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${b.isSmall ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{b.isSmall ? 'Small' : 'Main'}</span>
                          <button onClick={()=>handleDeleteBanner(b._id)} className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"><Trash2 className='w-3 h-3'/> ลบ</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </SectionCard>
          )}

          {tab === 'category' && (
            <SectionCard title="จัดการหมวดหมู่" subtitle="เพิ่ม/ลบหมวดหมู่และไอคอนได้">
              <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-2">
                <input className="flex-1 border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="เพิ่มหมวดหมู่ใหม่" value={category} onChange={e=>setCategory(e.target.value)} />
                <input type="file" accept="image/*" className="border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400" onChange={e=>setCategoryIcon(e.target.files?.[0]||null)} />
                <button type="submit" disabled={isAddingCategory} className="h-11 px-5 rounded-full bg-gradient-to-r from-green-500 to-lime-400 text-white font-semibold hover:from-green-600 hover:to-lime-500">{isAddingCategory ? 'กำลังเพิ่ม…' : 'เพิ่มหมวดหมู่'}</button>
              </form>
              {categoryError && <div className="text-red-600 mt-2">{categoryError}</div>}
              <div className="mt-5 flex flex-wrap gap-3">
                {categories.length ? categories.map((cat, idx) => (
                  <span key={cat.name || String(idx)} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 shadow-sm">
                    {cat.icon && <img src={cat.icon} alt={cat.name || 'icon'} className="w-6 h-6 rounded-full object-cover border" />}
                    {cat.name || <em className="text-slate-400">ไม่มีชื่อ</em>}
                    <button type="button" className="ml-1 text-xs text-red-600 hover:underline" onClick={async ()=>{
                      if (cat.name && confirm(`ต้องการลบหมวดหมู่ "${cat.name}" หรือไม่?`)) {
                        await fetch(`/api/categories?name=${encodeURIComponent(cat.name)}`, { method:'DELETE' })
                        await fetchCategories()
                      }
                    }}>ลบ</button>
                  </span>
                )) : <span className="text-slate-500">ยังไม่มีหมวดหมู่</span>}
              </div>
            </SectionCard>
          )}

          {tab === 'product' && (
            <SectionCard title="เพิ่มสินค้าใหม่" subtitle="กรอกข้อมูลและอัปโหลดรูปภาพหลายรูปได้">
              <form onSubmit={handleProductUpload} encType="multipart/form-data" className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input className="border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="ชื่อสินค้า" value={name} onChange={e=>setName(e.target.value)} required />
                  <input type="number" className="border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="ราคาสินค้า" value={price} onChange={e=>setPrice(e.target.value===''?'':Number(e.target.value))} required />
                  <textarea className="md:col-span-2 border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="รายละเอียดสินค้า" rows={3} value={description} onChange={e=>setDescription(e.target.value)} />
                  <select className="border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400" value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)} required>
                    <option value="">เลือกหมวดหมู่</option>
                    {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                  </select>
                </div>

                {/* อัปโหลดรูปภาพ */}
                <div>
                  <label className="grid place-items-center h-40 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 text-orange-700 cursor-pointer hover:bg-orange-50 transition"
                    onDragOver={(e)=>{e.preventDefault()}}
                    onDrop={(e)=>{e.preventDefault(); onDropProductFiles(e.dataTransfer.files)}}>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e)=>onDropProductFiles(e.target.files)} />
                    <div className="text-center text-sm"><div className="font-semibold">ลากรูปมาวาง หรือคลิกเพื่อเลือก</div><div className="text-slate-600 mt-1">รองรับหลายรูปพร้อมกัน</div></div>
                  </label>
                  {productFiles.length>0 && (
                    <div className="flex gap-2 flex-wrap mt-3">
                      {productFiles.map((file, idx)=>(
                        <div key={idx} className="relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={URL.createObjectURL(file)} alt={`preview-${idx}`} className="h-24 w-24 object-contain bg-white rounded border shadow" />
                          <button type="button" className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 grid place-items-center text-xs" onClick={()=>setProductFiles(arr=>arr.filter((_,i)=>i!==idx))}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ตัวเลือกสินค้า */}
                <OptionBuilder value={options} onChange={setOptions} />

                <div className="flex items-center gap-3">
                  <button className="h-12 px-8 rounded-full bg-gradient-to-r from-green-500 to-lime-400 text-white font-bold shadow-lg hover:from-green-600 hover:to-lime-500 transition-all" disabled={productFiles.length===0}>เพิ่มสินค้า</button>
                  {productFiles.length===0 && <span className="text-slate-500 text-sm">* กรุณาเลือกรูปอย่างน้อย 1 รูป</span>}
                </div>
              </form>
            </SectionCard>
          )}

          {tab === 'list' && (
            <ProductsList products={products} onRefresh={fetchProducts} onDelete={handleDeleteProduct} />
          )}
        </main>

        {/* Chat panel (right) */}
        <aside className="hidden lg:flex sticky top-0 h-[100dvh] flex-col border-l border-orange-200 bg-white/70 backdrop-blur">
          <OrderChatPanel orderId={selectedOrderId} />
        </aside>
      </div>
    </div>
  )
}

/* ---------- Orders center section ---------- */
function OrdersSection({
  loading, orders, selectedId, onSelect, onDelete, onUpdateStatus, onUpdateShipping
}:{
  loading: boolean
  orders: Order[]
  selectedId: string|null
  onSelect: (id: string)=>void
  onDelete: (id: string)=>void
  onUpdateStatus: (id: string, status: OrderStatus)=>void
  onUpdateShipping: (id: string, shippingNumber: string)=>void
}) {
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<'all'|OrderStatus>('all')
  const [sort, setSort] = useState<'newest'|'oldest'>('newest')
  const [shippingInputs, setShippingInputs] = useState<Record<string,string>>({})
  useEffect(()=>{ setShippingInputs(Object.fromEntries(orders.map(o=>[o._id, o.shippingNumber || '']))) },[orders])

  const filtered = useMemo(()=>{
    const kw = q.trim().toLowerCase()
    let list = orders
      .filter(o => status==='all' ? true : (o.status || 'pending') === status)
      .filter(o => !kw ? true : (
        o._id?.toLowerCase().includes(kw) ||
        o.name?.toLowerCase().includes(kw) ||
        o.phone?.toLowerCase().includes(kw) ||
        o.address?.toLowerCase().includes(kw) ||
        o.items?.some(it=>it.name?.toLowerCase().includes(kw))
      ))
    list = list.sort((a,b)=>{
      const da = new Date(a.createdAt || 0).getTime()
      const db = new Date(b.createdAt || 0).getTime()
      return sort==='newest' ? db - da : da - db
    })
    return list
  },[orders, q, status, sort])

  const fmtMoney = (n?: number) => n==null ? '—' : `฿${n.toLocaleString()}`
  const orderTotal = (o: Order) => o.amounts?.total ??
    o.items.reduce((s,it)=>s+(it.price||0),0) + (o.amounts?.shipCost ?? 0) + (o.amounts?.codFee ?? 0)

  return (
    <SectionCard title="คำสั่งซื้อทั้งหมด" subtitle="คลิกการ์ดเพื่อดูแชทที่แผงขวา • อัปเดตสถานะ/เลขขนส่งได้ทันที">
      <div className="sticky top-0 z-10 -mt-6 -mx-6 px-6 pt-6 pb-3 bg-white/90 backdrop-blur border-b border-orange-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="ค้นหา: ชื่อ/เบอร์/ที่อยู่/สินค้า/รหัสออเดอร์" className="h-11 w-full rounded-xl border border-orange-200 bg-white pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-orange-300" />
          </div>
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select value={status} onChange={(e)=>setStatus(e.target.value as any)} className="h-11 w-full appearance-none rounded-xl border border-orange-200 bg-white pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-orange-300">
              <option value="all">สถานะทั้งหมด</option>
              {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div className="relative">
            <SortDesc className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <select value={sort} onChange={(e)=>setSort(e.target.value as any)} className="h-11 w-full appearance-none rounded-xl border border-orange-200 bg-white pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-orange-300">
              <option value="newest">ใหม่ → เก่า</option>
              <option value="oldest">เก่า → ใหม่</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 mt-4">{Array.from({ length: 4 }).map((_,i)=>(<div key={i} className="h-36 rounded-2xl border border-orange-200 bg-orange-50/50 animate-pulse" />))}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-orange-200 bg-white p-10 text-center text-slate-500 mt-4">ไม่พบคำสั่งซื้อที่ตรงกับเงื่อนไข</div>
      ) : (
        <div className="space-y-6 mt-4">
          {filtered.map(o=>{
            const total = orderTotal(o)
            const created = o.createdAt ? new Date(o.createdAt) : null
            return (
              <div key={o._id} onClick={()=>onSelect(o._id)} className={`rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition cursor-pointer ${selectedId===o._id ? 'border-orange-400 ring-2 ring-orange-100' : 'border-orange-200'}`}>
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-700 border border-orange-200">#{o._id.slice(-6)}</span>
                    <StatusBadge status={o.status || 'pending'} />
                    {o.payment && <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold text-slate-700">ชำระ: {o.payment==='transfer'?'โอน':o.payment==='cod'?'เก็บปลายทาง':'บัตร'}</span>}
                    {o.delivery && <span className="rounded-full border px-2.5 py-0.5 text-xs font-semibold text-slate-700">ส่ง: {o.delivery==='express'?'ด่วนพิเศษ':'มาตรฐาน'}</span>}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CalendarClock className="h-4 w-4" />
                    {created ? created.toLocaleString() : '-'}
                    <button onClick={(e)=>{ e.stopPropagation(); onDelete(o._id) }} className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-white text-xs font-semibold hover:bg-red-700" title="ลบคำสั่งซื้อ">
                      <Trash2 className="w-3.5 h-3.5" /> ลบ
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-3">
                    <div className="mb-1 flex items-center gap-2 font-semibold text-orange-700"><User className="h-4 w-4" /> ผู้รับ</div>
                    <div className="text-sm text-slate-800">{o.name}</div>
                    <div className="mt-1 flex items-start gap-2 text-sm text-slate-700"><MapPin className="mt-0.5 h-4 w-4" /><span>{o.address}</span></div>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-700"><Phone className="h-4 w-4" /><span>{o.phone}</span></div>
                  </div>

                  <div className="rounded-xl border border-orange-100 bg-orange-50/30 p-3">
                    <div className="mb-1 flex items-center gap-2 font-semibold text-orange-700"><Package className="h-4 w-4" /> รายการสินค้า</div>
                    <ul className="divide-y text-sm">
                      {o.items.map((it,i)=>(<li key={i} className="flex items-center justify-between py-1.5"><span className="truncate">{it.name}</span><span className="font-semibold text-slate-800">{it.price?.toLocaleString()} บาท</span></li>))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-orange-100 bg-orange-50/30 p-3">
                    <div className="mb-2 text-sm">
                      <div className="flex items-center justify-between"><span className="text-slate-600">ยอดสินค้า</span><span className="font-semibold">{fmtMoney(o.amounts?.subtotal ?? o.items.reduce((s,it)=>s+(it.price||0),0))}</span></div>
                      <div className="flex items-center justify-between"><span className="text-slate-600">ค่าจัดส่ง</span><span className="font-semibold">{fmtMoney(o.amounts?.shipCost)}</span></div>
                      <div className="flex items-center justify-between"><span className="text-slate-600">ค่าธรรมเนียม COD</span><span className="font-semibold">{fmtMoney(o.amounts?.codFee)}</span></div>
                      <div className="my-2 h-px bg-orange-100" />
                      <div className="flex items-center justify-between"><span className="font-bold text-slate-700">รวมสุทธิ</span><span className="text-lg font-extrabold text-orange-700">{fmtMoney((o.amounts?.total ?? 0) || (o.items.reduce((s,it)=>s+(it.price||0),0) + (o.amounts?.shipCost ?? 0) + (o.amounts?.codFee ?? 0)))}</span></div>
                    </div>

                    <div className="mt-3 grid gap-2">
                      <label className="text-xs font-semibold text-slate-600">อัปเดตสถานะ</label>
                      <select className="h-10 rounded-lg border border-orange-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-orange-300" value={o.status || 'pending'} onChange={(e)=>onUpdateStatus(o._id, e.target.value as any)}>
                        {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>

                      <label className="mt-2 text-xs font-semibold text-slate-600">เลขขนส่ง</label>
                      <div className="flex gap-2">
                        <input className="h-10 flex-1 rounded-lg border border-orange-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-orange-300" placeholder="กรอกเลขขนส่ง" value={shippingInputs[o._id] ?? ''} onChange={(e)=>setShippingInputs(prev=>({ ...prev, [o._id]: e.target.value }))} onClick={(e)=>e.stopPropagation()} />
                        <button onClick={(e)=>{ e.stopPropagation(); onUpdateShipping(o._id, shippingInputs[o._id] ?? '') }} className="h-10 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700">บันทึก</button>
                        {o.shippingNumber && (
                          <button onClick={(e)=>{ e.stopPropagation(); if (o.shippingNumber) navigator.clipboard.writeText(o.shippingNumber) }} className="h-10 rounded-lg bg-white px-3 border border-orange-200 text-slate-700 hover:bg-orange-50" title="คัดลอกเลขขนส่ง">
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {o.shippingNumber && <div className="mt-1 text-xs"><span className="rounded-full bg-green-100 px-2 py-1 font-semibold text-green-700">ล่าสุด: {o.shippingNumber}</span></div>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const base = 'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border'
  switch (status) {
    case 'pending': return <span className={`${base} border-slate-200 bg-slate-50 text-slate-800`}><Clock className="h-3.5 w-3.5" /> {STATUS_LABEL.pending}</span>
    case 'processing': return <span className={`${base} border-amber-200 bg-amber-50 text-amber-800`}><Filter className="h-3.5 w-3.5" /> {STATUS_LABEL.processing}</span>
    case 'paid': return <span className={`${base} border-amber-200 bg-amber-50 text-amber-800`}><BadgeCheck className="h-3.5 w-3.5" /> {STATUS_LABEL.paid}</span>
    case 'shipped': return <span className={`${base} border-blue-200 bg-blue-50 text-blue-800`}><Truck className="h-3.5 w-3.5" /> {STATUS_LABEL.shipped}</span>
    case 'completed': return <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-800`}><CheckCircle2 className="h-3.5 w-3.5" /> {STATUS_LABEL.completed}</span>
    case 'cancelled': default: return <span className={`${base} border-red-200 bg-red-50 text-red-800`}><XCircle className="h-3.5 w-3.5" /> {STATUS_LABEL.cancelled}</span>
  }
}

/* ---------- Products list (unchanged) ---------- */
function ProductsList({ products, onRefresh, onDelete }: { products: Product[]; onRefresh: () => void; onDelete: (id: string)=>void }) {
  const [local, setLocal] = useState(products)
  const [selectedProduct, setSelectedProduct] = useState<Product|null>(null)
  useEffect(()=>setLocal(products),[products])
  return (
    <SectionCard title="รายการสินค้า" subtitle="แก้ไข/ลบสินค้าได้จากที่นี่">
      <div className="mb-3 flex items-center gap-2">
        <div className="relative flex-1"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="w-full pl-9 pr-3 h-10 rounded-xl border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="ค้นหาสินค้า… (โดยชื่อ)" onChange={(e)=>{
            const q = e.target.value.toLowerCase()
            if (!q) return setLocal(products)
            setLocal(products.filter((p) => p.name.toLowerCase().includes(q)))
          }} />
        </div>
        <button onClick={onRefresh} className="h-10 px-3 rounded-xl bg-white border border-orange-200 text-orange-700 hover:bg-orange-50 inline-flex items-center gap-2"><RefreshCw className='w-4 h-4'/>รีเฟรช</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {local.map((p) => (
          <div key={p._id} className="rounded-2xl border border-orange-200 bg-white shadow-sm p-5 hover:shadow-md transition"
            onClick={() => setSelectedProduct(p)}
            style={{ cursor: 'pointer' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-orange-700">{p.name}</h3>
                <div className="text-green-700 font-semibold">{p.price.toLocaleString()} บาท</div>
                <div className="text-xs text-slate-500 mt-1">หมวดหมู่: {p.category || '-'}</div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={e => { e.stopPropagation(); setSelectedProduct(p); }}
                  className="px-3 h-9 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
                >ดู</button>
                <button
                  type="button"
                  onClick={async e => {
                    e.stopPropagation();
                    const btn = e.currentTarget as HTMLButtonElement;
                    btn.disabled = true;
                    await onDelete(p._id);
                    btn.disabled = false;
                  }}
                  className="px-3 h-9 rounded-full bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                >ลบ</button>
              </div>
            </div>
            <div className="mt-3">
              {p.images?.length ? (<div className="flex gap-2 overflow-x-auto">{p.images.map((img,idx)=>(<img key={idx} src={img} alt={`${p.name}-${idx}`} className="h-20 w-20 object-contain rounded border bg-white shadow-sm" />))}</div>)
              : p.image ? (<img src={p.image} alt={p.name} className="h-40 w-full object-contain rounded border bg-white shadow-sm" />)
              : (<div className="h-20 grid place-items-center text-slate-400 text-sm border rounded">ไม่มีรูป</div>)}
            </div>
            {p.description && <p className="mt-3 text-sm text-slate-700 line-clamp-3">{p.description}</p>}
          </div>
        ))}
      </div>
      {local.length===0 && <div className="text-slate-500">ยังไม่มีสินค้า</div>}

      {/* Modal ดูรายละเอียดสินค้า */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center" onClick={()=>setSelectedProduct(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative flex flex-col gap-4" onClick={e=>e.stopPropagation()}>
            <button className="absolute top-4 right-4 text-red-600 font-bold text-2xl hover:bg-red-100 rounded-full w-10 h-10 flex items-center justify-center" onClick={()=>setSelectedProduct(null)}>×</button>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Gallery รูปภาพ */}
              <div className="flex-shrink-0 flex flex-col items-center gap-2 md:w-1/3">
                {selectedProduct.images?.length ? (
                  <div className="flex gap-2 flex-wrap justify-center">
                    {selectedProduct.images.map((img,idx)=>(
                      <img key={idx} src={img} alt={`${selectedProduct.name}-${idx}`} className="h-24 w-24 object-contain rounded-xl border bg-white shadow" />
                    ))}
                  </div>
                ) : selectedProduct.image ? (
                  <img src={selectedProduct.image} alt={selectedProduct.name} className="h-32 w-32 object-contain rounded-xl border bg-white shadow" />
                ) : (
                  <div className="h-24 w-24 grid place-items-center text-slate-400 text-sm border rounded-xl bg-orange-50">ไม่มีรูป</div>
                )}
              </div>
              {/* ข้อมูลสินค้า */}
              <div className="flex-1 flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-orange-700 mb-1">{selectedProduct.name}</h2>
                <div className="text-lg text-green-700 font-semibold">{selectedProduct.price.toLocaleString()} บาท</div>
                <div className="text-sm text-slate-500">หมวดหมู่: <span className="font-medium">{selectedProduct.category || '-'}</span></div>
                {selectedProduct.description && (
                  <div className="mt-2 text-slate-700 text-base whitespace-pre-line">{selectedProduct.description}</div>
                )}
              </div>
            </div>
            {/* Divider */}
            <div className="border-t border-orange-100 my-2" />
            {/* ตัวเลือกสินค้า */}
            {selectedProduct.options && selectedProduct.options.length > 0 && (
              <div className="mt-2">
                <div className="font-semibold text-orange-700 mb-2 text-lg">ตัวเลือกสินค้า</div>
                <div className="grid gap-2">
                  {selectedProduct.options.map((opt, i)=>(
                    <div key={i}>
                      <div className="text-sm font-semibold mb-1">{opt.name}</div>
                      <div className="flex flex-wrap gap-2">
                        {opt.values.map((v, j)=>(
                          <span key={j} className="px-4 py-1 rounded-full border text-sm font-medium bg-orange-50 text-gray-700 border-orange-200 shadow">
                            {v}
                          </span>
                        ))}
                        {opt.values.length===0 && <span className="text-xs text-slate-500">ยังไม่มีค่า</span>}
                      </div>
                    </div>
                  ))}
                  {selectedProduct.options.length === 0 && <div className="text-xs text-slate-500">ยังไม่ได้เพิ่มตัวเลือก</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </SectionCard>
  )
}

/* ---------- UI atoms ---------- */
function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-orange-200 bg-white/90 backdrop-blur shadow-xl p-6">
      <h2 className="text-2xl font-bold text-orange-700">{title}</h2>
      {subtitle && <p className="text-slate-600 text-sm mt-1">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}
function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (<div className="rounded-xl bg-white/90 border border-orange-200 shadow-sm p-3 flex items-center gap-2"><div className="text-orange-700">{icon}</div><div className="text-xs text-slate-500">{label}</div><div className="ml-auto text-base font-extrabold text-orange-700">{value}</div></div>)
}
function NavButton({ active, children, onClick, icon }: { active?: boolean; children: React.ReactNode; onClick: () => void; icon?: React.ReactNode }) {
  return (<button onClick={onClick} className={`h-10 px-3 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition w-full text-left ${active ? 'bg-orange-600 text-white shadow' : 'bg-white text-orange-700 hover:bg-orange-50 border border-orange-200'}`}>{icon}{children}</button>)
}
function getBannerSrc(b: { url?: string; image?: string; icon?: string }) {
  const raw = (b?.url || b?.image || b?.icon || '').trim()
  if (!raw) return ''
  if (/^data:/.test(raw)) return raw
  if (/^https?:\/\//.test(raw)) return raw
  if (raw.startsWith('//')) return raw
  if (raw.startsWith('/')) return raw
  return `/banners/${raw.replace(/^\/?banners\//, '')}`
}
function Clock(props:any){ return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> }

/* ---------- OptionBuilder ---------- */
function OptionBuilder({
  value, onChange
}:{
  value: ProductOption[]
  onChange: (next: ProductOption[]) => void
}) {
  const [optName, setOptName] = useState('')
  const [inputByIdx, setInputByIdx] = useState<Record<number,string>>({})

  const addOption = () => {
    const name = ensureString(optName)
    if (!name) return
    if (value.some(v => v.name.toLowerCase() === name.toLowerCase())) {
      Swal.fire({ icon:'warning', title:'ชื่อตัวเลือกซ้ำ', text:'โปรดใช้ชื่ออื่น' }); return
    }
    onChange([...value, { name, values: [] }])
    setOptName('')
  }

  const removeOption = (idx: number) => {
    onChange(value.filter((_,i)=>i!==idx))
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
    const next = value.map((o,i)=> i===idx ? { ...o, values: Array.from(curr) } : o)
    onChange(next)
    setInputByIdx(prev => ({ ...prev, [idx]: '' }))
  }

  const removeValue = (optIdx: number, vIdx: number) => {
    const next = value.map((o,i)=>
      i===optIdx ? { ...o, values: o.values.filter((_,j)=>j!==vIdx) } : o
    )
    onChange(next)
  }

  const renameOption = (idx: number, name: string) => {
    const newName = ensureString(name)
    const dup = value.some((o,i)=> i!==idx && o.name.toLowerCase()===newName.toLowerCase())
    if (dup) return Swal.fire({ icon:'warning', title:'ชื่อตัวเลือกซ้ำ' })
    const next = value.map((o,i)=> i===idx ? { ...o, name: newName } : o)
    onChange(next)
  }

  const Preview = () => (
    <div className="mt-4 border-t border-orange-200 pt-3">
      <div className="text-sm text-slate-600 mb-2">พรีวิวการแสดงผล:</div>
      <div className="grid gap-3">
        {value.map((opt, i)=>(
          <div key={i}>
            <div className="text-sm font-semibold mb-1">{opt.name}</div>
            <div className="flex flex-wrap gap-2">
              {opt.values.map((v, j)=>(
                <span key={j} className="px-3 h-9 rounded-full border text-sm font-medium bg-white text-gray-700 border-orange-200">
                  {v}
                </span>
              ))}
              {opt.values.length===0 && <span className="text-xs text-slate-500">ยังไม่มีค่า</span>}
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
          onChange={e=>setOptName(e.target.value)}
          onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); addOption() } }}
        />
        <button type="button" onClick={addOption}
          className="px-4 rounded-xl bg-orange-600 text-white font-semibold hover:bg-orange-700">
          เพิ่มตัวเลือก
        </button>
      </div>

      <div className="mt-4 grid gap-4">
        {value.map((opt, idx)=>(
          <div key={idx} className="rounded-xl bg-white border border-orange-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <input
                value={opt.name}
                onChange={e=>renameOption(idx, e.target.value)}
                className="font-semibold text-orange-700 bg-transparent border-0 outline-none flex-1"
              />
              <button type="button" onClick={()=>removeOption(idx)}
                className="text-xs text-red-600 hover:underline">ลบตัวเลือก</button>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              {opt.values.map((val, vIdx)=>(
                <span key={vIdx} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200 shadow">
                  {val}
                  <button type="button" className="text-[10px] text-red-600" onClick={()=>removeValue(idx, vIdx)}>✕</button>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                value={inputByIdx[idx] ?? ''}
                onChange={e=>setInputByIdx(prev=>({ ...prev, [idx]: e.target.value }))}
                onKeyDown={(e)=>{ if(e.key==='Enter'){ e.preventDefault(); addValue(idx) } }}
                className="flex-1 border border-orange-200 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="เพิ่มค่า (แยกหลายค่าด้วย , แล้วกด Enter)"
              />
              <button type="button" onClick={()=>addValue(idx)}
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
              