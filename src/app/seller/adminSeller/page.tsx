'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { 
  Store, User, Package, ShoppingCart, TrendingUp, 
  BarChart3, Calendar, Phone, Mail, MapPin, Edit, 
  Plus, Eye, Settings, LogOut 
} from 'lucide-react'

type SellerStats = {
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
}

export default function AdminSellerPage() {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [seller, setSeller] = useState<any>(null)
  const [stats, setStats] = useState<SellerStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = typeof window !== 'undefined' ? localStorage.getItem('sellerUser') : null
    if (!u) {
      router.push('/seller/auth')
      return
    }
    setUsername(u)
    
    const fetchData = async () => {
      try {
        // Fetch seller info
        const sellerRes = await fetch(`/api/seller-info?username=${encodeURIComponent(u)}`)
        if (!sellerRes.ok) throw new Error('ไม่พบข้อมูลร้านค้า')
        const sellerData = await sellerRes.json().catch(() => null)
        setSeller(sellerData)

        // Fetch products for stats
        const productsRes = await fetch(`/api/seller-products?username=${encodeURIComponent(u)}`)
        if (productsRes.ok) {
          const products = await productsRes.json().catch(() => [])
          setStats(prev => ({ ...prev, totalProducts: Array.isArray(products) ? products.length : 0 }))
        }

        // Fetch orders for stats
        const ordersRes = await fetch(`/api/orders?seller=${encodeURIComponent(u)}`)
        if (ordersRes.ok) {
          const orders = await ordersRes.json().catch(() => [])
          if (Array.isArray(orders)) {
            const totalRevenue = orders.reduce((sum, order) => 
              sum + (order.amounts?.total || order.items?.reduce((s: number, item: any) => s + (item.price || 0), 0) || 0), 0
            )
            const pendingOrders = orders.filter(order => order.status === 'pending' || !order.status).length
            
            setStats(prev => ({
              ...prev,
              totalOrders: orders.length,
              totalRevenue,
              pendingOrders
            }))
            
            // Set recent orders (latest 5)
            setRecentOrders(orders.slice(0, 5))
          }
        }
      } catch (err: any) {
        Swal.fire({ icon: 'error', title: 'โหลดข้อมูลไม่สำเร็จ', text: err?.message || '' })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('sellerUser')
    localStorage.removeItem('sellerToken')
    router.push('/seller/auth')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-orange-700 font-medium">กำลังโหลดข้อมูลร้านค้า...</p>
        </div>
      </div>
    )
  }

  if (!seller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 p-6">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center max-w-md w-full border border-orange-200">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-orange-600" />
          </div>
          <h2 className="text-2xl font-bold text-orange-800 mb-2">ไม่พบข้อมูลร้านค้า</h2>
          <p className="text-slate-600 mb-6">คุณยังไม่ได้สร้างร้านค้า กรุณาสร้างร้านค้าเพื่อเริ่มต้นการขาย</p>
          <button 
            onClick={() => router.push(`/seller/create?username=${encodeURIComponent(username||'')}`)} 
            className="w-full h-12 bg-gradient-to-r from-orange-600 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-amber-600 transition-all"
          >
            สร้างร้านค้าใหม่
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white border-b border-orange-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-lg">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-orange-800">{seller.shopName}</h1>
                <p className="text-slate-600">แดชบอร์ดผู้ขาย • {seller.username}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/seller/manage')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 text-white font-medium hover:bg-orange-700 transition-all"
              >
                <Settings className="w-4 h-4" />
                ตั้งค่าร้าน
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-200 text-orange-700 font-medium hover:bg-orange-50 transition-all"
              >
                <LogOut className="w-4 h-4" />
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Shop Profile Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-orange-200 p-8 mb-8">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              {seller.image ? (
                <div className="w-full aspect-square rounded-2xl overflow-hidden border border-orange-200 shadow-sm">
                  <img src={seller.image} alt="shop" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full aspect-square rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50 flex items-center justify-center">
                  <div className="text-center text-orange-400">
                    <Store className="w-16 h-16 mx-auto mb-2" />
                    <span className="text-sm">ไม่มีรูปโปรไฟล์</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="lg:col-span-3">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-slate-600">เจ้าของร้าน</p>
                      <p className="font-semibold text-slate-800">{seller.fullName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-orange-500" />
                    <div>
                      <p className="text-sm text-slate-600">เบอร์โทรติดต่อ</p>
                      <p className="font-semibold text-slate-800">{seller.phone}</p>
                    </div>
                  </div>
                  
                  {seller.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-slate-600">อีเมล</p>
                        <p className="font-semibold text-slate-800">{seller.email}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  {seller.province && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-slate-600">จังหวัด</p>
                        <p className="font-semibold text-slate-800">{seller.province}</p>
                      </div>
                    </div>
                  )}
                  
                  {seller.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-orange-500 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-600">ที่อยู่</p>
                        <p className="font-semibold text-slate-800">{seller.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Package className="w-8 h-8" />}
            title="สินค้าทั้งหมด"
            value={stats.totalProducts}
            color="blue"
            onClick={() => router.push('/seller/manage')}
          />
          <StatCard
            icon={<ShoppingCart className="w-8 h-8" />}
            title="คำสั่งซื้อทั้งหมด"
            value={stats.totalOrders}
            color="green"
            onClick={() => router.push('/seller/orders')}
          />
          <StatCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="ยอดขายรวม"
            value={`฿${stats.totalRevenue.toLocaleString()}`}
            color="purple"
          />
          <StatCard
            icon={<Calendar className="w-8 h-8" />}
            title="คำสั่งซื้อรอดำเนินการ"
            value={stats.pendingOrders}
            color="orange"
            onClick={() => router.push('/seller/orders')}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <QuickActionCard
            icon={<Plus className="w-6 h-6" />}
            title="เพิ่มสินค้าใหม่"
            subtitle="เพิ่มสินค้าเข้าร้าน"
            onClick={() => router.push('/seller/products/create')}
            color="green"
          />
          <QuickActionCard
            icon={<Eye className="w-6 h-6" />}
            title="ดูสินค้าทั้งหมด"
            subtitle="จัดการสินค้าในร้าน"
            onClick={() => router.push('/seller/manage')}
            color="blue"
          />
          <QuickActionCard
            icon={<ShoppingCart className="w-6 h-6" />}
            title="คำสั่งซื้อ"
            subtitle="ตรวจสอบออเดอร์"
            onClick={() => router.push('/seller/orders')}
            color="purple"
          />
          <QuickActionCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="รายงานยอดขาย"
            subtitle="วิเคราะห์ข้อมูลขาย"
            onClick={() => Swal.fire({ icon: 'info', title: 'ฟีเจอร์นี้กำลังพัฒนา' })}
            color="orange"
          />
        </div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl border border-orange-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-orange-800">คำสั่งซื้อล่าสุด</h2>
              <button
                onClick={() => router.push('/seller/orders')}
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                ดูทั้งหมด →
              </button>
            </div>
            
            <div className="space-y-4">
              {recentOrders.map((order, index) => (
                <div key={order._id || index} className="flex items-center justify-between p-4 border border-orange-100 rounded-xl hover:bg-orange-50/50 transition">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">#{(order._id || '').slice(-6)}</p>
                      <p className="text-sm text-slate-600">{order.name || 'ไม่ระบุชื่อ'}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      ฿{(order.amounts?.total || order.items?.reduce((s: number, item: any) => s + (item.price || 0), 0) || 0).toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('th-TH') : 'ไม่ระบุวันที่'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  icon, 
  title, 
  value, 
  color, 
  onClick 
}: { 
  icon: React.ReactNode
  title: string
  value: string | number
  color: 'blue' | 'green' | 'purple' | 'orange'
  onClick?: () => void
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-400',
    green: 'from-green-500 to-emerald-400',
    purple: 'from-purple-500 to-pink-400',
    orange: 'from-orange-500 to-amber-400'
  }
  
  return (
    <div 
      className={`bg-white rounded-2xl shadow-xl border border-orange-200 p-6 ${onClick ? 'cursor-pointer hover:shadow-2xl' : ''} transition-all`}
      onClick={onClick}
    >
      <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-xl flex items-center justify-center text-white mb-4`}>
        {icon}
      </div>
      <h3 className="text-slate-600 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  )
}

// Quick Action Card Component
function QuickActionCard({
  icon,
  title,
  subtitle,
  onClick,
  color
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  onClick: () => void
  color: 'blue' | 'green' | 'purple' | 'orange'
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500',
    green: 'from-green-500 to-emerald-400 hover:from-green-600 hover:to-emerald-500',
    purple: 'from-purple-500 to-pink-400 hover:from-purple-600 hover:to-pink-500',
    orange: 'from-orange-500 to-amber-400 hover:from-orange-600 hover:to-amber-500'
  }
  
  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-2xl bg-gradient-to-r ${colorClasses[color]} text-white shadow-xl hover:shadow-2xl transition-all text-left w-full`}
    >
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="text-white/90 text-sm">{subtitle}</p>
    </button>
  )
}
