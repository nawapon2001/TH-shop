"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import { getSellerUsername } from '@/lib/seller-auth'
import { Package, Edit3, Trash2, Save, X, Image as ImageIcon } from 'lucide-react'
import ProductOptionsManager from '@/components/ProductOptionsManager'

// Import shared types
type ProductOptionValue = {
  value: string
  price: number
  priceType: 'add' | 'replace'
}

type ProductOption = {
  name: string
  values: ProductOptionValue[]
}

export default function SellerManagePage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    price: 0,
    category: '',
    desc: '',
    options: [] as ProductOption[]
  })

  useEffect(() => {
    try {
      const u = getSellerUsername()
      if (!u) {
        router.push('/seller/auth')
        return
      }
      setUsername(u)
      fetchProducts(u)
      fetchCategories()
    } catch (err) {
      console.error(err)
    }
  }, [router])

  useEffect(() => {
    const currentTitle = document.title
    document.title = 'จัดการสินค้า - SellerHub'
    return () => {
      document.title = currentTitle
    }
  }, [])

  // Load categories from database
  async function fetchCategories() {
    try {
      const response = await fetch('/api/categories')
      const data = await response.json()
      
      if (Array.isArray(data) && data.length > 0) {
        // Handle both old format (array of strings) and new format (array of objects)
        if (typeof data[0] === 'string') {
          setCategories(data)
        } else {
          // New format with objects - extract names
          setCategories(data.map((cat: any) => cat.name))
        }
      } else {
        // Fallback categories
        setCategories([
          'ป้าย',
          'สติกเกอร์',
          'บัตร',
          'โบรชัวร์',
          'มือถือ & แท็บเล็ต',
          'คอมพิวเตอร์ & เกมมิ่ง',
          'แฟชั่นผู้หญิง',
          'แฟชั่นผู้ชาย',
          'ความงาม & สุขภาพ',
          'บ้าน & ไลฟ์สไตล์',
          'ซูเปอร์มาร์เก็ต',
          'อิเล็กทรอนิกส์',
          'กีฬา & กลางแจ้ง',
          'อื่นๆ'
        ])
      }
    } catch (error) {
      console.log('Failed to load categories, using fallback:', error)
      setCategories([
        'ป้าย',
        'สติกเกอร์',
        'บัตร',
        'โบรชัวร์',
        'มือถือ & แท็บเล็ต',
        'คอมพิวเตอร์ & เกมมิ่ง',
        'แฟชั่นผู้หญิง',
        'แฟชั่นผู้ชาย',
        'ความงาม & สุขภาพ',
        'บ้าน & ไลฟ์สไตล์',
        'ซูเปอร์มาร์เก็ต',
        'อิเล็กทรอนิกส์',
        'กีฬา & กลางแจ้ง',
        'อื่นๆ'
      ])
    }
  }

  async function fetchProducts(u: string) {
    setLoading(true)
    try {
      const response = await fetch(`/api/seller-products?username=${encodeURIComponent(u)}`)
      if (response.ok) {
        const data = await response.json()
        setProducts(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Fetch products error:', err)
    } finally {
      setLoading(false)
    }
  }

  function startEdit(product: any) {
    setEditingProduct(product)
    setEditForm({
      name: product.name || '',
      price: product.price || 0,
      category: product.category || '',
      desc: product.description || product.desc || '',
      options: product.options || []
    })
  }

  function cancelEdit() {
    setEditingProduct(null)
    setEditForm({
      name: '',
      price: 0,
      category: '',
      desc: '',
      options: []
    })
  }

  async function saveEdit() {
    if (!editForm.name || !editForm.price || !editForm.category) {
      Swal.fire('ข้อผิดพลาด', 'กรุณากรอกข้อมูลให้ครบถ้วน', 'error')
      return
    }

    setLoading(true)
    try {
      const payload = {
        username,
        productId: editingProduct._id,
        item: {
          name: editForm.name,
          price: editForm.price,
          category: editForm.category,
          desc: editForm.desc,
          options: editForm.options.length > 0 ? editForm.options : undefined
        }
      }

      const response = await fetch('/api/seller-products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        Swal.fire('สำเร็จ!', 'แก้ไขสินค้าเรียบร้อยแล้ว', 'success')
        cancelEdit()
        fetchProducts(username)
      } else {
        throw new Error('Failed to update product')
      }
    } catch (error) {
      console.error('Error updating product:', error)
      Swal.fire('ข้อผิดพลาด', 'ไม่สามารถแก้ไขสินค้าได้', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteProduct(productId: string, productName: string) {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ',
      text: `คุณต้องการลบสินค้า "${productName}" ใช่หรือไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก'
    })

    if (result.isConfirmed) {
      setLoading(true)
      try {
        const response = await fetch(`/api/seller-products?id=${encodeURIComponent(productId)}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          Swal.fire('สำเร็จ!', 'ลบสินค้าเรียบร้อยแล้ว', 'success')
          fetchProducts(username)
        } else {
          throw new Error('Failed to delete product')
        }
      } catch (error) {
        console.error('Error deleting product:', error)
        Swal.fire('ข้อผิดพลาด', 'ไม่สามารถลบสินค้าได้', 'error')
      } finally {
        setLoading(false)
      }
    }
  }

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">กำลังโหลดสินค้า...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Products Management */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 overflow-hidden hover:shadow-3xl transition-all duration-300">
          <div className="bg-gradient-to-r from-purple-500 via-violet-600 to-pink-600 p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Package className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">จัดการสินค้า</h1>
                  <p className="text-purple-100 mt-1">แก้ไขและลบสินค้าของคุณ</p>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-white font-bold text-lg">{products.length}</span>
                <span className="text-purple-100 text-sm ml-1">รายการ</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 sm:p-8">
            {products.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <Package className="w-16 h-16 text-purple-400" />
                </div>
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-bold text-slate-700 mb-3">ยังไม่มีสินค้าในร้าน</h3>
                  <p className="text-slate-500 leading-relaxed">ไปที่หน้าเพิ่มสินค้าเพื่อเริ่มต้นการขายออนไลน์</p>
                </div>
              </div>
            ) : (
              <div>
                {/* Edit Form Modal */}
                {editingProduct && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-white">แก้ไขสินค้า</h3>
                          <button
                            onClick={cancelEdit}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                          >
                            <X className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">ชื่อสินค้า</label>
                            <input
                              type="text"
                              value={editForm.name}
                              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                              placeholder="ระบุชื่อสินค้า"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">ราคา (บาท)</label>
                            <input
                              type="number"
                              value={editForm.price}
                              onChange={(e) => setEditForm({...editForm, price: Number(e.target.value)})}
                              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                              placeholder="0"
                              min="0"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">หมวดหมู่</label>
                            <select
                              value={editForm.category}
                              onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                              required
                            >
                              <option value="">เลือกหมวดหมู่</option>
                              {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">รายละเอียดสินค้า</label>
                          <textarea
                            value={editForm.desc}
                            onChange={(e) => setEditForm({...editForm, desc: e.target.value})}
                            rows={4}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none"
                            placeholder="อธิบายรายละเอียดสินค้า..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">ตัวเลือกสินค้า</label>
                          <div className="border-2 border-slate-200 rounded-xl p-4 bg-slate-50">
                            <ProductOptionsManager 
                              options={editForm.options} 
                              basePrice={editForm.price}
                              onChange={(options) => setEditForm({...editForm, options})} 
                            />
                          </div>
                        </div>
                        
                        <div className="flex gap-4">
                          <button
                            onClick={cancelEdit}
                            className="flex-1 px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium"
                          >
                            ยกเลิก
                          </button>
                          <button
                            onClick={saveEdit}
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                กำลังบันทึก...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                บันทึกการแก้ไข
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product, idx) => (
                    <div key={product._id || idx} className="group bg-white rounded-2xl border-2 border-slate-100 hover:border-purple-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1">
                      {/* Product Image */}
                      <div className="aspect-square bg-gradient-to-br from-slate-50 to-purple-50 overflow-hidden relative">
                        {product.image ? (
                          <div className="relative w-full h-full">
                            <img 
                              src={product.image} 
                              alt={product.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            />
                            {/* Multiple Images Indicator */}
                            {product.images && product.images.length > 1 && (
                              <div className="absolute bottom-3 right-3">
                                <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 backdrop-blur-sm">
                                  <ImageIcon className="w-3 h-3" />
                                  {product.images.length}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-24 h-24 rounded-full bg-white shadow-lg flex items-center justify-center">
                              <Package className="w-12 h-12 text-slate-300" />
                            </div>
                          </div>
                        )}
                        
                        {/* Category Badge */}
                        <div className="absolute top-3 left-3">
                          <span className="bg-white/90 backdrop-blur-sm text-slate-700 px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                            {product.category || 'ไม่ระบุ'}
                          </span>
                        </div>
                        
                        {/* Options Indicator */}
                        {product.options && product.options.length > 0 && (
                          <div className="absolute top-3 right-3">
                            <div className="bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg">
                              {product.options.length}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="p-6">
                        <div className="mb-4">
                          <h3 className="font-bold text-slate-800 text-lg leading-tight mb-2 line-clamp-2 group-hover:text-purple-700 transition-colors">
                            {product.name}
                          </h3>
                          
                          <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                            ฿{(product.price || 0).toLocaleString()}
                          </div>
                          
                          {(product.description || product.desc) && (
                            <p className="text-sm text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                              {product.description || product.desc}
                            </p>
                          )}
                        </div>
                        
                        {/* Product Options Preview */}
                        {product.options && product.options.length > 0 && (
                          <div className="mb-4 p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                            <div className="text-xs font-bold text-purple-700 mb-2 flex items-center gap-1">
                              <span>⚙️</span>
                              ตัวเลือกสินค้า ({product.options.length})
                            </div>
                            <div className="space-y-2">
                              {product.options.slice(0, 2).map((opt: any, optIdx: number) => (
                                <div key={optIdx}>
                                  <div className="text-xs font-medium text-slate-600 mb-1">{opt.name}:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {opt.values.slice(0, 3).map((val: any, valIdx: number) => (
                                      <span key={valIdx} className="text-xs bg-white text-purple-700 px-2 py-1 rounded-full border border-purple-200 shadow-sm">
                                        {val.value}
                                        {val.price !== 0 && (
                                          <span className="ml-1 text-xs text-purple-600 font-medium">
                                            {val.priceType === 'replace' 
                                              ? `฿${val.price.toLocaleString()}` 
                                              : `+฿${val.price.toLocaleString()}`
                                            }
                                          </span>
                                        )}
                                      </span>
                                    ))}
                                    {opt.values.length > 3 && (
                                      <span className="text-xs text-slate-400 px-2 py-1">
                                        +{opt.values.length - 3} อื่นๆ
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {product.options.length > 2 && (
                                <div className="text-xs text-slate-400 text-center pt-1">
                                  และอีก {product.options.length - 2} ตัวเลือก
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Additional Images Preview */}
                        {product.images && product.images.length > 1 && (
                          <div className="mb-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                            <div className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1">
                              <ImageIcon className="w-3 h-3" />
                              รูปภาพเพิ่มเติม ({product.images.length - 1})
                            </div>
                            <div className="grid grid-cols-4 gap-1">
                              {product.images.slice(1, 5).map((imgUrl: string, imgIdx: number) => (
                                <div key={imgIdx} className="aspect-square rounded-md overflow-hidden bg-white border border-blue-200">
                                  <img
                                    src={imgUrl}
                                    alt={`${product.name} ${imgIdx + 2}`}
                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                                  />
                                </div>
                              ))}
                              {product.images.length > 5 && (
                                <div className="aspect-square rounded-md bg-blue-100 border border-blue-200 flex items-center justify-center">
                                  <span className="text-xs text-blue-600 font-bold">+{product.images.length - 5}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(product)}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                          >
                            <Edit3 className="w-4 h-4" />
                            แก้ไข
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product._id, product.name)}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            ลบ
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
