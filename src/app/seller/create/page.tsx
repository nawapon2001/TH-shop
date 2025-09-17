"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { safeProductHref } from '@/lib/product-utils'
import Swal from 'sweetalert2'
import { CartManager } from '@/lib/cart-utils'
import { 
  Package, 
  Trash2, 
  ShoppingCart, 
  Eye,
  Search,
  Grid3x3,
  List,
  Star,
  Plus
} from 'lucide-react'

type Product = {
  _id: string
  name: string
  price: number
  image?: string
  description?: string
  rating?: number
  sold?: number
  category?: string
  seller?: string
  username?: string
  options?: any[]
}

const formatTHB = (value: number) =>
  new Intl.NumberFormat('th-TH', { minimumFractionDigits: 0 }).format(value)

export default function SellerProductsPage() {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'name'>('newest')

  // Update document title
  useEffect(() => {
    document.title = 'สินค้าทั้งหมด | TH-THAI SHOP'
  }, [])

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('sellerUser')
      if (!storedUser) {
        Swal.fire({ 
          icon: 'info', 
          title: 'โปรดเข้าสู่ระบบ', 
          text: 'กรุณาเข้าสู่ระบบผู้ขายก่อน',
          timer: 1800, 
          showConfirmButton: false 
        })
        router.push('/seller/auth')
        return
      }
      
      let parsedUsername = storedUser
      try {
        const parsed = JSON.parse(storedUser)
        parsedUsername = parsed.username || parsed.name || storedUser
      } catch {
        // use as is
      }
      
      setUsername(parsedUsername)
      fetchProducts(parsedUsername)
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/seller/auth')
    }
  }, [router])

  const fetchProducts = async (sellerUsername: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/seller-products?username=${encodeURIComponent(sellerUsername)}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      
      const data = await response.json()
      // API ส่งกลับ array โดยตรง ไม่ใช่ object ที่มี property products
      const mappedProducts = (Array.isArray(data) ? data : []).map((p: any) => ({
        _id: p._id,
        name: p.name || 'ไม่มีชื่อ',
        price: Number(p.price) || 0,
        image: p.image,
        description: p.description,
        rating: p.rating || 0,
        sold: p.sold || 0,
        category: p.category,
        seller: p.seller || p.username,
        username: p.username,
        options: p.options || []
      }))
      
      setProducts(mappedProducts)
    } catch (error) {
      console.error('Fetch products error:', error)
      Swal.fire({ 
        icon: 'error', 
        title: 'เกิดข้อผิดพลาด', 
        text: 'ไม่สามารถโหลดสินค้าได้' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    if (!username) return Swal.fire({ icon: 'warning', title: 'ต้องล็อกอินเป็นผู้ขายก่อน' })
    
    const confirmation = await Swal.fire({ 
      title: 'ยืนยันการลบสินค้า?', 
      text: 'เมื่อลบแล้วสินค้าจะหายจากหน้าร้าน', 
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonText: 'ลบ', 
      cancelButtonText: 'ยกเลิก' 
    })
    
    if (!confirmation.isConfirmed) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/seller-products?id=${encodeURIComponent(productId)}`, { 
        method: 'DELETE' 
      })
      
      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || error?.message || `Delete failed (status ${response.status})`)
      }
      
      await fetchProducts(username)
      Swal.fire({ 
        icon: 'success', 
        title: 'ลบสินค้าเรียบร้อย', 
        timer: 1000, 
        showConfirmButton: false 
      })
    } catch (error: any) {
      console.error('Delete product error:', error)
      Swal.fire({ 
        icon: 'error', 
        title: 'ลบไม่สำเร็จ', 
        text: error?.message || '' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBuyNow = async (product: Product) => {
    try {
      CartManager.addProduct(product, 1)
      router.push('/checkout')
    } catch (error: any) {
      console.error('buy now error:', error)
      Swal.fire({ 
        icon: 'error', 
        title: 'ไม่สามารถสั่งซื้อได้', 
        text: error?.message || '' 
      })
    }
  }

  // Filter and sort products
  const filteredAndSortedProducts = React.useMemo(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      default: // newest
        break
    }

    return filtered
  }, [products, searchTerm, sortBy])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-200 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto absolute top-2 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-8 py-6 shadow-2xl border border-white/20">
            <p className="text-orange-700 font-semibold text-lg mb-2">กำลังโหลดสินค้า...</p>
            <p className="text-orange-600 text-sm">โปรดรอสักครู่</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Search and Filter Section */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white text-sm"
              >
                <option value="newest">ใหม่สุด</option>
                <option value="name">ชื่อ A-Z</option>
                <option value="price_asc">ราคาต่ำ-สูง</option>
                <option value="price_desc">ราคาสูง-ต่ำ</option>
              </select>

              {/* View Mode */}
              <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Grid3x3 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        {filteredAndSortedProducts.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12 text-center">
            <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">
              {searchTerm ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสินค้า'}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchTerm ? 'ลองค้นหาด้วยคำอื่น' : 'เริ่มต้นขายโดยเพิ่มสินค้าแรกของคุณ'}
            </p>
            <Link
              href="/seller"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all duration-200 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              เพิ่มสินค้าใหม่
            </Link>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
            : "space-y-4"
          }>
            {filteredAndSortedProducts.map((product) => (
              <div
                key={product._id}
                className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden hover:shadow-xl transition-all duration-300 group ${
                  viewMode === 'list' ? 'flex items-center p-6' : 'p-0'
                }`}
              >
                {viewMode === 'grid' ? (
                  /* Grid View */
                  <>
                    <div className="relative aspect-square overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                          <Package className="w-16 h-16 text-slate-300" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={safeProductHref(product)}
                          className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                        >
                          <Eye className="w-4 h-4 text-slate-600" />
                        </Link>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg font-bold text-orange-600">
                          ฿{formatTHB(product.price)}
                        </span>
                        {product.rating && product.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-slate-600">{product.rating}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                          ขายแล้ว {product.sold || 0} ชิ้น
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBuyNow(product)}
                            className="text-orange-600 hover:text-orange-700 p-1"
                            title="สั่งซื้อทันที"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="ลบสินค้า"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* List View */
                  <>
                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                          <Package className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 ml-6">
                      <h3 className="font-semibold text-slate-800 mb-1 group-hover:text-orange-600 transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                        {product.description || 'ไม่มีรายละเอียด'}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-bold text-orange-600">
                            ฿{formatTHB(product.price)}
                          </span>
                          <span className="text-sm text-slate-500">
                            ขายแล้ว {product.sold || 0} ชิ้น
                          </span>
                          {product.rating && product.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm text-slate-600">{product.rating}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-3">
                          <Link
                            href={safeProductHref(product)}
                            className="text-slate-600 hover:text-slate-800 p-2"
                            title="ดูสินค้า"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          <button
                            onClick={() => handleBuyNow(product)}
                            className="text-orange-600 hover:text-orange-700 p-2"
                            title="สั่งซื้อทันที"
                          >
                            <ShoppingCart className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id)}
                            className="text-red-500 hover:text-red-700 p-2"
                            title="ลบสินค้า"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
