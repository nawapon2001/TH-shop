import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Goocode Studio — รับพัฒนาระบบ เว็บแอป & E-commerce',
  description:
    'Goocode Studio รับพัฒนาระบบทุกประเภท: เว็บแอป, โมบายล์แอป, ระบบภายในองค์กร, E-commerce, API/เชื่อมต่อฐานข้อมูล และบริการแก้บั๊ก/ปรับปรุงประสิทธิภาพ ติดต่อเพื่อรับคำปรึกษาฟรี',
}

export default function FollowPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-blue-600 to-orange-500 px-8 py-12 text-white">
            <div className="max-w-3xl">
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">Goocode Studio</h1>
              <p className="text-xl lg:text-2xl opacity-95 leading-relaxed">
                พัฒนาระบบที่ใช้งานได้จริง พร้อมสนับสนุนธุรกิจของคุณให้เติบโต
              </p>
              <p className="mt-4 text-lg opacity-90">
                รับพัฒนาระบบทุกประเภท: เว็บแอป, โมบายล์แอป, ระบบภายในองค์กร, E-commerce และบริการต่อเนื่อง
              </p>
            </div>
          </div>

          <div className="p-8 lg:p-12">
            
            {/* Quick Overview */}
            <section className="mb-12">
              <div className="bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl p-6 border-l-4 border-blue-500">
                <h2 className="text-2xl font-bold text-gray-900 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  คำแนะนำสั้น ๆ
                </h2>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Goocode — รับพัฒนาระบบทุกประเภท: เว็บแอป, โมบายล์แอป, ระบบภายในองค์กร, E-commerce, API/เชื่อมต่อฐานข้อมูล ไปจนถึงงานแก้บั๊ก/ปรับปรุงประสิทธิภาพ 
                  <br />
                  <span className="font-semibold text-blue-600">ติดต่อ: 064-747-2359, 066-109-3990</span>
                  <br />
                  <span className="text-orange-600 font-medium">Facebook: Goocode-Studio</span>
                </p>
              </div>
            </section>

            {/* Profile Section */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-orange-500 rounded mr-4"></span>
                โปรไฟล์ฉบับย่อ
              </h2>
              <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                <p className="text-gray-700 text-lg leading-relaxed">
                  Goocode Studio คือทีมพัฒนาซอฟต์แวร์ที่มุ่งเน้นการส่งมอบงานคุณภาพด้วยกระบวนการทำงานที่โปร่งใส เรารับออกแบบและพัฒนาระบบครบวงจร เริ่มจากวิเคราะห์ความต้องการ ออกแบบสถาปัตยกรรม เขียนโค้ด ทดสอบ และดูแลหลังส่งมอบ เหมาะสำหรับธุรกิจที่ต้องการระบบเสถียร ปรับขนาดได้ และมีการเชื่อมต่อกับบริการภายนอก เช่น ระบบชำระเงิน หรือ API ภายนอก ติดต่อเราเพื่อรับประเมินงานฟรีและแผนการพัฒนา
                </p>
              </div>
            </section>

            {/* Services Grid */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-orange-500 rounded mr-4"></span>
                บริการของเรา
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { icon: "🌐", title: "พัฒนาเว็บแอป", desc: "React, Next.js, Node.js" },
                  { icon: "📱", title: "พัฒนาโมบายล์แอป", desc: "iOS, Android, React Native" },
                  { icon: "🛒", title: "ระบบ E-commerce", desc: "และระบบตะกร้าสินค้า" },
                  { icon: "🔌", title: "API & Microservices", desc: "ออกแบบและพัฒนา API" },
                  { icon: "🗄️", title: "ฐานข้อมูล", desc: "MySQL, PostgreSQL, MongoDB" },
                  { icon: "🔧", title: "แก้ไขและปรับปรุง", desc: "บั๊ก, ประสิทธิภาพ, โค้ดรีวิว" },
                  { icon: "☁️", title: "Infrastructure", desc: "Deploy, CI/CD, Docker" }
                ].map((service, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-300">
                    <div className="text-3xl mb-3">{service.icon}</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-gray-600">{service.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* CTA Section */}
            <section className="mb-12">
              <div className="bg-gradient-to-r from-blue-600 to-orange-500 rounded-2xl p-8 text-white text-center">
                <h2 className="text-3xl font-bold mb-4">เริ่มงานกับเรา</h2>
                <p className="text-xl mb-8 opacity-95">เริ่มโปรเจกต์กับเราได้เลย — บรีฟสั้น ๆ ประเมินฟรี</p>
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-6">
                  <a href="tel:0647472359" className="bg-white text-blue-600 hover:bg-blue-50 py-4 px-8 rounded-xl font-semibold text-lg transition-colors duration-300 shadow-lg hover:shadow-xl">
                    📞 064-747-2359
                  </a>
                  <a href="tel:0661093990" className="bg-white/20 backdrop-blur text-white border-2 border-white hover:bg-white hover:text-blue-600 py-4 px-8 rounded-xl font-semibold text-lg transition-all duration-300">
                    📞 066-109-3990
                  </a>
                </div>
                <p className="text-lg opacity-90">
                  Facebook: <a className="underline hover:no-underline font-semibold" href="https://www.facebook.com/Goocode-Studio">Goocode-Studio</a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}