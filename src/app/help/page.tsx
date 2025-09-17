import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ช่วยเหลือ - TH-Thai Shop',
  description: 'คำถามที่พบบ่อยและการสนับสนุนลูกค้า',
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">ศูนย์ช่วยเหลือ</h1>
          
          <div className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">คำถามที่พบบ่อย</h2>
              
              <div className="space-y-4">
                <details className="border border-gray-200 rounded-lg p-4">
                  <summary className="font-medium text-gray-900 cursor-pointer">
                    วิธีการสั่งซื้อสินค้า
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>1. เลือกสินค้าที่ต้องการ</p>
                    <p>2. คลิก &quot;เพิ่มลงตะกร้า&quot;</p>
                    <p>3. ไปที่ตะกร้าสินค้าและตรวจสอบรายการ</p>
                    <p>4. คลิก &quot;สั่งซื้อ&quot; และกรอกข้อมูลการจัดส่ง</p>
                    <p>5. เลือกช่องทางการชำระเงิน</p>
                  </div>
                </details>

                <details className="border border-gray-200 rounded-lg p-4">
                  <summary className="font-medium text-gray-900 cursor-pointer">
                    วิธีการชำระเงิน
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>รองรับการชำระเงินผ่าน:</p>
                    <ul className="list-disc list-inside mt-2">
                      <li>บัตรเครดิต/เดบิต</li>
                      <li>โอนเงินผ่านธนาคาร</li>
                      <li>PromptPay</li>
                      <li>เก็บเงินปลายทาง</li>
                    </ul>
                  </div>
                </details>

                <details className="border border-gray-200 rounded-lg p-4">
                  <summary className="font-medium text-gray-900 cursor-pointer">
                    การจัดส่งและการติดตาม
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>- จัดส่งภายใน 1-3 วันทำการ</p>
                    <p>- ติดตามสถานะได้ที่หน้า &quot;คำสั่งซื้อของฉัน&quot;</p>
                    <p>- จัดส่งฟรีสำหรับคำสั่งซื้อตั้งแต่ 500 บาท</p>
                  </div>
                </details>

                <details className="border border-gray-200 rounded-lg p-4">
                  <summary className="font-medium text-gray-900 cursor-pointer">
                    นโยบายการคืนสินค้า
                  </summary>
                  <div className="mt-3 text-gray-600">
                    <p>- สามารถคืนสินค้าได้ภายใน 7 วัน</p>
                    <p>- สินค้าต้องอยู่ในสภาพเดิม</p>
                    <p>- ติดต่อ Call Center ก่อนส่งคืนสินค้า</p>
                  </div>
                </details>
              </div>
            </section>

            <section className="border-t pt-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">ติดต่อเรา</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Call Center</h3>
                  <p className="text-gray-600">โทร: 02-xxx-xxxx</p>
                  <p className="text-gray-600">เวลา: จ.-ศ. 8:00-20:00 น.</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">อีเมล</h3>
                  <p className="text-gray-600">support@th-thai.shop</p>
                  <p className="text-gray-600">ตอบภายใน 24 ชั่วโมง</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}