import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'แท็ก - TH-Thai Shop',
  description: 'แท็กและหมวดหมู่สินค้า',
}

export default function TagPage() {
  const popularTags = [
    { name: 'เสื้อผ้า', count: 1234, color: 'bg-blue-100 text-blue-800' },
    { name: 'อิเล็กทรอนิกส์', count: 892, color: 'bg-green-100 text-green-800' },
    { name: 'ของใช้ในบ้าน', count: 567, color: 'bg-purple-100 text-purple-800' },
    { name: 'เครื่องสำอาง', count: 445, color: 'bg-pink-100 text-pink-800' },
    { name: 'กีฬา', count: 334, color: 'bg-orange-100 text-orange-800' },
    { name: 'หนังสือ', count: 223, color: 'bg-yellow-100 text-yellow-800' },
    { name: 'ของเล่น', count: 156, color: 'bg-red-100 text-red-800' },
    { name: 'อาหาร', count: 134, color: 'bg-indigo-100 text-indigo-800' },
  ]

  const trendingTags = [
    'โปรโมชั่น', 'ลดราคา', 'ของใหม่', 'คุณภาพสูง', 'จัดส่งฟรี',
    'ยอดนิยม', 'ขายดี', 'แนะนำ', 'ราคาถูก', 'คุ้มค่า'
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">แท็กสินค้า</h1>
          
          {/* Search tags */}
          <div className="mb-8">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="ค้นหาแท็ก..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors">
                ค้นหา
              </button>
            </div>
          </div>

          {/* Popular tags */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">แท็กยอดนิยม</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {popularTags.map((tag, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${tag.color}`}>
                      #{tag.name}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">
                    {tag.count.toLocaleString()} สินค้า
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Trending tags */}
          <section className="mb-10">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">แท็กแนวโน้ม</h2>
            <div className="flex flex-wrap gap-3">
              {trendingTags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm cursor-pointer transition-colors"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </section>

          {/* Categories */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">หมวดหมู่สินค้า</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">👕</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">เสื้อผ้าและแฟชั่น</h3>
                <p className="text-gray-600 text-sm mb-4">
                  เสื้อผ้า รองเท้า กระเป๋า เครื่องประดับ
                </p>
                <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                  ดูสินค้า →
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">อิเล็กทรอนิกส์</h3>
                <p className="text-gray-600 text-sm mb-4">
                  โทรศัพท์ คอมพิวเตอร์ เครื่องใช้ไฟฟ้า
                </p>
                <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                  ดูสินค้า →
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">🏠</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">ของใช้ในบ้าน</h3>
                <p className="text-gray-600 text-sm mb-4">
                  เฟอร์นิเจอร์ ของตะแกรง เครื่องครัว
                </p>
                <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                  ดูสินค้า →
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">💄</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">เครื่องสำอาง</h3>
                <p className="text-gray-600 text-sm mb-4">
                  เครื่องสำอาง ผลิตภัณฑ์ดูแลผิว น้ำหอม
                </p>
                <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                  ดูสินค้า →
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">⚽</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">กีฬาและนันทนาการ</h3>
                <p className="text-gray-600 text-sm mb-4">
                  อุปกรณ์กีฬา เสื้อผ้ากีฬา รองเท้ากีฬา
                </p>
                <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                  ดูสินค้า →
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">📚</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">หนังสือและสื่อ</h3>
                <p className="text-gray-600 text-sm mb-4">
                  หนังสือ นิตยสาร ซีดี ดีวีดี
                </p>
                <button className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                  ดูสินค้า →
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}