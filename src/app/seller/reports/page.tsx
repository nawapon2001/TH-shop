'use client'

import React, { useState, useEffect, useMemo } from 'react'
import SellerSidebar from '@/components/SellerSidebar'
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Calendar,
  Filter,
  Download,
  BarChart3,
  PieChart,
  Eye,
  ChevronDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

interface OrderItem {
  name: string
  price: number
  qty: number
  seller?: string
  productId?: string
  selectedOptions?: any
}

interface Order {
  _id: string
  name: string
  phone: string
  address: string
  status: string
  payment: string
  delivery: string
  items: OrderItem[]
  amounts: {
    subtotal: number
    shipCost: number
    codFee?: number
    total: number
  }
  createdAt: string
  updatedAt: string
}

type DateRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all'
type SortBy = 'date' | 'amount' | 'items' | 'status'

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  shipping: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

const STATUS_LABELS = {
  pending: 'รอการชำระ',
  confirmed: 'ยืนยันแล้ว',
  preparing: 'กำลังเตรียม',
  shipping: 'กำลังจัดส่ง',
  completed: 'สำเร็จ',
  cancelled: 'ยกเลิก'
}

export default function SellerReportsPage() {
  const [seller, setSeller] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [sellerLoading, setSellerLoading] = useState(true)
  const [dateRange, setDateRange] = useState<DateRange>('month')
  const [sortBy, setSortBy] = useState<SortBy>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  useEffect(() => {
    // Check both possible keys for seller data
    const sellerData = localStorage.getItem('seller') || localStorage.getItem('sellerUser')
    console.log('Seller data from localStorage:', sellerData)
    
    if (sellerData) {
      try {
        // If it's a JSON string, parse it
        let sellerUsername = sellerData
        try {
          const parsed = JSON.parse(sellerData)
          console.log('Parsed seller data:', parsed)
          sellerUsername = parsed.username || parsed.name || sellerData
        } catch {
          // If not JSON, use as is (plain string)
          console.log('Using seller data as plain string:', sellerData)
        }
        
        console.log('Setting seller to:', sellerUsername)
        setSeller(sellerUsername)
      } catch (error) {
        console.error('Error parsing seller data:', error)
        setSeller(null)
      }
    } else {
      console.log('No seller data in localStorage')
      setSeller(null)
    }
    setSellerLoading(false)
  }, [])

  useEffect(() => {
    const fetchOrders = async () => {
      if (!seller) return
      
      setLoading(true)
      try {
        const response = await fetch(`/api/orders?seller=${encodeURIComponent(seller)}`)
        if (response.ok) {
          const data = await response.json()
          // Filter orders to only include items from this seller
          const sellerOrders = Array.isArray(data) ? data.filter(order => 
            order.items && order.items.some((item: OrderItem) => 
              item.seller === seller || 
              (item.productId && item.productId.includes('seller'))
            )
          ).map(order => ({
            ...order,
            // Filter items to only include those from this seller
            items: order.items.filter((item: OrderItem) => 
              item.seller === seller || 
              (item.productId && item.productId.includes('seller'))
            ),
            // Recalculate amounts based on seller's items only
            amounts: {
              ...order.amounts,
              subtotal: order.items
                .filter((item: OrderItem) => 
                  item.seller === seller || 
                  (item.productId && item.productId.includes('seller'))
                )
                .reduce((sum: number, item: OrderItem) => sum + (item.price * item.qty), 0),
              total: order.items
                .filter((item: OrderItem) => 
                  item.seller === seller || 
                  (item.productId && item.productId.includes('seller'))
                )
                .reduce((sum: number, item: OrderItem) => sum + (item.price * item.qty), 0)
            }
          })) : []
          
          setOrders(sellerOrders)
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [seller])

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    if (!orders.length) return []
    
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    let startDate: Date
    
    switch (dateRange) {
      case 'today':
        startDate = startOfDay
        break
      case 'week':
        startDate = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3
        startDate = new Date(now.getFullYear(), quarterMonth, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        return orders.filter(order => 
          selectedStatus === 'all' || order.status === selectedStatus
        )
    }
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt)
      const dateMatch = orderDate >= startDate
      const statusMatch = selectedStatus === 'all' || order.status === selectedStatus
      return dateMatch && statusMatch
    })
  }, [orders, dateRange, selectedStatus])

  // Sort orders
  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders].sort((a, b) => {
      let aValue: any, bValue: any
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt).getTime()
          bValue = new Date(b.createdAt).getTime()
          break
        case 'amount':
          aValue = a.amounts.total
          bValue = b.amounts.total
          break
        case 'items':
          aValue = a.items.reduce((sum, item) => sum + item.qty, 0)
          bValue = b.items.reduce((sum, item) => sum + item.qty, 0)
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        default:
          return 0
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    return sorted
  }, [filteredOrders, sortBy, sortDirection])

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalOrders = filteredOrders.length
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.amounts.total, 0)
    const totalItems = filteredOrders.reduce((sum, order) => 
      sum + order.items.reduce((itemSum, item) => itemSum + item.qty, 0), 0
    )
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    
    const statusCounts = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const completedOrders = filteredOrders.filter(order => order.status === 'completed')
    const completedRevenue = completedOrders.reduce((sum, order) => sum + order.amounts.total, 0)
    
    return {
      totalOrders,
      totalRevenue,
      totalItems,
      averageOrderValue,
      statusCounts,
      completedOrders: completedOrders.length,
      completedRevenue
    }
  }, [filteredOrders])

  const handleSort = (newSortBy: SortBy) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(newSortBy)
      setSortDirection('desc')
    }
  }

  const exportToCSV = () => {
    const headers = ['วันที่', 'หมายเลขคำสั่งซื้อ', 'ลูกค้า', 'สถานะ', 'จำนวนสินค้า', 'ยอดรวม']
    const rows = sortedOrders.map(order => [
      new Date(order.createdAt).toLocaleDateString('th-TH'),
      order._id,
      order.name,
      STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status,
      order.items.reduce((sum, item) => sum + item.qty, 0),
      order.amounts.total.toFixed(2)
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `sales-report-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (sellerLoading) {
    return (
      <div className="flex min-h-screen">
        <SellerSidebar />
        <div className="flex-1 lg:ml-72 p-8">
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังตรวจสอบสถานะการเข้าสู่ระบบ...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!seller) {
    return (
      <div className="flex min-h-screen">
        <SellerSidebar />
        <div className="flex-1 lg:ml-72 p-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                กรุณาเข้าสู่ระบบ
              </h3>
              <p className="text-gray-600 mb-4">
                คุณต้องเข้าสู่ระบบในฐานะผู้ขายเพื่อดูรายงานยอดขาย
              </p>
              <button
                onClick={() => window.location.href = '/seller/auth'}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl transition-colors font-medium"
              >
                เข้าสู่ระบบ
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50">
      <SellerSidebar />
      <div className="flex-1 lg:ml-72">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-pink-500 text-white p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">รายงานยอดขายของฉัน</h1>
                <p className="text-orange-100">
                  ติดตามและวิเคราะห์ยอดขายสินค้าของคุณ ({seller})
                </p>
              </div>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-xl transition-all duration-300 font-medium"
              >
                <Download className="w-5 h-5" />
                ส่งออก CSV
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-8">
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Date Range Filter */}
                  <div className="relative">
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value as DateRange)}
                      className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="today">วันนี้</option>
                      <option value="week">7 วันที่ผ่านมา</option>
                      <option value="month">เดือนนี้</option>
                      <option value="quarter">ไตรมาสนี้</option>
                      <option value="year">ปีนี้</option>
                      <option value="all">ทั้งหมด</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    >
                      <option value="all">สถานะทั้งหมด</option>
                      <option value="pending">รอการชำระ</option>
                      <option value="confirmed">ยืนยันแล้ว</option>
                      <option value="preparing">กำลังเตรียม</option>
                      <option value="shipping">กำลังจัดส่ง</option>
                      <option value="completed">สำเร็จ</option>
                      <option value="cancelled">ยกเลิก</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  </div>

                  <div className="text-sm text-gray-500">
                    แสดง {filteredOrders.length} จาก {orders.length} คำสั่งซื้อสินค้าของฉัน
                  </div>
                  
                  <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                    ผู้ขาย: {seller}
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">คำสั่งซื้อของฉัน</p>
                      <p className="text-3xl font-bold">{statistics.totalOrders}</p>
                      <p className="text-blue-200 text-xs mt-1">จากผู้ขาย: {seller}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">ยอดขายของฉัน</p>
                      <p className="text-3xl font-bold">฿{statistics.totalRevenue.toLocaleString()}</p>
                      <p className="text-green-200 text-xs mt-1">จากสินค้าของฉันเท่านั้น</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">คำสั่งซื้อสำเร็จ</p>
                      <p className="text-3xl font-bold">{statistics.completedOrders}</p>
                      <p className="text-purple-200 text-xs mt-1">รายได้ที่ได้รับแล้ว</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">ค่าเฉลี่ยต่อคำสั่งซื้อ</p>
                      <p className="text-3xl font-bold">฿{statistics.averageOrderValue.toFixed(0)}</p>
                      <p className="text-orange-200 text-xs mt-1">ของสินค้าฉัน</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">รายการคำสั่งซื้อสินค้าของฉัน</h3>
                    <div className="text-sm text-gray-500">
                      ผู้ขาย: <span className="font-medium text-orange-600">{seller}</span>
                    </div>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('date')}
                        >
                          <div className="flex items-center gap-1">
                            วันที่
                            {sortBy === 'date' && (
                              sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ลูกค้า / สินค้าของฉัน
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center gap-1">
                            สถานะ
                            {sortBy === 'status' && (
                              sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('items')}
                        >
                          <div className="flex items-center gap-1">
                            จำนวนสินค้า
                            {sortBy === 'items' && (
                              sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => handleSort('amount')}
                        >
                          <div className="flex items-center justify-end gap-1">
                            ยอดรวม
                            {sortBy === 'amount' && (
                              sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sortedOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(order.createdAt).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{order.name}</div>
                              <div className="text-sm text-gray-500">{order.phone}</div>
                              <div className="text-xs text-orange-600 mt-1">
                                สินค้า: {order.items.map(item => item.name).join(', ')}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              STATUS_COLORS[order.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                            {order.items.reduce((sum, item) => sum + item.qty, 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            ฿{order.amounts.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {sortedOrders.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">ไม่มีข้อมูลคำสั่งซื้อสินค้าของคุณ</h3>
                    <p className="text-gray-500">
                      ไม่พบคำสั่งซื้อสินค้าของคุณในช่วงเวลาที่เลือก ลองปรับเปลี่ยนตัวกรองการค้นหา
                    </p>
                    <p className="text-sm text-orange-600 mt-2">
                      ผู้ขาย: {seller}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
