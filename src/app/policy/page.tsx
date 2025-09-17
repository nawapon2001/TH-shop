import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'นโยบายความเป็นส่วนตัว - TH-Thai Shop',
  description: 'นโยบายความเป็นส่วนตัวและข้อกำหนดการใช้งาน',
}

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">นโยบายความเป็นส่วนตัว</h1>
          
          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">การเก็บรวบรวมข้อมูลส่วนบุคคล</h2>
              <p className="text-gray-600 mb-4">
                TH-Thai Shop เก็บรวบรวมข้อมูลส่วนบุคคลของท่านเพื่อการให้บริการที่ดีที่สุด ข้อมูลที่เก็บรวบรวมประกอบด้วย:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>ชื่อ นามสกุล</li>
                <li>ที่อยู่อีเมล</li>
                <li>หมายเลขโทรศัพท์</li>
                <li>ที่อยู่สำหรับจัดส่งสินค้า</li>
                <li>ข้อมูลการชำระเงิน (ไม่รวมรหัสบัตรเครดิต)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">การใช้ข้อมูลส่วนบุคคล</h2>
              <p className="text-gray-600 mb-4">
                เราใช้ข้อมูลส่วนบุคคลของท่านเพื่อ:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>ดำเนินการสั่งซื้อและจัดส่งสินค้า</li>
                <li>ติดต่อสื่อสารเกี่ยวกับคำสั่งซื้อ</li>
                <li>ให้บริการลูกค้าและการสนับสนุน</li>
                <li>ปรับปรุงและพัฒนาบริการ</li>
                <li>ส่งข้อมูลโปรโมชั่นและข่าวสาร (หากท่านยินยอม)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">การปกป้องข้อมูลส่วนบุคคล</h2>
              <p className="text-gray-600 mb-4">
                เรามีมาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อปกป้องข้อมูลส่วนบุคคลของท่าน:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>การเข้ารหัสข้อมูล (SSL Encryption)</li>
                <li>การควบคุมการเข้าถึงข้อมูล</li>
                <li>การตรวจสอบระบบรักษาความปลอดภัยเป็นประจำ</li>
                <li>การฝึกอบรมพนักงานเรื่องความปลอดภัยข้อมูล</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">สิทธิของเจ้าของข้อมูล</h2>
              <p className="text-gray-600 mb-4">
                ท่านมีสิทธิในการ:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>ขอเข้าถึงข้อมูลส่วนบุคคลของท่าน</li>
                <li>ขอแก้ไขหรือปรับปรุงข้อมูล</li>
                <li>ขอลบข้อมูลส่วนบุคคล</li>
                <li>ขอจำกัดการประมวลผลข้อมูล</li>
                <li>ถอนความยินยอมในการประมวลผลข้อมูล</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">การติดต่อ</h2>
              <p className="text-gray-600">
                หากท่านมีคำถามเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ สามารถติดต่อเราได้ที่:
              </p>
              <div className="mt-4 text-gray-600">
                <p>อีเมล: privacy@th-thai.shop</p>
                <p>โทรศัพท์: 02-xxx-xxxx</p>
                <p>ที่อยู่: กรุงเทพมหานคร ประเทศไทย</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">การปรับปรุงนโยบาย</h2>
              <p className="text-gray-600">
                เราอาจปรับปรุงนโยบายความเป็นส่วนตัวนี้เป็นครั้งคราว การเปลี่ยนแปลงจะมีผลทันทีที่เผยแพร่บนเว็บไซต์
              </p>
              <p className="text-gray-500 text-sm mt-4">
                อัพเดทล่าสุด: กันยายน 2025
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}