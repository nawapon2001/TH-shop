# ใช้ Local Database สำหรับ Development

## เปลี่ยน .env ให้ใช้ local database:
DATABASE_URL="mysql://root:@localhost:3306/signshop_local"

## หรือใช้ environment variable ชั่วคราว:
cross-env DATABASE_URL="mysql://root:@localhost:3306/signshop_local" npm run db:push

## ขั้นตอน:
1. ติดตั้ง XAMPP: https://www.apachefriends.org/download.html
2. เปิด XAMPP Control Panel
3. Start Apache และ MySQL
4. เปิด http://localhost/phpmyadmin
5. สร้างฐานข้อมูลใหม่ชื่อ "signshop_local"
6. รันคำสั่ง: npm run db:local
