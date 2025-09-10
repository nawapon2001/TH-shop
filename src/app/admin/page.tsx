// Verified: removed any leading diff markers (-/+ lines) and ensured no "borderorange-200" remains.

'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import OrderChatPanel from '@/components/OrderChatPanel'
import ProductOptionsManager from '@/components/ProductOptionsManager'
import { MessageCircle } from 'lucide-react'
import {
  Settings, LayoutGrid, Image as ImageIcon, Tag, PackagePlus, ListOrdered, Truck,
  RefreshCw, Upload, Trash2, LogIn, Search, CalendarClock,
  User, Phone, MapPin, Package, Filter, SortDesc, CheckCircle2, XCircle, BadgeCheck, Loader2, Copy, Store,
  BarChart3, TrendingUp, Users, ShoppingCart, Activity, DollarSign, Eye, AlertCircle
} from 'lucide-react'

/* ---------- Types ---------- */
type ProductOptionValue = {
  value: string
  price: number
  priceType: 'add' | 'replace'
}

type ProductOption = { 
  name: string; 
  values: ProductOptionValue[] 
}

type Product = { _id: string; name: string; price: number | string; image?: string; images?: string[]; description?: string; category?: string; options?: ProductOption[]; username?: string; seller?: boolean }
type Banner = { _id: string; url?: string; image?: string; isSmall?: boolean }

type Category = { name: string; icon?: string }
type TabKey = 'dashboard' | 'orders' | 'banner' | 'category' | 'product' | 'list' | 'admins' | 'accounts'

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
      values: (o.values || [])
        .map(v => {
          // รองรับทั้งแบบเก่า (string) และแบบใหม่ (object)
          if (typeof v === 'string') {
            return { value: ensureString(v), price: 0, priceType: 'add' as const }
          } else if (typeof v === 'object' && v !== null) {
            return {
              value: ensureString((v as any).value),
              price: Number((v as any).price) || 0,
              priceType: ((v as any).priceType === 'replace' ? 'replace' : 'add') as 'add' | 'replace'
            }
          }
          return null
        })
        .filter((v): v is ProductOptionValue => v !== null && Boolean(v.value))
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

/* ---------- Dashboard Components ---------- */
interface DashboardSectionProps {
  products: Product[]
  orders: Order[]
  users: any[]
  sellersList: any[]
  loading: boolean
}

const DashboardSection = ({ products, orders, users, sellersList, loading }: DashboardSectionProps) => {
  // Calculate statistics
  const totalProducts = products.length
  const totalOrders = orders.length
  const totalUsers = users.length
  const totalSellers = sellersList.length
  
  // Calculate order statistics by status
  const ordersByStatus = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = orders.filter(order => order.status === status).length
    return acc
  }, {} as Record<OrderStatus, number>)
  
  // Calculate revenue (estimate from completed orders)
  const totalRevenue = orders
    .filter(order => order.status === 'completed')
    .reduce((sum, order) => sum + (order.amounts?.total || 0), 0)
  
  // Recent activity
  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5)
    
  // Category distribution
  const categoryDistribution = products.reduce((acc, product) => {
    const category = product.category || 'ไม่ระบุ'
    acc[category] = (acc[category] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
          <div className="text-slate-600">กำลังโหลดข้อมูล...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">แดชบอร์ด</h1>
          <p className="text-slate-600 mt-1">ภาพรวมของระบบและสถิติต่างๆ</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          รีเฟรช
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="สินค้าทั้งหมด"
          value={totalProducts.toLocaleString()}
          icon={<Package className="w-8 h-8 text-blue-600" />}
          color="blue"
          subtitle="รายการสินค้า"
        />
        <KPICard
          title="คำสั่งซื้อ"
          value={totalOrders.toLocaleString()}
          icon={<ShoppingCart className="w-8 h-8 text-green-600" />}
          color="green"
          subtitle="คำสั่งซื้อทั้งหมด"
        />
        <KPICard
          title="ผู้ใช้งาน"
          value={totalUsers.toLocaleString()}
          icon={<Users className="w-8 h-8 text-purple-600" />}
          color="purple"
          subtitle="บัญชีผู้ใช้"
        />
        <KPICard
          title="ร้านค้า"
          value={totalSellers.toLocaleString()}
          icon={<Store className="w-8 h-8 text-orange-600" />}
          color="orange"
          subtitle="ร้านค้าในระบบ"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            สถานะคำสั่งซื้อ
          </h3>
          <div className="space-y-3">
            {STATUS_ORDER.map(status => {
              const count = ordersByStatus[status] || 0
              const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}></div>
                    <span className="text-sm font-medium text-slate-700">{STATUS_LABEL[status]}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 bg-slate-100 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getStatusBgColor(status)}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-slate-800 w-8 text-right">{count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            การกระจายหมวดหมู่สินค้า
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {Object.entries(categoryDistribution)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 8)
              .map(([category, count], index) => {
                const percentage = totalProducts > 0 ? (count / totalProducts) * 100 : 0
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500', 'bg-red-500']
                return (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                      <span className="text-sm font-medium text-slate-700 truncate max-w-32">{category}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 bg-slate-100 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${colors[index % colors.length]}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-slate-800 w-8 text-right">{count}</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* Recent Activity & Revenue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            คำสั่งซื้อล่าสุด
          </h3>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <div>ยังไม่มีคำสั่งซื้อ</div>
              </div>
            ) : (
              <>
                {recentOrders.map(order => (
                  <div key={order._id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
                    <div>
                      <div className="font-medium text-slate-800">{order.name}</div>
                      <div className="text-sm text-slate-500">
                        {order.items.length} รายการ • ฿{(order.amounts?.total || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(order.status || 'pending')}`}>
                        {STATUS_LABEL[order.status || 'pending']}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('th-TH') : '-'}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">รายได้รวม</h3>
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="text-3xl font-bold mb-2">
            ฿{totalRevenue.toLocaleString()}
          </div>
          <div className="text-green-100 text-sm">
            จากคำสั่งซื้อที่สำเร็จแล้ว
          </div>
          <div className="mt-4 pt-4 border-t border-green-400">
            <div className="flex justify-between text-sm">
              <span>คำสั่งซื้อที่สำเร็จ</span>
              <span className="font-semibold">{ordersByStatus.completed || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper component for KPI cards
interface KPICardProps {
  title: string
  value: string
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'orange'
  subtitle: string
}

const KPICard = ({ title, value, icon, color, subtitle }: KPICardProps) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600', 
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
          {icon}
        </div>
        <Eye className="w-5 h-5 text-slate-400" />
      </div>
      <div className="text-3xl font-bold text-slate-800 mb-1">{value}</div>
      <div className="text-slate-600 font-medium">{title}</div>
      <div className="text-slate-500 text-sm mt-1">{subtitle}</div>
    </div>
  )
}

// Helper functions for status styling
const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'pending': return 'bg-yellow-500'
    case 'processing': return 'bg-blue-500'
    case 'paid': return 'bg-green-500'
    case 'shipped': return 'bg-purple-500'
    case 'completed': return 'bg-emerald-500'
    case 'cancelled': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const getStatusBgColor = (status: OrderStatus) => {
  switch (status) {
    case 'pending': return 'bg-yellow-500'
    case 'processing': return 'bg-blue-500'
    case 'paid': return 'bg-green-500'
    case 'shipped': return 'bg-purple-500'
    case 'completed': return 'bg-emerald-500'
    case 'cancelled': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

const getStatusStyle = (status: OrderStatus) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800'
    case 'processing': return 'bg-blue-100 text-blue-800'
    case 'paid': return 'bg-green-100 text-green-800'
    case 'shipped': return 'bg-purple-100 text-purple-800'
    case 'completed': return 'bg-emerald-100 text-emerald-800'
    case 'cancelled': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

/* ---------- หน้า Admin ---------- */
// safe clipboard copy with fallback (local helper)
const copyToClipboard = async (text: string) => {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    // fallback
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
    return true
  } catch {
    return false
  }
}

export default function AdminPage() {
  /* ---------- Auth (demo) ---------- */
  const [adminUser, setAdminUser] = useState('')
  const [adminPass, setAdminPass] = useState('')
  const [isAuth, setIsAuth] = useState(false)
  const [authError, setAuthError] = useState('')

  // Update document title
  useEffect(() => {
    document.title = 'ผู้ดูแลระบบ | TH-THAI SHOP'
  }, [])

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

  // ensure router is available for navigation (fix ReferenceError)
  const router = useRouter()

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
  const [tab, setTab] = useState<TabKey>('dashboard')
  const [loading, setLoading] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [sellersList, setSellersList] = useState<any[]>([])

  const productCount = products.length
  const bannerCount = banners.length
  const categoryCount = categories.length

  /* ---------- API helpers ---------- */
  // fetch both central products and marketplace (seller) products, merge into one list
  const fetchProducts = async () => {
    try {
      const [r1, r2] = await Promise.all([fetch('/api/products'), fetch('/api/seller-products')])
      const d1 = await r1.json().catch(()=>[])
      const d2 = await r2.json().catch(()=>[])

      const central = Array.isArray(d1) ? d1.map((p: any) => ({ ...p, seller: false })) : []
      const sellers = Array.isArray(d2) ? d2.map((s: any) => ({
        _id: s._id || s.id || '',
        name: s.name || s.shopName || s.desc || 'สินค้าจากร้านค้า',
        price: s.price != null ? (typeof s.price === 'string' ? Number(s.price) || s.price : s.price) : 0,
        image: s.image || '',
        images: s.images || [],
        description: s.desc || s.description || '',
        category: s.category || `ร้าน: ${s.username || ''}`,
        username: s.username,
        seller: true
      })) : []

      setProducts([...central, ...sellers])
    } catch (err) {
      console.error('fetchProducts error', err)
      setProducts([])
    }
  }
  const fetchBanners = async () => { try { const r = await fetch('/api/banners', { cache: 'no-store' }); const d = await r.json(); setBanners(Array.isArray(d)?d:[]) } catch { setBanners([]) } }
  const fetchCategories = async () => { try {
    const r = await fetch('/api/categories'); const d = await r.json()
    if (Array.isArray(d) && typeof d[0] === 'string') setCategories(d.map((name:string)=>({ name })))
    else setCategories(Array.isArray(d)?d:[])
  } catch { setCategories([]) } }
  const fetchOrders = async () => { try { const r = await fetch('/api/orders', { cache: 'no-store' }); const d = await r.json(); setOrders(Array.isArray(d)?d:[]) } catch { setOrders([]) } }
  const refreshAll = async () => { setLoading(true); await Promise.all([fetchProducts(), fetchBanners(), fetchCategories(), fetchOrders(), fetchUsers(), fetchSellersList()]); setLoading(false) }
  useEffect(()=>{ refreshAll() }, [])

  // fetch users and sellers for accounts tab
  const fetchUsers = async () => { try { const r = await fetch('/api/admin-users'); const d = await r.json(); setUsers(Array.isArray(d)?d:[]) } catch { setUsers([]) } }
  const fetchSellersList = async () => { try { const r = await fetch('/api/sellers'); const d = await r.json(); setSellersList(Array.isArray(d)?d:[]) } catch { setSellersList([]) } }

  // include in refresh
  const refreshAllWithAccounts = async () => { setLoading(true); await Promise.all([fetchProducts(), fetchBanners(), fetchCategories(), fetchOrders(), fetchUsers(), fetchSellersList()]); setLoading(false) }
  useEffect(()=>{ fetchUsers(); fetchSellersList() }, [])

  // refresh accounts when opening accounts tab
  useEffect(() => {
    if (tab === 'accounts') {
      fetchUsers()
      fetchSellersList()
    }
  }, [tab])

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

    try {
      // 1) upload product images to /api/upload
      const uploadFd = new FormData()
      productFiles.forEach(f => uploadFd.append('files', f))
      const upRes = await fetch('/api/upload', { method: 'POST', body: uploadFd })
      if (!upRes.ok) throw new Error('upload failed')
      const upJson = await upRes.json().catch(()=>({}))
      const imageUrls: string[] = Array.isArray(upJson?.urls) ? upJson.urls : []

      // 2) send product payload with image URLs
      const sanitizedOptions = sanitizeOptions(options)
      console.log('Options being sent:', JSON.stringify(sanitizedOptions, null, 2))
      
      const payload = {
        name,
        price: Number(price),
        category: selectedCategory,
        description,
        images: imageUrls,
        options: sanitizedOptions
      }
      
      console.log('Full payload:', JSON.stringify(payload, null, 2))
      
      const res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) {
        const err = await res.json().catch(()=>({}))
        console.error('API Error:', err)
        throw new Error(err?.message || 'create product failed')
      }
      // success
      setName(''); setPrice(''); setSelectedCategory(''); setDescription(''); setProductFiles([]); setOptions([])
      await fetchProducts()
      Swal.fire({ icon: 'success', title: 'เพิ่มสินค้าสำเร็จ', timer: 1500, showConfirmButton: false })
    } catch (err:any) {
      console.error('product upload/create error', err)
      Swal.fire({ icon: 'error', title: 'เพิ่มสินค้าไม่สำเร็จ', text: err?.message || '' })
    }
  }

  /* ---------- Orders + chat ---------- */
  const [selectedOrderId, setSelectedOrderId] = useState<string|null>(null)
  const selectedOrder = useMemo(()=> orders.find(o=>o._id===selectedOrderId), [orders, selectedOrderId])

  // chat popup state
  const [chatOpen, setChatOpen] = useState(false)

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
      // determine whether this product is a seller product
      const prod = products.find(p => p._id === id)
      let res: Response
      if (prod && prod.seller) {
        res = await fetch(`/api/seller-products?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      } else {
        res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      }
      if (!res.ok) throw new Error()
      await fetchProducts()
      Swal.fire({ icon: 'success', title: 'ลบสินค้าแล้ว', timer: 1200, showConfirmButton: false })
    } catch {
      Swal.fire({ icon: 'error', title: 'ลบสินค้าไม่สำเร็จ' })
    }
  }

  if (!isAuth) {
    // Enhanced login form with beautiful styling
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200/40 to-amber-200/40 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-rose-200/40 to-orange-200/40 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative w-full max-w-md">
          {/* Floating cards effect */}
          <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-400 rounded-xl rotate-12 opacity-20 blur-sm"></div>
          <div className="absolute -top-4 right-8 w-8 h-8 bg-gradient-to-br from-rose-400 to-orange-400 rounded-lg -rotate-12 opacity-30 blur-sm"></div>
          
          <div className="relative rounded-3xl border border-orange-200/50 bg-white/80 backdrop-blur-xl shadow-2xl p-8 transition-all duration-500 hover:shadow-3xl">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 blur-xl"></div>
            
            <div className="relative">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 mb-4 shadow-lg">
                  <LogIn className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  เข้าสู่ระบบผู้ดูแล
                </h2>
                <p className="text-slate-600 mt-2">กรอกชื่อผู้ใช้และรหัสผ่านเพื่อจัดการระบบ</p>
              </div>
              
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Admin Username" 
                    className="w-full h-14 px-4 rounded-2xl border-2 border-orange-200/50 bg-white/70 backdrop-blur-sm focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all duration-300 placeholder:text-slate-400"
                    value={adminUser} 
                    onChange={(e)=>setAdminUser(e.target.value)} 
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/5 to-amber-500/5 pointer-events-none"></div>
                </div>
                
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="Admin Password" 
                    className="w-full h-14 px-4 rounded-2xl border-2 border-orange-200/50 bg-white/70 backdrop-blur-sm focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all duration-300 placeholder:text-slate-400"
                    value={adminPass} 
                    onChange={(e)=>setAdminPass(e.target.value)} 
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-500/5 to-amber-500/5 pointer-events-none"></div>
                </div>
                
                <button 
                  className="w-full h-14 mt-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-bold shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 relative overflow-hidden group" 
                  type="submit"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative">เข้าสู่ระบบ</span>
                </button>
              </form>
              
              {authError && (
                <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-center font-medium animate-shake">
                  {authError}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <style jsx>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
          .bg-size-200 { background-size: 200% 100%; }
          .bg-pos-0 { background-position: 0% 50%; }
          .bg-pos-100 { background-position: 100% 50%; }
        `}</style>
      </div>
    )
  }

  // Enhanced main admin interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/30 to-amber-50/30 relative">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-orange-200/20 to-amber-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-gradient-to-tr from-rose-200/20 to-orange-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Enhanced layout */}
      <div className="relative w-full mx-auto px-4 md:px-6 grid lg:grid-cols-[350px_1fr] gap-6">
         {/* Enhanced Sidebar */}
         <aside className="hidden lg:flex sticky top-6 h-[calc(100vh-3rem)] flex-col rounded-3xl border border-orange-200/50 bg-white/80 backdrop-blur-xl shadow-2xl p-6 gap-6">
           {/* Header with glow effect */}
           <div className="relative">
             <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-2xl blur-xl"></div>
             <div className="relative flex items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-orange-500/5 to-amber-500/5 border border-orange-200/30">
               <div className="flex items-center gap-3">
                 <div className="relative">
                   <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white font-extrabold shadow-lg">
                     SS
                   </div>
                   <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 blur opacity-50"></div>
                 </div>
                 <div>
                   <div className="text-base font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">SignShop</div>
                   <div className="text-xs text-slate-500 -mt-0.5">แดชบอร์ดผู้ดูแล</div>
                 </div>
               </div>
               <div className="flex items-center gap-2">
                 <button 
                   onClick={refreshAll} 
                   title="รีเฟรช" 
                   className="group w-10 h-10 rounded-xl bg-white/80 border border-orange-200 text-orange-700 flex items-center justify-center hover:bg-orange-50 hover:shadow-lg transition-all duration-300 hover:scale-110"
                 >
                   {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />}
                 </button>
               </div>
             </div>
           </div>

           {/* Enhanced stats cards */}
           <div className="grid gap-3">
             <StatsCard icon={<ImageIcon className="w-5 h-5 text-orange-500" />} label="แบนเนอร์" value={bannerCount} color="orange" />
             <StatsCard icon={<Tag className="w-5 h-5 text-amber-500" />} label="หมวดหมู่" value={categoryCount} color="amber" />
             <StatsCard icon={<PackagePlus className="w-5 h-5 text-green-500" />} label="สินค้า" value={productCount} color="green" />
           </div>

           {/* Enhanced navigation */}
           <nav className="flex-1 space-y-2">
             <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-4 mb-3 px-3">เมนูหลัก</div>
             <NavButton icon={<BarChart3 className="w-4 h-4" />} active={tab==='dashboard'} onClick={()=>setTab('dashboard')}>แดชบอร์ด</NavButton>
             <NavButton icon={<Truck className="w-4 h-4" />} active={tab==='orders'} onClick={()=>setTab('orders')} badge={orders.length}>คำสั่งซื้อ</NavButton>
             <NavButton icon={<ImageIcon className="w-4 h-4" />} active={tab==='banner'} onClick={()=>setTab('banner')}>แบนเนอร์</NavButton>
             <NavButton icon={<Tag className="w-4 h-4" />} active={tab==='category'} onClick={()=>setTab('category')}>หมวดหมู่</NavButton>
             <NavButton icon={<PackagePlus className="w-4 h-4" />} active={tab==='product'} onClick={()=>setTab('product')}>เพิ่มสินค้า</NavButton>
             <NavButton icon={<ListOrdered className="w-4 h-4" />} active={tab==='list'} onClick={()=>setTab('list')}>รายการสินค้า</NavButton>
             <NavButton icon={<User className="w-4 h-4" />} active={tab==='admins'} onClick={() => setTab('admins')}>ผู้ดูแลระบบ</NavButton>
             <NavButton icon={<BadgeCheck className="w-4 h-4" />} active={tab==='accounts'} onClick={() => setTab('accounts')}>บัญชีผู้ใช้ / ร้านค้า</NavButton>
           </nav>
         </aside>
 
         {/* Enhanced Main Content */}
         <main className="py-6 space-y-6">
           {/* Enhanced top toolbar */}
           <div className="relative">
             <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 rounded-3xl blur-xl"></div>
             <div className="relative rounded-3xl border border-orange-200/50 bg-white/80 backdrop-blur-xl shadow-xl p-6">
               <div className="flex items-center justify-between gap-4">
                 <div>
                   <h1 className="text-3xl font-extrabold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                     แดชบอร์ดผู้ดูแล
                   </h1>
                   <p className="text-slate-500 text-sm mt-1">จัดการสินค้า แบนเนอร์ หมวดหมู่ และคำสั่งซื้อ</p>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="relative">
                     <input 
                       placeholder="ค้นหา (สินค้า/ออเดอร์)..." 
                       className="h-12 w-64 rounded-2xl border border-orange-200/50 bg-white/70 backdrop-blur-sm px-4 pr-12 text-sm outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all duration-300 placeholder:text-slate-400" 
                     />
                     <Search className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                   </div>
                   <button 
                     onClick={() => setTab('admins')} 
                     className="h-12 px-6 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 relative overflow-hidden group"
                   >
                     <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                     <span className="relative">ผู้ดูแลใหม่</span>
                   </button>
                 </div>
               </div>
             </div>
           </div>

           {/* Tab content with enhanced styling */}
           {tab === 'dashboard' && (
             <DashboardSection 
               products={products}
               orders={orders}
               users={users}
               sellersList={sellersList}
               loading={loading}
             />
           )}

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
                   onDragOver={(e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); bannerDropRef.current?.classList.add('ring-2') }}
                   onDragLeave={() => bannerDropRef.current?.classList.remove('ring-2')}
                   onDrop={(e: React.DragEvent<HTMLLabelElement>) => { e.preventDefault(); bannerDropRef.current?.classList.remove('ring-2'); const f = e.dataTransfer.files?.[0]; setBannerFile(f || null) }}
                   className="grid place-items-center h-44 rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/40 text-orange-700 cursor-pointer hover:bg-orange-50 transition ring-orange-300"
                 >
                   <input type="file" accept="image/*" className="hidden" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBannerFile(e.target.files?.[0] || null)} />
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
             <SectionCard title="เพิ่มสินค้าใหม่" subtitle="กรอกข้อมูลและดูตัวอย่างแบบเรียลไทม์ก่อนบันทึก">
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                 {/* Left: Form */}
                 <div className="lg:col-span-7">
                   <form onSubmit={handleProductUpload} encType="multipart/form-data" className="space-y-5">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <input aria-label="ชื่อสินค้า" className="border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="ชื่อสินค้า" value={name} onChange={e=>setName(e.target.value)} required />
                       <input aria-label="ราคา" type="number" className="border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="ราคาสินค้า" value={price} onChange={e=>setPrice(e.target.value===''?'':Number(e.target.value))} required />
                     </div>
                     <textarea className="w-full border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400" placeholder="รายละเอียดสินค้า" rows={4} value={description} onChange={e=>setDescription(e.target.value)} />
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                       <select aria-label="หมวดหมู่" className="border border-orange-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orange-400" value={selectedCategory} onChange={e=>setSelectedCategory(e.target.value)} required>
                         <option value="">เลือกหมวดหมู่</option>
                         {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                       </select>
                       <div className="text-sm text-slate-500">ตัวเลือกและรูปภาพจะอัปเดตในพรีวิวทางขวา</div>
                     </div>

                     <div>
                       <label className="block text-sm font-medium mb-2">รูปสินค้า</label>
                       <div className="flex items-center gap-3">
                         <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-orange-200 cursor-pointer hover:shadow-sm">
                           <Upload className="w-4 h-4 text-orange-600" /> เลือกไฟล์
                           <input type="file" accept="image/*" multiple className="hidden" onChange={(e: React.ChangeEvent<HTMLInputElement>) => onDropProductFiles(e.target.files)} />
                         </label>
                         <div className="flex gap-2 flex-wrap">
                           {productFiles.map((file, idx)=>(
                             <div key={idx} className="relative w-20 h-20 rounded-md overflow-hidden border bg-white">
                               {/* eslint-disable-next-line @next/next/no-img-element */}
                               <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                               <button type="button" aria-label="ลบรูป" onClick={()=>setProductFiles(arr=>arr.filter((_,i)=>i!==idx))} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 grid place-items-center text-xs">×</button>
                             </div>
                           ))}
                         </div>
                       </div>
                     </div>

                     <div>
                       <ProductOptionsManager 
                         options={options} 
                         basePrice={typeof price === 'number' ? price : Number(price) || 0}
                         onChange={setOptions} 
                       />
                     </div>

                     <div className="flex items-center gap-3">
                       <button type="submit" className="h-12 px-6 rounded-full bg-gradient-to-r from-green-600 to-lime-500 text-white font-semibold shadow-lg hover:from-green-700" disabled={productFiles.length===0}>บันทึกสินค้า</button>
                       <button type="button" onClick={() => { setName(''); setPrice(''); setDescription(''); setSelectedCategory(''); setProductFiles([]); setOptions([]) }} className="h-12 px-4 rounded-lg border border-orange-200 text-orange-700">ล้างฟอร์ม</button>
                       {productFiles.length===0 && <span className="text-slate-500 text-sm">* กรุณาเพิ่มรูปสินค้าเพื่อบันทึก</span>}
                     </div>
                   </form>
                 </div>

                 {/* Right: Live Preview */}
                 <div className="lg:col-span-5">
                   <div className="rounded-xl border border-orange-100 bg-white p-4 shadow-sm">
                     <div className="h-48 rounded-md bg-orange-50 flex items-center justify-center overflow-hidden">
                       {productFiles.length ? (
                         // eslint-disable-next-line @next/next/no-img-element
                         <img src={URL.createObjectURL(productFiles[0])} alt="preview" className="h-full object-cover w-full" />
                       ) : (
                         <div className="text-center text-slate-400">
                           <div className="font-semibold">ไม่มีรูปตัวอย่าง</div>
                           <div className="text-xs">เพิ่มรูปสินค้าเพื่อดูตัวอย่าง</div>
                         </div>
                       )}
                     </div>
                     <div className="mt-3">
                       <div className="text-lg font-bold text-orange-700">{name || 'ชื่อสินค้า (ตัวอย่าง)'}</div>
                       <div className="text-sm text-slate-600">{selectedCategory || 'หมวดหมู่'}</div>
                       <div className="text-xl text-green-700 font-extrabold mt-2">{price ? `${Number(price).toLocaleString()} ฿` : '฿0'}</div>
                       <p className="mt-3 text-sm text-slate-700 line-clamp-4">{description || 'รายละเอียดสินค้าจะแสดงที่นี่เมื่อกรอก'}</p>
                       {options.length > 0 && (
                         <div className="mt-3">
                           <div className="text-sm font-semibold text-slate-700 mb-2">ตัวเลือก</div>
                           <div className="flex flex-wrap gap-2">
                             {options.map((o,i)=>(
                               <div key={i} className="p-2 rounded-md bg-orange-50 border border-orange-100 text-sm">
                                 <div className="font-semibold text-orange-700">{o.name}</div>
                                 <div className="text-xs text-slate-600">{o.values.join(' · ')}</div>
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 </div>
               </div>
             </SectionCard>
           )}

           {tab === 'list' && (
             <ProductsList products={products} onRefresh={fetchProducts} onDelete={handleDeleteProduct} />
           )}

           {tab === 'admins' && (
             <SectionCard title="จัดการผู้ดูแลระบบ" subtitle="เพิ่ม หรือลบบัญชีผู้ดูแลภายในระบบ">
               <div className="grid gap-4">
                 <form onSubmit={handleAddAdminUser} className="grid sm:grid-cols-3 gap-2 items-end">
                   <div className="sm:col-span-1">
                     <label className="text-sm text-slate-700">ชื่อผู้ใช้ใหม่</label>
                     <input value={newAdminUser} onChange={(e)=>setNewAdminUser(e.target.value)} className="w-full mt-1 p-3 rounded-xl border border-orange-200" placeholder="username" />
                   </div>
                   <div className="sm:col-span-1">
                     <label className="text-sm text-slate-700">รหัสผ่าน</label>
                     <input type="password" value={newAdminPass} onChange={(e)=>setNewAdminPass(e.target.value)} className="w-full mt-1 p-3 rounded-xl border border-orange-200" placeholder="password" />
                   </div>
                   <div className="sm:col-span-1 flex gap-2">
                     <button type="submit" className="h-11 px-4 rounded-full bg-green-600 text-white font-semibold">เพิ่มผู้ดูแล</button>
                     <button type="button" onClick={()=>{ setNewAdminUser(''); setNewAdminPass('') }} className="h-11 px-4 rounded-full border border-orange-200 text-orange-700">ล้าง</button>
                   </div>
                   {addAdminError && <div className="sm:col-span-3 text-sm text-red-600">{addAdminError}</div>}
                 </form>

                 <div>
                  <div className="text-sm text-slate-600 mb-2">ผู้ดูแลทั้งหมด {adminUsers.length} คน</div>
                  <div className="flex flex-col gap-2">
                    {adminUsers.map((u, i) => (
                      <div key={u.username || i} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-orange-100 bg-white">
                        <div>
                          <div className="font-semibold text-orange-700">{u.username}</div>
                          <div className="text-xs text-slate-500">รหัสผ่าน: {u.password ? '••••••' : '-'}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={()=>handleRemoveAdmin(u.username)} className="px-3 py-1 rounded-full bg-red-600 text-white text-sm">ลบ</button>
                        </div>
                      </div>
                    ))}
                 </div>
                                 </div>
               </div>
             </SectionCard>
          )}

          {tab === 'accounts' && (
            <SectionCard title="จัดการบัญชีผู้ใช้ & ร้านค้า" subtitle="ลบผู้ใช้ แก้รหัสผ่าน หรือ ลบร้านค้าที่แสดงในระบบ">
              <div className="grid gap-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-lg">ผู้ใช้งาน</div>
                    <div className="text-sm text-slate-500">ทั้งหมด {users.length} รายการ</div>
                  </div>
                  <div className="grid gap-2">
                    {users.map(u => (
                      <div key={u.email || u._id} className="p-3 rounded-xl border bg-white flex items-center gap-3">
                        <div className="flex-1">
                          <div className="font-semibold">{u.fullName || u.email}</div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1 rounded-full bg-yellow-500 text-white text-sm" onClick={async ()=>{
                            const { value: newPass } = await Swal.fire({ title: 'ตั้งรหัสผ่านใหม่', input: 'password', inputLabel: `ตั้งรหัสผ่านใหม่ให้ ${u.email}`, showCancelButton: true })
                            if (!newPass) return
                            const res = await fetch('/api/admin-users', { method: 'PATCH', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email: u.email, password: newPass }) })
                            if (!res.ok) return Swal.fire({ icon: 'error', title: 'ไม่สามารถเปลี่ยนรหัสผ่านได้' })
                            Swal.fire({ icon: 'success', title: 'เปลี่ยนรหัสผ่านสำเร็จ', timer: 1200, showConfirmButton: false })
                          }}>เปลี่ยนรหัสผ่าน</button>
                          <button className="px-3 py-1 rounded-full bg-red-600 text-white text-sm" onClick={async ()=>{
                            const ok = await Swal.fire({ title: `ลบผู้ใช้ ${u.email}?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'ลบ' })
                            if (!ok.isConfirmed) return
                            await fetch(`/api/admin-users?email=${encodeURIComponent(u.email)}`, { method: 'DELETE' })
                            await fetchUsers()
                            Swal.fire({ icon: 'success', title: 'ลบแล้ว', timer: 1000, showConfirmButton: false })
                          }}>ลบ</button>
                        </div>
                      </div>
                    ))}
                    {users.length===0 && <div className="text-slate-500">ไม่มีผู้ใช้งาน</div>}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="font-semibold text-lg">ร้านค้าที่ลงทะเบียน</div>
                    <div className="text-sm text-slate-500">ทั้งหมด {sellersList.length} ร้าน</div>
                  </div>
                  <div className="grid gap-2">
                    {sellersList.map(s => (
                      <div key={s.username || s._id} className="p-3 rounded-xl border bg-white flex items-center gap-3">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded overflow-hidden bg-orange-50 border">{s.image ? <img src={s.image} className="w-full h-full object-cover" /> : <Store className="w-6 h-6 text-orange-500 m-2" />}</div>
                          <div>
                            <div className="font-semibold">{s.shopName || s.username}</div>
                            <div className="text-xs text-slate-500">{s.username}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1 rounded-full bg-red-600 text-white text-sm" onClick={async ()=>{
                            const ok = await Swal.fire({ title: `ลบร้าน ${s.shopName || s.username}?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'ลบ' })
                            if (!ok.isConfirmed) return
                            const res = await fetch(`/api/seller-info?username=${encodeURIComponent(s.username)}`, { method: 'DELETE' })
                            if (!res.ok) return Swal.fire({ icon: 'error', title: 'ลบไม่สำเร็จ' })
                            await fetchSellersList()
                            Swal.fire({ icon: 'success', title: 'ลบแล้ว', timer: 1000, showConfirmButton: false })
                          }}>ลบร้าน</button>
                        </div>
                      </div>
                    ))}
                    {sellersList.length===0 && <div className="text-slate-500">ไม่มีร้านค้าในระบบ</div>}
                  </div>
                </div>
              </div>
            </SectionCard>
          )}
 
        </main>
 
        {/* Enhanced Chat panel */}
        <>
          {!chatOpen && (
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              title="เปิดแชทคำสั่งซื้อ"
              className="fixed right-6 top-1/2 -translate-y-1/2 z-50 group"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 blur opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                {selectedOrderId && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">!</div>
                )}
              </div>
            </button>
          )}

          {chatOpen && (
            <div className="fixed right-6 top-20 z-50 w-[400px] h-[75vh] bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-orange-100 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-orange-700">แชทคำสั่งซื้อ</div>
                    <div className="text-xs text-slate-500">
                      {selectedOrderId ? `#${selectedOrderId.slice(-6)}` : 'เลือกคำสั่งซื้อเพื่อเริ่มแชท'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setChatOpen(false)}
                  className="h-10 w-10 grid place-items-center rounded-xl hover:bg-orange-100 transition-colors duration-200 text-slate-600 hover:text-orange-700"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-auto">
                {selectedOrderId ? <OrderChatPanel orderId={selectedOrderId} /> : (
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-orange-500" />
                    </div>
                    <div className="text-sm text-slate-500">กรุณาเลือกคำสั่งซื้อเพื่อเริ่มแชท</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      </div>
    </div>
  )
}

// Enhanced StatsCard component
function StatsCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: 'orange' | 'amber' | 'green' }) {
  const colorClasses: Record<'orange' | 'amber' | 'green', string> = {
    orange: 'from-orange-500/10 to-orange-600/10 border-orange-200/50 text-orange-700',
    amber: 'from-amber-500/10 to-amber-600/10 border-amber-200/50 text-amber-700',
    green: 'from-green-500/10 to-green-600/10 border-green-200/50 text-green-700'
  }
  const getColorClass = (k: 'orange'|'amber'|'green') => colorClasses[k]
  
  return (
    <div className={`relative group cursor-default`}>
      <div className="absolute inset-0 bg-gradient-to-r opacity-50 rounded-2xl blur-xl transition-opacity group-hover:opacity-75"></div>
  <div className={`relative rounded-2xl p-4 bg-gradient-to-r ${getColorClass(color)} border backdrop-blur-sm transform hover:scale-105 transition-all duration-300`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium opacity-75">{label}</div>
            <div className="text-xl font-bold">{value.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Enhanced NavButton component
function NavButton({ active, children, onClick, icon, badge }: { 
  active?: boolean; 
  children: React.ReactNode; 
  onClick: () => void; 
  icon?: React.ReactNode;
  badge?: number;
}) {
  return (
    <button 
      onClick={onClick} 
      className={`relative group h-12 px-4 rounded-2xl text-sm font-semibold inline-flex items-center gap-3 transition-all duration-300 transform w-full text-left overflow-hidden ${
        active 
          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg scale-105' 
          : 'bg-white/50 text-orange-700 hover:bg-orange-50 border border-orange-100/50 hover:border-orange-200 hover:scale-105'
      }`}
    >
      {active && <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 animate-pulse"></div>}
      <span className={`relative z-10 w-5 h-5 ${active ? 'text-white' : 'text-orange-600'}`}>{icon}</span>
      <span className="relative z-10 truncate flex-1">{children}</span>
      {badge && badge > 0 && (
        <span className={`relative z-10 text-xs px-2 py-0.5 rounded-full font-bold ${
          active ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-700'
        }`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {active && <span className="relative z-10 text-xs bg-white/20 px-2 py-0.5 rounded-full">●</span>}
    </button>
  )
}

// Enhanced SectionCard component
function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="relative group">
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-amber-500/5 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
      <div className="relative rounded-3xl border border-orange-200/50 bg-white/80 backdrop-blur-xl shadow-xl p-8 transition-all duration-500 hover:shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-4 mb-2">
              <div className="w-1 h-10 rounded-full bg-gradient-to-b from-orange-400 to-amber-400"></div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">{title}</h2>
            </div>
            {subtitle && <p className="text-slate-500 text-sm ml-5">{subtitle}</p>}
          </div>
        </div>
        <div className="relative">{children}</div>
      </div>
    </section>
  )
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

function Clock(props: any) { 
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> 
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
             <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="ค้นหา: ชื่อ/เบอร์/ที่อยู่/สินค้า/รหัสออเดอร์" className="h-11 w-full rounded-xl border border-orange-200 bg-white pl-9 pr-3 text-sm outline-none focus:ring-4 focus:ring-orange-300" />
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
                     <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(o._id) }} className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-white text-xs font-semibold hover:bg-red-700" title="ลบคำสั่งซื้อ">
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
                       <label className="text-xs font-semibold text-slate-600 mb-2">อัปเดตสถานะ</label>
                       <select className="h-10 rounded-lg border border-orange-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-orange-300" value={o.status || 'pending'} onChange={(e)=>onUpdateStatus(o._id, e.target.value as any)}>
                         {STATUS_ORDER.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                       </select>

                       <label className="mt-2 text-xs font-semibold text-slate-600">เลขขนส่ง</label>
                       <div className="flex gap-2">
                         <input className="h-10 flex-1 rounded-lg border border-orange-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-orange-300" placeholder="กรอกเลขขนส่ง" value={shippingInputs[o._id] ?? ''} onChange={(e)=>setShippingInputs(prev=>({ ...prev, [o._id]: e.target.value }))} onClick={(e)=>e.stopPropagation()} />
                         <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); onUpdateShipping(o._id, shippingInputs[o._id] ?? '') }} className="h-10 rounded-lg bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700">บันทึก</button>
                         {o.shippingNumber && (
                           <button onClick={async (e: React.MouseEvent) => { 
                             e.stopPropagation(); 
                             if (o.shippingNumber) { 
                               await copyToClipboard(o.shippingNumber); 
                               Swal.fire({ icon: 'success', title: 'คัดลอกแล้ว', timer: 900, showConfirmButton: false }) 
                             } 
                           }} className="h-10 rounded-lg bg-white px-3 border border-orange-200 text-slate-700 hover:bg-orange-50" title="คัดลอกเลขขนส่ง">
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

 // Products list component for admin
interface ProductsListProps {
  products: Product[]
  onRefresh: () => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const ProductsList = ({ products, onRefresh, onDelete }: ProductsListProps) => {
  const [page, setPage] = useState(1)
  const perPage = 20
  const total = products.length
  const pages = Math.max(1, Math.ceil(total / perPage))
  const paged = products.slice((page - 1) * perPage, page * perPage)

  const handleDelete = async (id: string) => {
    const ok = await Swal.fire({ icon: 'warning', title: 'ลบสินค้านี้หรือไม่?', showCancelButton: true, confirmButtonText: 'ลบ' })
    if (!ok.isConfirmed) return
    await onDelete(id)
    await onRefresh()
    Swal.fire({ icon: 'success', title: 'ลบแล้ว', timer: 900, showConfirmButton: false })
  }

  return (
    <SectionCard title="รายการสินค้า" subtitle={`ทั้งหมด ${total} รายการ`}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paged.map(p => (
            <div key={p._id} className="bg-white rounded-xl border p-4 flex gap-3 items-center">
              <div className="w-20 h-20 bg-slate-50 flex items-center justify-center overflow-hidden rounded">
                {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <div className="text-slate-300">ไม่มีรูป</div>}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-800 line-clamp-2">{p.name}</div>
                <div className="text-sm text-slate-500">฿{Number(p.price).toLocaleString()}</div>
                <div className="text-xs text-slate-400 mt-2">หมวดหมู่: {p.category || '-'}</div>
                {p.seller && <div className="text-xs text-amber-700 mt-1">จากร้าน: {p.username || 'ไม่ระบุ'}</div>}
              </div>
              <div className="flex flex-col gap-2">
                <a href={`/product/${p._id}`} target="_blank" rel="noreferrer" className="px-3 py-2 rounded-full bg-slate-100 text-slate-700 text-sm">ดู</a>
                <button onClick={()=>handleDelete(p._id)} className="px-3 py-2 rounded-full bg-red-600 text-white text-sm">ลบ</button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">หน้า {page} / {pages}</div>
          <div className="flex items-center gap-2">
            <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="px-3 py-2 rounded bg-slate-100 hover:bg-slate-200">ก่อนหน้า</button>
            <button disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))} className="px-3 py-2 rounded bg-slate-100 hover:bg-slate-200">ถัดไป</button>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
