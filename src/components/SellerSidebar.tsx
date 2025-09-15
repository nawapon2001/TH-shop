'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Store, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  User, 
  LogOut,
  Menu,
  X,
  FileText,
  Home
} from 'lucide-react'

export default function SellerSidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [seller, setSeller] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // ตรวจสอบข้อมูล seller จาก localStorage - check both possible keys
    const sellerData = localStorage.getItem('seller') || localStorage.getItem('sellerUser')
    if (sellerData) {
      try {
        // If it's a JSON string, parse it
        let sellerUsername = sellerData
        try {
          const parsed = JSON.parse(sellerData)
          sellerUsername = parsed.username || parsed.name || sellerData
        } catch {
          // If not JSON, use as is (plain string)
        }
        setSeller(sellerUsername || 'Seller')
      } catch {
        setSeller('Seller')
      }
    }
  }, [])

  const menuItems = [
    {
      title: 'หน้าหลัก',
      href: '/',
      icon: Home,
      description: 'กลับไปหน้าหลัก'
    },
    {
      title: 'การลงสินค้า',
      href: '/seller',
      icon: BarChart3,
      description: 'ลงสินค้าใหม่และจัดการ'
    },
    {
      title: 'จัดการสินค้า',
      href: '/seller/manage',
      icon: Package,
      description: 'เพิ่ม แก้ไข ลบสินค้า'
    },
    {
      title: 'แสดงสินค้าทั้งหมด',
      href: '/seller/create',
      icon: Package,
      description: 'ดูและจัดการสินค้าทั้งหมด'
    },
    {
      title: 'คำสั่งซื้อ',
      href: '/seller/orders',
      icon: ShoppingCart,
      description: 'จัดการออเดอร์'
    },
    {
      title: 'รายงาน',
      href: '/seller/reports',
      icon: FileText,
      description: 'รายงานยอดขาย'
    },
    {
      title: 'ตั้งค่า',
      href: '/seller/settings',
      icon: Settings,
      description: 'ตั้งค่าร้านค้า'
    }
  ]

  const isActive = (href: string) => {
    if (href === '/seller') {
      return pathname === '/seller'
    }
    return pathname.startsWith(href)
  }

  const handleLogout = () => {
    localStorage.removeItem('seller')
    window.location.href = '/seller/auth'
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-gradient-to-r from-orange-500 to-pink-500 text-white p-3 rounded-2xl shadow-xl ring-2 ring-white/30 backdrop-blur-sm transform hover:scale-110 active:scale-95 transition-all duration-300"
      >
        <div className="relative">
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          {/* Pulse effect when menu is open */}
          {isOpen && (
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
          )}
        </div>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full w-72 bg-gradient-to-br from-white via-orange-50 to-orange-100 
        backdrop-blur-xl border-r border-orange-200/30 shadow-2xl z-50 transition-all duration-500 ease-out
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/40 before:to-transparent before:backdrop-blur-sm
      `}>
        {/* Header */}
        <div className="relative p-6 border-b border-orange-200/30 bg-gradient-to-r from-orange-600 via-orange-500 to-pink-500 overflow-hidden">
          {/* Animated background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-pink-400/20 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]"></div>
          
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 bg-white/90 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white/30 transform hover:scale-110 transition-all duration-300">
              <Store className="w-7 h-7 text-orange-600" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl tracking-wide drop-shadow-lg">Seller Panel</h2>
              <p className="text-orange-100/90 text-sm font-medium">{seller || 'ยินดีต้อนรับ'}</p>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-pink-300/20 rounded-full blur-xl"></div>
        </div>

        {/* Navigation */}
        <nav className="relative flex-1 p-6 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-transparent">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group relative flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ease-out
                  transform hover:scale-105 hover:translate-x-2
                  ${active 
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-xl shadow-orange-500/25 ring-2 ring-orange-300/30' 
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-orange-100 hover:to-pink-50 hover:text-orange-800 hover:shadow-lg'
                  }
                  before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-white/10 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
                `}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => setIsOpen(false)}
              >
                <div className={`relative p-2 rounded-xl ${active ? 'bg-white/20' : 'bg-orange-100 group-hover:bg-orange-200'} transition-all duration-300`}>
                  <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-orange-600'} transition-all duration-300`} />
                </div>
                <div className="flex-1">
                  <span className={`font-semibold text-sm ${active ? 'text-white' : 'text-gray-700 group-hover:text-orange-800'} transition-colors duration-300`}>
                    {item.title}
                  </span>
                  <p className={`text-xs mt-1 ${active ? 'text-white/80' : 'text-gray-500 group-hover:text-orange-600'} transition-colors duration-300`}>
                    {item.description}
                  </p>
                </div>
                {active && (
                  <div className="relative">
                    <div className="w-3 h-3 bg-white rounded-full shadow-lg animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-white rounded-full animate-ping opacity-50"></div>
                  </div>
                )}
                
                {/* Hover effect indicator */}
                <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-orange-400 to-pink-400 rounded-full transition-all duration-300 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}></div>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="relative p-6 border-t border-orange-200/30 bg-gradient-to-br from-orange-50/80 to-pink-50/80 backdrop-blur-sm">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-100/50 to-pink-100/50"></div>
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-orange-300 to-transparent"></div>
          
          <div className="relative flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-orange-200/50 transform hover:scale-110 transition-all duration-300">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-0.5">{seller || 'Seller'}</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full shadow-sm animate-pulse"></div>
                <p className="text-xs text-gray-600 font-medium">ระดับ: มาตรฐาน</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="relative w-full flex items-center justify-center gap-3 px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl hover:from-red-600 hover:to-red-700 transition-all duration-300 text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden group"
          >
            {/* Button background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <LogOut className="relative w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
            <span className="relative">ออกจากระบบ</span>
            
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </button>
          
          <div className="relative mt-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
              <div className="w-1 h-1 bg-pink-400 rounded-full"></div>
              <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
            </div>
            <p className="text-xs text-gray-500 font-medium tracking-wide">GooCode</p>
          
          </div>
        </div>
      </div>
    </>
  )
}
